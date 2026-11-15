import { TaskList } from '@/components/task-list';

export const metadata = { title: 'Tasks — Sequel' };

export default function TasksPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <TaskList />
    </div>
  );
}
