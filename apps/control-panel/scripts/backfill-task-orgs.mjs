/**
 * One-shot: file existing tasks under an organisation.
 *
 * Tasks predate organisation scoping, so every one of them is unassigned and
 * therefore invisible to every team. This assigns each to its creator's
 * organisation where attribution exists, and leaves the rest alone — an
 * anonymous run has no team to belong to, and guessing one would put a
 * stranger's output in somebody's list.
 *
 *   node scripts/backfill-task-orgs.mjs            # report only
 *   node scripts/backfill-task-orgs.mjs --apply
 *   node scripts/backfill-task-orgs.mjs --apply --orphans-to org_xxx
 */
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const STORE = '.data/store.json';
const apply = process.argv.includes('--apply');
const orphansToIndex = process.argv.indexOf('--orphans-to');
const orphansTo = orphansToIndex > -1 ? process.argv[orphansToIndex + 1] : null;

function d1(sql) {
  const out = execFileSync(
    'npx',
    ['wrangler', 'd1', 'execute', 'sequel', '--local', '--command', sql, '--json'],
    { encoding: 'utf8' },
  );
  return JSON.parse(out.slice(out.indexOf('[')))[0].results;
}

const memberships = d1('select userId, organizationId from member');
const orgByUser = new Map();
for (const row of memberships) {
  if (!orgByUser.has(row.userId)) orgByUser.set(row.userId, row.organizationId);
}

const store = JSON.parse(readFileSync(STORE, 'utf8'));
let assigned = 0;
let orphaned = 0;

for (const task of store.tasks) {
  if (task.organizationId) continue;
  const org = orgByUser.get(task.createdBy?.userId);
  if (org) {
    task.organizationId = org;
    assigned += 1;
  } else if (orphansTo) {
    task.organizationId = orphansTo;
    assigned += 1;
  } else {
    orphaned += 1;
  }
}

console.log(`${assigned} task(s) assigned, ${orphaned} left unassigned.`);

if (!apply) {
  console.log('Dry run. Re-run with --apply to write.');
} else {
  copyFileSync(STORE, `${STORE}.bak`);
  writeFileSync(STORE, JSON.stringify(store, null, 2));
  console.log(`Written. Previous store kept at ${STORE}.bak`);
}
