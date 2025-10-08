'use client';

import Papa from 'papaparse';
import { Deal, Event, LifegraphData, Person, Workout } from '@/types/data';

type CsvType = keyof LifegraphData;

type ParsedResult<T> = {
  type: CsvType;
  rows: T;
};

const booleanTrue = ['true', '1', 'yes', 'y', 'ja'];

const normaliseKey = (key: string) => key.trim().toLowerCase();

const normaliseValue = (value: unknown) =>
  typeof value === 'string' ? value.trim() : value ?? '';

const toNumber = (value?: string) => {
  if (!value) return undefined;
  const parsed = Number(value.replace(',', '.'));
  return Number.isNaN(parsed) ? undefined : parsed;
};

const toBoolean = (value?: string) => {
  if (!value) return false;
  return booleanTrue.includes(value.trim().toLowerCase());
};

const toTags = (value?: string) =>
  value
    ? value
        .split(/[,;|]/)
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const ensureId = (prefix: string, rawId?: string) =>
  rawId && rawId.trim() ? `${prefix}-${slugify(rawId)}` : `${prefix}-${crypto.randomUUID()}`;

const buildPerson = (raw: Record<string, string>): Person => {
  const name = raw.name ?? '';
  return {
    id: ensureId('person', name || crypto.randomUUID()),
    name,
    role: raw.role || undefined,
    org: raw.org || undefined,
    tags: toTags(raw.tags),
    type: 'person'
  };
};

const buildEvent = (raw: Record<string, string>): Event => ({
  id: ensureId('event', raw.id || raw.title || raw.name),
  kind: raw.type || raw.kind || 'event',
  start: raw.start || undefined,
  end: raw.end || undefined,
  title: raw.title || raw.name || 'Event',
  primaryPerson: raw.person || raw.primary_person || undefined,
  relatedPerson: raw.rel || raw.related || undefined,
  deal: raw.deal || undefined,
  nextStep: raw.next_step || raw.nextstep || undefined,
  hasArtifact: toBoolean(raw.has_artifact || raw.artifact),
  type: 'event'
});

const buildDeal = (raw: Record<string, string>): Deal => ({
  id: ensureId('deal', raw.name),
  name: raw.name ?? 'Deal',
  owner: raw.owner || undefined,
  stage: raw.stage || undefined,
  value: toNumber(raw.value),
  type: 'deal'
});

const buildWorkout = (raw: Record<string, string>): Workout => ({
  id: ensureId('workout', raw.id || `${raw.person}-${raw.date}-${raw.sport}`),
  person: raw.person ?? 'Onbekend',
  date: raw.date ?? new Date().toISOString(),
  sport: raw.sport ?? 'Workout',
  distanceKm: toNumber(raw.distance_km || raw.distance),
  paceMinPerKm: toNumber(raw.pace_min_per_km || raw.pace),
  hrAvg: toNumber(raw.hr_avg || raw.heart_rate || raw.hr),
  type: 'workout'
});

export const parseCsvFile = async (
  file: File,
  type: CsvType
): Promise<ParsedResult<Person[] | Event[] | Deal[] | Workout[]>> => {
  const text = await file.text();
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normaliseKey,
      complete: (results) => {
        try {
          const rows = results.data.map((row) => {
            const normalised: Record<string, string> = {};
            Object.entries(row).forEach(([key, value]) => {
              if (!key) return;
              normalised[normaliseKey(key)] = String(normaliseValue(value));
            });
            return normalised;
          });

          const payload = (() => {
            switch (type) {
              case 'people':
                return rows.map(buildPerson);
              case 'events':
                return rows.map(buildEvent);
              case 'deals':
                return rows.map(buildDeal);
              case 'workouts':
                return rows.map(buildWorkout);
              default:
                return [];
            }
          })();

          resolve({ type, rows: payload });
        } catch (error: unknown) {
          reject(error);
        }
      },
      error: (error: unknown) => reject(error)
    });
  });
};

export const exportJson = (data: LifegraphData) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'lifegraph-lite-export.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
