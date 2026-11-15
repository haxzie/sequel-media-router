# Ledger and spend gating — plan

Status: proposal. Nothing here is built.

## Where we are

| Thing | Today |
| --- | --- |
| Money in | `walletCredit` rows in D1 — amount, fee, tax, total, source |
| Money out | **Not recorded.** Derived by summing `costUsd` over tasks |
| Balance | `sum(credits) − sum(task costs)`, computed per request |
| Gating | None. Every run proceeds regardless of balance |
| Amounts | Strings with 6 decimals, added as JS floats |

Three consequences worth stating plainly before any design:

**1. The balance is computed across two stores that cannot be read together.**
Credits are in D1; task costs are in `.data/store.json`. There is no snapshot
in which both are consistent, so "what is the balance" has no single answer
under concurrent writes.

**2. `money()` clamps negatives to zero.** `addMoney('1.00', '-3.96')` returns
`0.000000`. An overdrawn wallet therefore reads `$0.00 available`, and the
warning-tone branch in the wallet card is unreachable. Measured, not inferred.

**3. Almost every cost is an estimate.** `costEstimated` is true for nearly
every task, and token-billed models (gpt-image) record `$0.00` because
Cloudflare returns no usage at all. A ledger built on these is exactly as
right as the estimates — which is the real limit on gating, not the schema.

## What to build

### 1. Double-entry, append-only

One `ledgerEntry` table. Every movement is at least two rows that sum to zero,
grouped by `transactionId`. Nothing is ever updated or deleted; a mistake is
corrected by a reversing transaction.

```
ledgerEntry
  id              text pk          led_...
  transactionId   text             groups the balanced set
  account         text             see accounts below
  organizationId  text null        null for platform-owned accounts
  amountMicros    integer          signed; debit positive, credit negative
  currency        text             'USD' for now, present so it is not assumed
  kind            text             topup | usage | fee | tax | adjustment | refund | grant
  referenceType   text null        task | walletCredit | provider_invoice
  referenceId     text null
  createdAt       text
```

Accounts:

| Account | Type | Meaning |
| --- | --- | --- |
| `org:<id>:wallet` | liability | credit we owe this org in usage |
| `platform:cash` | asset | money actually received |
| `platform:revenue:fees` | revenue | our platform fee |
| `platform:tax:payable` | liability | tax collected, owed onward |
| `platform:cogs:providers` | expense | what the provider charges us |

A $25 top-up with a $1.25 fee:

```
platform:cash          +26.25
org:x:wallet           -25.00
platform:revenue:fees   -1.25
```

A run costing $0.78:

```
org:x:wallet           +0.78
platform:cogs:providers -0.78
```

Why double-entry rather than a signed column: it makes the question "where did
the money go" answerable, and it makes drift detectable — any transaction
whose entries do not sum to zero is a bug the database can refuse.

### 2. Integer micro-dollars, not float strings

`amountMicros` is a 64-bit integer; `bigint` in TypeScript. Rates go to
$0.0000528 per tile, so cents are too coarse and micros are what the existing
6-decimal strings already imply.

This removes a class of bug rather than a specific one: today the sorting in
`usageBreakdown` compares `Number(b.usd) - Number(a.usd)`, and `money()`
silently floors negatives. Neither survives contact with an integer type.

### 3. Holds, so gating is correct under concurrency

Gating on a balance read is a time-of-check/time-of-use race: two runs can both
read $1.00 and both spend it. Three phases instead:

```
authorize(org, estimateMicros, taskId) -> holdId   // fails if insufficient
  run
capture(holdId, actualMicros)                      // writes the ledger entries
  or void(holdId)                                  // failed before spending
```

```
walletHold
  id, organizationId, taskId, amountMicros,
  state (open|captured|voided), createdAt, expiresAt
```

`available = balance − sum(open holds)`.

**The atomicity question is the hard part.** D1 is SQLite with no
`SELECT FOR UPDATE`. Two options, and this needs a decision:

- **Conditional insert.** `INSERT INTO walletHold SELECT ... WHERE (SELECT
  balance - holds ...) >= ?` — one statement, atomic in SQLite. Simple, keeps
  everything in D1. Each authorize re-aggregates, so it needs a cached balance
  row to stay cheap as the ledger grows.
- **A Durable Object per organisation.** Serializes authorize/capture by
  construction and is the Cloudflare-native answer. More moving parts, and the
  DO becomes the authority rather than D1.

Recommendation: conditional insert first, with a `walletBalance` cache row
updated in the same batch. Move to a DO if contention shows up.

Expired holds must be swept — a run that dies without capture or void would
otherwise reserve funds forever. Cron, or opportunistically on each authorize.

### 4. Estimate → actual

`capture` takes the actual where a provider reports one and the estimate where
it does not, and records which. The difference from the hold is simply the
captured amount; no adjustment needed in the common case.

When an invoice later contradicts us, that is an `adjustment` transaction
against `platform:cogs:providers`, not an edit. The ledger stays append-only
and the disagreement stays visible.

gpt-image cannot be metered today — Cloudflare returns no usage. Options:
publish a per-size/quality estimate from OpenAI's documented token counts, or
refuse to gate that model and mark its spend unmetered. Either is honest;
silently recording $0.00 is not.

### 5. Gating policy

Refuse in `runModel`, after model validation and before the provider call, so
nothing is spent on a request that will not be allowed. The error wants to be
structured, because an agent reads it:

```json
{ "error": "insufficient_funds",
  "available_usd": "0.12", "required_usd": "0.80",
  "message": "Add funds in the dashboard, or pick a cheaper model." }
```

Decisions this needs:
- Overdraft allowance — none, or a small buffer so a run in flight is never
  severed mid-way?
- Free tier and trial credit are the same mechanism: a `grant` transaction. No
  new code path.
- Does the platform fee apply to usage as well as top-ups, or only top-ups?
  That is a pricing decision, and the ledger shape depends on the answer.

### 6. Reconciliation

A daily job that asserts, per account: the ledger sums to the cached balance,
every transaction sums to zero, and `platform:cogs:providers` matches what
Cloudflare actually billed. Drift is surfaced, not corrected automatically —
an automatic correction hides the bug that caused it.

## Order of work

| Phase | Lands | Depends on |
| --- | --- | --- |
| 0 | Fix `money()` clamping; show negative balances | — |
| 1 | Tasks into D1 with `organizationId` indexed | the storage migration already planned |
| 2 | `ledgerEntry` + micro-dollars; backfill credits and task costs as opening entries | 1 |
| 3 | Balance from the ledger; `walletBalance` cache | 2 |
| 4 | Holds, `authorize`/`capture`/`void`, sweeper | 3 |
| 5 | Gating in `runModel` with the structured error | 4 |
| 6 | Reconciliation job and a drift report | 3 |

Phase 1 is the real prerequisite. A ledger whose debits live in a JSON file
rewritten on every write is not a ledger, and no amount of schema design
downstream fixes that.

## What this does not solve

- **Estimates.** Gating on an estimate means the true cost can still exceed the
  balance. The ledger makes the gap visible; it does not close it.
- **Tax.** Still not calculated, and a real ledger makes that more conspicuous
  rather than less. Stripe Tax or equivalent is a separate decision.
- **Currency.** `currency` exists on the row so it is not assumed away, but
  everything else here is single-currency. Multi-currency needs rates and a
  policy about which side of the trade holds the risk.
