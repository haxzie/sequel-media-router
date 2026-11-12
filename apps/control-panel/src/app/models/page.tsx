import { ModelBrowser } from '@/components/model-browser';

export const metadata = { title: 'Models — Forge' };

export default function ModelsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <ModelBrowser />
    </div>
  );
}
