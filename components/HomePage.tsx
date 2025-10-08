'use client';

import { ActionSection } from '@/components/ActionSection';
import { DetailsPanel } from '@/components/DetailsPanel';
import { FiltersSection } from '@/components/FiltersSection';
import { InsightsPanel } from '@/components/InsightsPanel';
import { UploadSection } from '@/components/UploadSection';
import { useLifegraphStore } from '@/store/useLifegraphStore';
import dynamic from 'next/dynamic';
import type { GraphViewProps } from '@/components/GraphView';

const GraphView = dynamic<GraphViewProps>(
  () => import('@/components/GraphView').then((mod) => mod.GraphView),
  { ssr: false }
);

export const HomePage = () => {
  const data = useLifegraphStore((state) => state.data);
  const filters = useLifegraphStore((state) => state.filters);
  const refreshToken = useLifegraphStore((state) => state.refreshToken);
  const selection = useLifegraphStore((state) => state.selection);
  const setSelection = useLifegraphStore((state) => state.setSelection);

  return (
    <main className="px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-50">LifeGraph Lite</h1>
          <p className="max-w-2xl text-sm text-slate-400">
            Een lichte cockpit voor relaties tussen mensen, deals, meetings en workouts. Upload CSV-bestanden,
            visualiseer het netwerk en krijg snelle inzichten over de afgelopen weken.
          </p>
        </header>
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[320px,1fr,320px]">
          <aside className="order-1 space-y-4 lg:order-none">
            <UploadSection />
            <FiltersSection />
            <ActionSection />
          </aside>
          <div className="order-3 flex flex-col gap-4 lg:order-none">
            <div className="min-h-[400px] rounded-lg border border-slate-800 bg-surface p-2">
              <GraphView data={data} filters={filters} refreshToken={refreshToken} onSelect={setSelection} />
            </div>
            <InsightsPanel data={data} filters={filters} />
          </div>
          <div className="order-2 lg:order-none">
            <DetailsPanel selection={selection} />
          </div>
        </section>
      </div>
    </main>
  );
};

export default HomePage;
