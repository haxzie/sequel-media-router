# @sequelsh/core

The Sequel client. No agent framework dependencies — adapters import this, not
the other way round.

```ts
import { Sequel } from '@sequelsh/core';

const sequel = new Sequel({ apiKey: process.env.SEQUEL_API_KEY });

const models = await sequel.search({ query: 'product photo', type: 'image' });
const schema = await sequel.schema(models[0].id);

const task = await sequel.run({
  model: '@cf/black-forest-labs/flux-1-schnell',
  prompt: 'a ceramic mug on seamless white',
});

console.log(task.task.assets?.[0]?.url);
```

Video does not finish inside the request:

```ts
const handle = await sequel.run({ model: 'google/veo-3.1', prompt: '…' });
const done = await handle.wait({ timeout: 300_000 });
```

`params` is the model's own input object. Most take `prompt`; text-to-speech
takes `text`, which is why `prompt` is a shorthand rather than the field.
