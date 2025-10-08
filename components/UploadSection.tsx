'use client';

import { ChangeEvent, useState } from 'react';
import { parseCsvFile } from '@/lib/csv';
import { useLifegraphStore } from '@/store/useLifegraphStore';
import { Deal, Event, Person, Workout } from '@/types/data';

const uploadConfig = [
  {
    type: 'people' as const,
    label: 'people.csv',
    helper: 'Kolommen: name, role, org, tags'
  },
  {
    type: 'events' as const,
    label: 'events.csv',
    helper: 'Kolommen: type, start, end, title, person, rel, deal, next_step, has_artifact'
  },
  {
    type: 'deals' as const,
    label: 'deals.csv',
    helper: 'Kolommen: name, owner, stage, value'
  },
  {
    type: 'workouts' as const,
    label: 'workouts.csv',
    helper: 'Kolommen: person, date, sport, distance_km, pace_min_per_km, hr_avg'
  }
];

export const UploadSection = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const setDataset = useLifegraphStore((state) => state.setDataset);
  const triggerRefresh = useLifegraphStore((state) => state.triggerRefresh);

  const handleUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    type: 'people' | 'events' | 'deals' | 'workouts'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const result = await parseCsvFile(file, type);
      switch (type) {
        case 'people':
          setDataset('people', result.rows as Person[]);
          break;
        case 'events':
          setDataset('events', result.rows as Event[]);
          break;
        case 'deals':
          setDataset('deals', result.rows as Deal[]);
          break;
        case 'workouts':
          setDataset('workouts', result.rows as Workout[]);
          break;
        default:
          break;
      }
      setStatus(`${file.name} geladen`);
      triggerRefresh();
    } catch (err) {
      console.error(err);
      setError('Kon CSV niet verwerken. Controleer het formaat.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-4 rounded-lg bg-surface p-4 shadow-inner">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">CSV uploads</h2>
        <p className="text-sm text-slate-400">
          Data leeft alleen in je browser. Gebruik de inputs hieronder om datasets te laden.
        </p>
      </div>
      <div className="space-y-3">
        {uploadConfig.map((config) => (
          <label
            key={config.type}
            className="flex flex-col gap-2 rounded border border-slate-700 bg-slate-900/40 p-3 text-sm hover:border-accent/60"
          >
            <span className="font-medium text-slate-200">{config.label}</span>
            <span className="text-xs text-slate-500">{config.helper}</span>
            <input
              type="file"
              accept=".csv"
              onChange={(event) => handleUpload(event, config.type)}
              className="text-xs"
            />
          </label>
        ))}
      </div>
      {status && <p className="text-xs text-emerald-400">{status}</p>}
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
};
