'use client';

import { exportJson } from '@/lib/csv';
import { sampleData } from '@/data/sampleData';
import { useLifegraphStore } from '@/store/useLifegraphStore';

export const ActionSection = () => {
  const data = useLifegraphStore((state) => state.data);
  const replaceData = useLifegraphStore((state) => state.replaceData);
  const clearData = useLifegraphStore((state) => state.clearData);
  const triggerRefresh = useLifegraphStore((state) => state.triggerRefresh);
  const markSaved = useLifegraphStore((state) => state.markSaved);
  const lastSavedAt = useLifegraphStore((state) => state.lastSavedAt);

  const handleSample = () => {
    replaceData(sampleData);
    triggerRefresh();
  };

  const handleSave = () => {
    markSaved();
    triggerRefresh();
  };

  const handleClear = () => {
    clearData();
    triggerRefresh();
  };

  const handleExport = () => {
    exportJson(data);
  };

  return (
    <div className="space-y-3 rounded-lg bg-surface p-4">
      <h3 className="text-lg font-semibold text-slate-100">Acties</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <button
          type="button"
          onClick={handleSample}
          className="rounded bg-accent/20 px-3 py-2 font-medium text-accent transition hover:bg-accent/30"
        >
          Laad voorbeelddata
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="rounded bg-emerald-500/20 px-3 py-2 font-medium text-emerald-300 transition hover:bg-emerald-500/30"
        >
          Opslaan
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="rounded bg-rose-500/20 px-3 py-2 font-medium text-rose-300 transition hover:bg-rose-500/30"
        >
          Wissen
        </button>
        <button
          type="button"
          onClick={handleExport}
          className="rounded bg-slate-700 px-3 py-2 font-medium text-slate-100 transition hover:bg-slate-600"
        >
          Exporteer JSON
        </button>
      </div>
      {lastSavedAt && (
        <p className="text-xs text-slate-500">
          Laatst opgeslagen: {new Date(lastSavedAt).toLocaleString('nl-NL')}
        </p>
      )}
    </div>
  );
};
