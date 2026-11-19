---
title: Video is asynchronous, and your code should say so
description: Image and audio return inside the call. Video does not. The teams that get this wrong all make the same four mistakes.
author: Musthaq Ahamad
authorTitle: Product engineer, Sequel
date: 2026-11-16
cover: /landing/08.jpg
coverAlt: A figure seated under fluorescent light in a laundromat
tags: [engineering, video]
faq:
  - question: How long does a video run take?
    answer: Between twenty seconds and a few minutes, depending on model, duration and resolution. The catalogue publishes a rough figure per model, which is advisory and never billed on.
  - question: Should I poll or use a webhook?
    answer: Poll in a script you are watching. Use a webhook anywhere a process might be recycled before the run finishes, which includes every serverless runtime.
  - question: What happens if my webhook endpoint is down?
    answer: The task still completes and keeps its result. Fetch it by id whenever you come back, so a missed delivery costs you a notification rather than the generation you paid for.
---

Image and audio generation finish inside the request. You call, you wait a
few seconds, you get a URL. Video does not work that way, and the gap
between those two facts is where most integrations break.

## What comes back

A video run returns immediately with a task in progress:

```json
{ "status": "in_progress", "task_id": "task_9f2c…" }
```

That is a success. The generation is running; the response is telling you
where to collect it.

## The four mistakes

**Treating `in_progress` as failure.** It has no assets, so a check for
`assets[0].url` throws, and the run gets retried — paid for twice, delivered
once.

**Polling from a serverless function.** The function is billed for the wait
and recycled halfway through it. Take the webhook.

**Telling the user it is done.** An agent that says "here is your video"
before the webhook has fired is lying in a way the user will discover in
about ninety seconds.

**Forgetting the cost is already known.** The estimate comes back with the
task, before a frame exists. You can show it, cap it, or refuse it without
waiting.

## What to write instead

In a script, wait on the handle. In production, take the webhook and treat
the run as a job rather than a call — it is one.
