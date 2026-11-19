import { Code, Table } from '../parts';

export function Concepts() {
  return (
    <>
      <h1>Concepts</h1>
      <p className="lead">Four nouns. Everything else is a verb applied to them.</p>

      <h2 id="model">Model</h2>
      <p>
        A generator with an id, a modality and its own input schema. Ids are the provider&rsquo;s
        own — <code>black-forest-labs/flux-1-schnell</code>, <code>google/veo-3.1</code> — so
        they are recognisable and never invented by us.
      </p>
      <p>
        Every model declares what it accepts. That schema is the authority: there is no shared
        parameter list that models opt into, which is why <code>params</code> is the model&rsquo;s
        own object rather than a normalised one.
      </p>

      <h2 id="task">Task</h2>
      <p>
        One run. Created the moment you call <code>run</code>, before the provider is reached, so
        a run that fails still has a record saying why.
      </p>
      <Table
        rows={[
          ['Status', 'Means', 'What to do'],
          ['queued', 'Accepted, not started', 'Wait'],
          ['in_progress', 'Running — most video', 'Poll or take the webhook'],
          ['completed', 'Assets are attached', 'Read assets[0].url'],
          ['failed', 'error says why', 'Read error; the provider payload is kept'],
        ]}
      />

      <h2 id="asset">Asset</h2>
      <p>
        What came out: a URL, a mime type and a size. URLs are short handles that re-sign on
        each fetch, so they do not expire in your database the way a presigned URL does.
      </p>

      <h2 id="cost">Cost</h2>
      <p>
        Every task carries one. <code>estimated: true</code> means the provider bills by tokens
        and the real figure is not known until it reports usage — it is an honest unknown rather
        than a confident wrong number.
      </p>
    </>
  );
}

export function Search() {
  return (
    <>
      <h1>Search</h1>
      <p className="lead">
        Describe the job rather than naming a model. Search is semantic, so
        &ldquo;product photo on white&rdquo; finds the models that do that.
      </p>

      <Code>{`const models = await sequel.search({
  query: 'product photo on a white background',
  type: 'image',
});

// [{ id, name, provider, modality, capabilities, price, rates }]`}</Code>

      <h2 id="browse">Browsing</h2>
      <p>Omit the query to get the catalogue, optionally narrowed by modality.</p>
      <Code>{`await sequel.search();                 // everything
await sequel.search({ type: 'audio' }); // just audio`}</Code>

      <h2 id="schema">Then the schema</h2>
      <p>
        Search tells you a model exists. The schema tells you what it takes — call it before a
        run whenever you are unsure of a field name, rather than guessing and reading the error.
      </p>
      <Code>{`const schema = await sequel.schema('black-forest-labs/flux-1-schnell');
Object.keys(schema.inputSchema.properties); // ['prompt', 'steps']`}</Code>

      <h2 id="open">No key needed</h2>
      <p>
        Search and schema are open. An agent can look at the catalogue before anyone has signed
        up; only running a model needs a credential.
      </p>
    </>
  );
}

export function Generate() {
  return (
    <>
      <h1>Generate</h1>
      <p className="lead">
        One call. What comes back depends on the modality, not on how you asked.
      </p>

      <Code>{`const handle = await sequel.run({
  model: 'black-forest-labs/flux-1-schnell',
  params: { prompt: 'a ceramic mug on seamless white', steps: 8 },
});

handle.task.assets?.[0]?.url;`}</Code>

      <h2 id="params">params is the model&rsquo;s own input</h2>
      <p>
        Most models take <code>prompt</code>. Text-to-speech takes <code>text</code>. There is no
        normalised field, so <code>prompt</code> exists as a shorthand that folds into{' '}
        <code>params</code> rather than replacing it.
      </p>
      <Code>{`await sequel.run({ model: 'openai/gpt-image-2.5-flare', prompt: 'a mug' });
await sequel.run({ model: 'deepgram/aura-1', params: { text: 'Your order is on its way' } });`}</Code>

      <h2 id="batch">Several at once</h2>
      <p>They go in parallel. One failure does not take down the others.</p>
      <Code>{`const handles = await sequel.runMany([
  { model: 'flux', prompt: 'a mug' },
  { model: 'flux', prompt: 'a wallet' },
]);`}</Code>

      <h2 id="reference">Reference images</h2>
      <p>
        Upload, then pass the URL. The server fetches and encodes it for providers that want
        base64, so you never deal with that yourself.
      </p>
      <Code>{`const url = await sequel.upload(file);

await sequel.run({
  model: 'openai/gpt-image-2.5-flare',
  params: { prompt: 'turn this into a silk scarf', images: [url] },
});`}</Code>
      <p>
        Check the schema first — the field differs by model (<code>images</code>,{' '}
        <code>image_url</code>, <code>first_frame_image</code>), and a text-to-image model
        ignores a reference silently.
      </p>

      <h2 id="prompting">Writing a good prompt</h2>
      <ul>
        <li>Prose, not comma-separated tags. These encoders are trained on sentences.</li>
        <li>
          Concrete over decorative. Materials, lens and lighting move the result; &ldquo;8K,
          masterpiece&rdquo; does nothing.
        </li>
        <li>
          Say what should be in frame, never what should not. &ldquo;No people&rdquo; tends to
          summon people.
        </li>
      </ul>
    </>
  );
}

export function Tasks() {
  return (
    <>
      <h1>Tasks</h1>
      <p className="lead">
        Image and audio finish inside the call. Video does not, and that is the only reason this
        page exists.
      </p>

      <h2 id="wait">Waiting</h2>
      <Code>{`const handle = await sequel.run({ model: 'google/veo-3.1', prompt: '…' });

handle.task.status;  // 'in_progress'
const done = await handle.wait({ timeout: 300_000 });`}</Code>
      <p>
        <code>wait</code> polls with backoff, starting at a second and settling at five. It is
        for scripts and notebooks — in production take the webhook instead, so nothing is holding
        a connection open for three minutes.
      </p>

      <h2 id="fetch">Fetching and listing</h2>
      <Code>{`await sequel.tasks.get('task_1d212b8a6ca24206b2e7');

await sequel.tasks.list({
  status: ['completed'],
  models: ['black-forest-labs/flux-1-schnell'],
});`}</Code>
      <p>
        Lists are scoped to the organisation your credential belongs to — never to a parameter,
        so no key can read another team&rsquo;s runs.
      </p>

      <h2 id="webhooks">Webhooks</h2>
      <p>
        Register one in <strong>Settings → Webhooks</strong>. Completed and failed tasks are
        posted as an event with a signature over the body:
      </p>
      <Code lang="json">{`{
  "id": "evt_…",
  "type": "task.completed",
  "created": 1794906241,
  "apiVersion": "2026-11-15",
  "data": { "task": { "task_id": "task_…", "status": "completed", "assets": [ … ] } }
}`}</Code>
    </>
  );
}

export function Files() {
  return (
    <>
      <h1>Files</h1>
      <p className="lead">
        Anything you want a model to look at has to be somewhere it can fetch.
      </p>

      <Code>{`const url = await sequel.upload(file);   // File or Blob
// → https://…/f/VC6mrteqQL`}</Code>

      <p>
        One call does both halves: it takes an upload URL, PUTs the bytes, and gives you back the
        URL the model will read. Pass that URL straight into <code>params</code>.
      </p>

      <h2 id="manual">Doing it yourself</h2>
      <Code>{`const target = await sequel.uploadUrl('image/png', 'png');
await fetch(target.uploadUrl, { method: 'PUT', body: bytes });
// target.fileUrl is readable now`}</Code>

      <h2 id="handles">Why the URLs are short</h2>
      <p>
        A <code>/f/&lt;id&gt;</code> handle re-signs on every fetch. A presigned URL is four
        hundred characters and expires in days — bad to store, and worse to hand to an agent that
        pays tokens for every character it relays.
      </p>
    </>
  );
}
