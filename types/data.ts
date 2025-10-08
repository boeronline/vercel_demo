export type Person = {
  id: string;
  name: string;
  role?: string;
  org?: string;
  tags: string[];
  type: 'person';
};

export type Event = {
  id: string;
  kind: string;
  start?: string;
  end?: string;
  title: string;
  primaryPerson?: string;
  relatedPerson?: string;
  deal?: string;
  nextStep?: string;
  hasArtifact: boolean;
  type: 'event';
};

export type Deal = {
  id: string;
  name: string;
  owner?: string;
  stage?: string;
  value?: number;
  type: 'deal';
};

export type Workout = {
  id: string;
  person: string;
  date: string;
  sport: string;
  distanceKm?: number;
  paceMinPerKm?: number;
  hrAvg?: number;
  type: 'workout';
};

export type LifegraphData = {
  people: Person[];
  events: Event[];
  deals: Deal[];
  workouts: Workout[];
};

export type LifegraphFilters = {
  work: boolean;
  family: boolean;
  health: boolean;
  school: boolean;
};

export type DetailSelection =
  | { kind: 'node'; data: Person | Event | Deal | Workout }
  | { kind: 'edge'; data: Record<string, unknown> }
  | null;

export const LIFEGRAPH_STORAGE_KEY = 'lifegraph-lite-v1';
