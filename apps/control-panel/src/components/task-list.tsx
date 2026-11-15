'use client';

import { useEffect, useMemo, useState } from 'react';
import { Avatar } from '@sequel/ui';
import { formatUsd } from '@sequel/core/pricing';
import { TaskPanel, type TaskSummary } from './task-panel';
import { Card, PageHeader, Segmented, StatusDot } from '@sequel/ui';

type TaskRow = TaskSummary;

const STATUS_COLOR: Record<TaskRow['status'], string> = {
  queued: '#6b6b6b',
  in_progress: 'var(--color-sky)',
  completed: 'var(--color-mint)',
  failed: 'var(--color-pink)',
};

const STATUS_LABEL: Record<TaskRow['status'], string> = {
  queued: 'Queued',
  in_progress: 'Running',
  completed: 'Completed',
  failed: 'Failed',
};

type Filter = 'all' | 'in_progress' | 'completed' | 'failed';

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'in_progress', label: 'Running' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

function when(iso: string): string {
  const mins = Math.floor((Date.now() - Date.parse(iso)) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}

export function TaskList() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loaded, setLoaded] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const load = () =>
      fetch('/api/tasks')
        .then((r) => r.json() as Promise<{ tasks: TaskRow[] }>)
        .then((data) => setTasks(data.tasks ?? []))
        .catch(() => undefined)
        .finally(() => setLoaded(true));

    load();
    // Video takes a minute or two; poll so running rows settle on their own.
    const timer = setInterval(load, 4000);
    return () => clearInterval(timer);
  }, []);

  const visible = useMemo(
    () => (filter === 'all' ? tasks : tasks.filter((t) => t.status === filter)),
    [tasks, filter],
  );

  // Follow the polled copy rather than a snapshot, so a panel left open on a
  // running video fills in its player the moment the task completes.
  const open = useMemo(
    () => tasks.find((t) => t.task_id === openId) ?? null,
    [tasks, openId],
  );

  const spend = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== 'failed')
        .reduce((sum, t) => sum + Number(t.cost.usd), 0),
    [tasks],
  );

  return (
    <>
      <PageHeader
        breadcrumb={['Sequel', 'Tasks']}
        title="Tasks"
        meta={
          <>
            {tasks.length} run{tasks.length === 1 ? '' : 's'} · {formatUsd(spend)} estimated ·
            running rows refresh automatically
          </>
        }
      />

      <div className="mb-6">
        <Segmented value={filter} options={FILTERS} onChange={setFilter} />
      </div>

      {!loaded ? (
        <Card className="px-5 py-14 text-center text-[13px] text-[var(--color-muted)]">
          Loading…
        </Card>
      ) : visible.length === 0 ? (
        <Card className="px-5 py-16 text-center">
          <div className="text-[14px] text-[var(--color-text)]">
            {filter === 'all' ? 'No runs yet' : `No ${filter.replace('_', ' ')} runs`}
          </div>
          <div className="mt-2 text-[13px] text-[var(--color-muted)]">
            Call <code className="font-mono text-[12px]">run_models</code> over MCP, or POST to{' '}
            <code className="font-mono text-[12px]">/api/tasks</code>.
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-line)]">
                {['Status', 'Prompt', 'Model', 'By', 'Cost', 'When', ''].map((heading, index) => (
                  <th
                    key={heading || index}
                    className={[
                      'px-5 py-3 text-[12px] font-medium text-[var(--color-dim)]',
                      index === 4 ? 'text-right' : 'text-left',
                    ].join(' ')}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((task, index) => (
                <tr
                  key={task.task_id}
                  onClick={() => setOpenId(task.task_id)}
                  className={[
                    'cursor-pointer transition-colors hover:bg-[var(--color-card-hover)]',
                    task.task_id === openId ? 'bg-[var(--color-card-hover)]' : '',
                    index > 0 ? 'border-t border-[var(--color-line)]' : '',
                  ].join(' ')}
                >
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <StatusDot color={STATUS_COLOR[task.status]}>
                      <span className="text-[var(--color-muted)]">
                        {STATUS_LABEL[task.status]}
                      </span>
                    </StatusDot>
                  </td>

                  <td className="max-w-[260px] px-5 py-3.5">
                    <div className="truncate text-[13px]">{task.label}</div>
                    {task.error && (
                      <div className="mt-0.5 truncate text-[12px] text-[var(--color-pink)]">
                        {task.error}
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-3.5">
                    <code className="font-mono text-[11px] text-[var(--color-dim)]">
                      {task.model}
                    </code>
                  </td>

                  <td className="whitespace-nowrap px-5 py-3.5">
                    {task.created_by ? (
                      <span
                        className="inline-flex items-center"
                        title={`${task.created_by.name} · ${task.created_by.via.replace('_', ' ')}`}
                      >
                        <Avatar
                          name={task.created_by.name}
                          src={task.created_by.image}
                          size={22}
                        />
                      </span>
                    ) : (
                      <span className="text-[12px] text-[var(--color-dim)]">—</span>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-5 py-3.5 text-right">
                    <span className="nums text-[13px]">{formatUsd(task.cost.usd)}</span>
                    {task.cost.estimated && (
                      <span className="ml-1.5 text-[11px] text-[var(--color-dim)]">est</span>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-5 py-3.5 text-[12px] text-[var(--color-dim)]">
                    {when(task.created_at)}
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <span className="text-[12px] text-[var(--color-muted)]">
                      {task.result_url ? 'View' : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {open && <TaskPanel task={open} onClose={() => setOpenId(null)} />}
    </>
  );
}
