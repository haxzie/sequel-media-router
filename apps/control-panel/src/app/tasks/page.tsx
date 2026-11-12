import { TaskList } from '@/components/task-list';

export const metadata = { title: 'Tasks — Forge' };

export default function TasksPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <TaskList />
    </div>
  );
}
