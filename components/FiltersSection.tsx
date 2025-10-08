'use client';

import { useLifegraphStore } from '@/store/useLifegraphStore';

const filterConfig = [
  { key: 'work', label: 'Werk' },
  { key: 'family', label: 'Gezin' },
  { key: 'health', label: 'Health / Sport' },
  { key: 'school', label: 'School' }
] as const;

export const FiltersSection = () => {
  const filters = useLifegraphStore((state) => state.filters);
  const setFilters = useLifegraphStore((state) => state.setFilters);
  const triggerRefresh = useLifegraphStore((state) => state.triggerRefresh);

  const handleToggle = (key: (typeof filterConfig)[number]['key']) => {
    setFilters({ [key]: !filters[key] });
  };

  return (
    <div className="space-y-4 rounded-lg bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-100">Filters</h3>
        <button
          type="button"
          onClick={triggerRefresh}
          className="rounded bg-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-600"
        >
          Refresh
        </button>
      </div>
      <div className="space-y-2 text-sm text-slate-200">
        {filterConfig.map((filter) => (
          <label key={filter.key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters[filter.key]}
              onChange={() => handleToggle(filter.key)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-accent focus:ring-accent"
            />
            {filter.label}
          </label>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        Pas de graph en inzichten direct aan. Gebruik Refresh om Cytoscape opnieuw te laten positioneren.
      </p>
    </div>
  );
};
