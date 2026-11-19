---
title: Stop hardcoding model ids
description: A model id in your source is a bet that nothing better ships. Here is what to write instead, and what it costs you when the catalogue moves.
author: Musthaq Ahamad
authorTitle: Product engineer, Sequel
date: 2026-11-12
cover: /landing/06.jpg
coverAlt: A figure photographed from below against a concrete tower
tags: [engineering, models]
faq:
  - question: Does letting an agent choose a model make runs unpredictable?
    answer: Less than hardcoding does. A pinned id has one behaviour until the day it is deprecated, and then it has none. Search ranks on capability first and price second, so the set it chooses from is always one you would have accepted.
  - question: Can I still pin a model when I need to?
    answer: Yes. Pass the id to run and nothing else happens — search is a convenience, not a gate. Pin when output has to match something already shipped, like a series of images in one style.
  - question: What happens when a model is retired?
    answer: It leaves the catalogue and search stops returning it. Code that searched keeps working. Code that pinned it gets an error naming the model, which is the point at which a hardcoded id was always going to cost you an afternoon.
---

Every integration with a media model starts the same way. You read a
comparison, you pick a model, and you paste its id into your source. The
line looks harmless:

```ts
const model = 'black-forest-labs/flux-1-schnell';
```

It is a bet. You are wagering that nothing meaningfully better ships before
you next open this file, and in generative media that bet has been losing
roughly every six weeks.

## What the id is actually doing

An id in source pins three separate decisions that have nothing to do with
each other: which capability you need, which quality tier you are paying
for, and which vendor happens to lead today. The first changes rarely. The
second changes when your budget does. The third changes constantly.

Pinning all three in one string means a change to any of them is a code
change, a review, and a deploy.

## Describe the job instead

The alternative is to say what the output has to be, and let the catalogue
resolve it at call time:

```ts
const [best] = await sequel.search({
  query: 'poster art where the text has to be legible',
  type: 'image',
});

await sequel.run({ model: best.id, prompt });
```

Search ranks on capability before price, so a model that cannot render
legible text is not a cheaper option — it is not an option. The cheapest
model that can actually do the work comes back first.

## What this costs

One extra call, cached for the life of the process. In exchange, the day a
better model lands you get it without touching the file.

## When to pin anyway

Pin when consistency matters more than quality: a set of images that have to
match ones already published, a voice a customer recognises, a style you
have tuned prompts against for a month. Those are real reasons, and they
are narrower than the habit of pinning everything.
