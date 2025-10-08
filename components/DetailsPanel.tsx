'use client';

import { DetailSelection, Deal, Event, Person, Workout } from '@/types/data';

const formatKey = (key: string) =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (char) => char.toUpperCase());

const renderEntityDetails = (entity: Person | Event | Deal | Workout) => {
  const entries = Object.entries(entity).filter(([key]) => !['id', 'type'].includes(key));
  return (
    <dl className="grid grid-cols-1 gap-2 text-sm">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded border border-slate-800 bg-slate-900/40 p-2">
          <dt className="text-xs uppercase tracking-wide text-slate-500">{formatKey(key)}</dt>
          <dd className="text-slate-200">{String(value ?? '—')}</dd>
        </div>
      ))}
    </dl>
  );
};

const renderEdgeDetails = (payload: Record<string, unknown>) => (
  <dl className="grid grid-cols-1 gap-2 text-sm">
    {Object.entries(payload).map(([key, value]) => (
      <div key={key} className="rounded border border-slate-800 bg-slate-900/40 p-2">
        <dt className="text-xs uppercase tracking-wide text-slate-500">{formatKey(key)}</dt>
        <dd className="text-slate-200">{String(value ?? '—')}</dd>
      </div>
    ))}
  </dl>
);

export const DetailsPanel = ({ selection }: { selection: DetailSelection }) => {
  return (
    <div className="flex h-full flex-col gap-3 rounded-lg bg-surface p-4">
      <h3 className="text-lg font-semibold text-slate-100">Details</h3>
      {!selection && <p className="text-sm text-slate-500">Selecteer een node of edge voor context.</p>}
      {selection?.kind === 'node' && renderEntityDetails(selection.data)}
      {selection?.kind === 'edge' && renderEdgeDetails(selection.data)}
    </div>
  );
};
