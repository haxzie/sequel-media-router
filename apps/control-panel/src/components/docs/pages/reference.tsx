import { Code, Table } from '../parts';

export function SdkReference() {
  return (
    <>
      <h1>SDK reference</h1>
      <p className="lead">
        <code>@sequelsh/core</code> has no agent-framework dependencies. Adapters import it, not
        the other way round.
      </p>

      <h2 id="constructor">new Sequel(options)</h2>
      <Table
        rows={[
          ['Option', 'Type', 'Notes'],
          ['apiKey', 'string', 'Falls back to SEQUEL_API_KEY'],
          ['baseUrl', 'string', 'Falls back to SEQUEL_BASE_URL, then the hosted API'],
          ['toolset', 'Toolset', 'Default for tools(); overridable per call'],
          ['fetch', 'typeof fetch', 'Swapped in tests'],
        ]}
      />

      <h2 id="search">search(options)</h2>
      <Table
        rows={[
          ['Option', 'Type', 'Notes'],
          ['query', 'string', 'Semantic. Omit to browse'],
          ['type', "'image' | 'video' | 'audio'", 'Narrow by modality'],
          ['limit', 'number', 'Default 10'],
        ]}
      />
      <Code>{`const models = await sequel.search({ query: 'talking avatar', type: 'video' });`}</Code>

      <h2 id="schema">schema(modelId)</h2>
      <p>
        Returns <code>{'{ id, modality, capabilities, inputSchema, rates }'}</code>.{' '}
        <code>inputSchema</code> is JSON Schema and is the authority on what the model accepts.
      </p>

      <h2 id="run">run(options)</h2>
      <Table
        rows={[
          ['Option', 'Type', 'Notes'],
          ['model', 'string', 'Required. From search — never invented'],
          ['params', 'object', "The model's own input object"],
          ['prompt', 'string', 'Shorthand folded into params.prompt'],
          ['signal', 'AbortSignal', 'Cancels the request, not the run'],
        ]}
      />
      <p>
        Returns a <code>TaskHandle</code>: <code>.task</code> is the task as it stands,{' '}
        <code>.done</code> whether it settled, <code>.wait(options)</code> polls until it does.
      </p>

      <h2 id="runmany">runMany(runs)</h2>
      <p>Takes an array of the same options. Parallel, returned in order.</p>

      <h2 id="tasks">tasks</h2>
      <Code>{`await sequel.tasks.get(id);
await sequel.tasks.list({ status, models, start, end, limit });`}</Code>

      <h2 id="uploads">upload / uploadUrl</h2>
      <Code>{`const url = await sequel.upload(file);            // does the PUT for you
const target = await sequel.uploadUrl('image/png'); // or do it yourself`}</Code>

      <h2 id="tools">tools(options)</h2>
      <Table
        rows={[
          ['Option', 'Type', 'Notes'],
          ['mode', "'discovery' | 'per-model'", "Default 'discovery'"],
          ['type', 'Modality | Modality[]', 'per-model only'],
          ['models', 'string[]', 'per-model only'],
          ['toolset', 'Toolset', 'Overrides the constructor default'],
        ]}
      />
      <Code>{`import { AISDKToolset } from '@sequelsh/ai-sdk';

const sequel = new Sequel({ apiKey, toolset: new AISDKToolset() });

await sequel.tools();
// search_models, get_model_schemas, run_models — constant prompt cost

await sequel.tools({ models: ['black-forest-labs/flux-1-schnell'], mode: 'per-model' });
// generate_cf_black_forest_labs_flux_1_schnell, with that model's schema`}</Code>
      <p>
        Discovery unless the model list is short and fixed. Per-model puts every schema in the
        prompt, which is fine for three and expensive for twenty.
      </p>

      <h2 id="errors">Errors</h2>
      <p>
        Any non-2xx throws <code>SequelError</code> with <code>status</code>, <code>message</code>{' '}
        from the server, and the parsed <code>body</code>.
      </p>
    </>
  );
}

export function ApiReference() {
  return (
    <>
      <h1>API reference</h1>
      <p className="lead">
        Plain HTTP, if you are not in TypeScript. The SDK is a wrapper over exactly this.
      </p>

      <h2 id="auth">Authentication</h2>
      <p>
        A bearer token on every request that spends money or reads your data. Reading the
        catalogue needs nothing.
      </p>
      <Code lang="bash">{`authorization: Bearer sk_sequel_…`}</Code>
      <p>
        Without one you get <code>401</code> and a <code>WWW-Authenticate</code> header. MCP
        clients can use OAuth instead; see <a href="/docs/mcp">MCP tools</a>.
      </p>

      <h2 id="endpoints">Endpoints</h2>
      <Table
        rows={[
          ['Method', 'Path', 'What it does'],
          ['GET', '/api/models', 'Catalogue. ?q= and ?type= to search. Open'],
          ['GET', '/api/models/:id/schema', "A model's input schema. Open"],
          ['POST', '/api/tasks', 'Run a model'],
          ['GET', '/api/tasks', 'List runs, scoped to your organisation'],
          ['GET', '/api/tasks/:id', 'One run'],
          ['POST', '/api/upload', 'Get an upload URL'],
          ['GET', '/api/usage', 'Spend summary'],
          ['GET', '/api/webhooks', 'Registered endpoints'],
        ]}
      />
      <p>
        Model ids contain slashes, so encode them:{' '}
        <code>/api/models/%40cf%2Fblack-forest-labs%2Fflux-1-schnell/schema</code>.
      </p>

      <h2 id="run">Running a model</h2>
      <Code lang="bash">{`curl -X POST https://api.sequel.sh/api/tasks \\
  -H "authorization: Bearer sk_sequel_…" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "black-forest-labs/flux-1-schnell",
    "input": { "prompt": "a ceramic mug on seamless white" }
  }'`}</Code>
      <p>
        Note <code>input</code> rather than <code>params</code> — the SDK renames it, the wire
        does not.
      </p>
      <Code lang="json">{`{
  "task_id": "task_1d212b8a6ca24206b2e7",
  "status": "completed",
  "result_url": "https://…/f/VC6mrteqQL",
  "assets": [{ "url": "https://…/f/VC6mrteqQL", "mime": "image/jpeg", "bytes": 170542 }],
  "cost": { "usd": "0.000634", "estimated": true, "basis": "4 tile(s) @ $0.000053" }
}`}</Code>

      <h2 id="errors">Errors</h2>
      <Table
        rows={[
          ['Status', 'Means', 'Notes'],
          ['400', 'Bad input', 'Unknown parameter names are refused, with the valid ones listed'],
          ['401', 'No usable credential', 'WWW-Authenticate names the scheme'],
          ['404', 'No such model or task', ''],
          ['429', 'Upstream rate limit', 'Retry with backoff'],
        ]}
      />
    </>
  );
}

export function McpReference({ url }: { url: string }) {
  return (
    <>
      <h1>MCP tools</h1>
      <p className="lead">
        The same catalogue, as tools an agent calls directly. This is what the install command
        connects you to.
      </p>

      <h2 id="connect">Connecting</h2>
      <Code lang="bash">{`claude mcp add --scope user --transport http sequel ${url}`}</Code>
      <p>
        No key in the URL. The client discovers the authorization server, opens a browser, and
        you approve there — the token goes to the client rather than through your clipboard.
      </p>

      <h2 id="tools">The tools</h2>
      <Table
        rows={[
          ['Tool', 'Takes', 'Returns'],
          ['search_models', 'query, type, limit', 'Matching models with price and latency'],
          ['get_model_schemas', 'model', 'JSON Schema, capabilities, rates'],
          ['run_models', 'model + input, or runs/prompts', 'Task, or tasks in order'],
          ['get_upload_url', 'content_type, extension', 'PUT target and read URL'],
          ['list_tasks', 'status, models, dates', 'Recent runs for your organisation'],
        ]}
      />

      <h2 id="batch">Batching</h2>
      <p>
        <code>run_models</code> takes several at once. Prefer <code>prompts</code> — it is a
        fraction of the JSON of a <code>runs</code> array, and a long one gets truncated
        mid-string by smaller models.
      </p>
      <Code lang="json">{`{
  "model": "black-forest-labs/flux-1-schnell",
  "input": { "steps": 8 },
  "prompts": ["a ceramic mug", "a leather wallet", "sunglasses"]
}`}</Code>

      <h2 id="action-info">action_info</h2>
      <p>
        Every tool takes an optional <code>action_info</code>: a short phrase saying what the
        call is for. It is display-only and stripped before the call runs, but it is what turns
        a trace of tool names into something a person can read.
      </p>
    </>
  );
}
