import { LifegraphData } from '@/types/data';

const DAYS_WINDOW = 14;

const withinWindow = (dateString?: string) => {
  if (!dateString) return false;
  const value = new Date(dateString);
  if (Number.isNaN(value.getTime())) return false;
  const now = new Date();
  const diff = (now.getTime() - value.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= DAYS_WINDOW;
};

export type LifegraphInsights = {
  meetingsCount: number;
  lowValueMeetings: number;
  dealValueFromMeetings: number;
  runDistance: number;
  runPace: number | null;
};

export const computeInsights = (data: LifegraphData): LifegraphInsights => {
  const recentEvents = data.events.filter((event) => withinWindow(event.start || event.end));
  const meetingsCount = recentEvents.length;
  const lowValueMeetings = recentEvents.filter(
    (event) => !event.hasArtifact && !(event.nextStep && event.nextStep.trim())
  ).length;

  const dealsByName = new Map(data.deals.map((deal) => [deal.name.toLowerCase(), deal]));
  const dealValueFromMeetings = recentEvents.reduce((total, event) => {
    if (!event.deal) return total;
    const deal = dealsByName.get(event.deal.toLowerCase());
    return deal?.value ? total + deal.value : total;
  }, 0);

  const recentRuns = data.workouts.filter(
    (workout) =>
      withinWindow(workout.date) && workout.sport.toLowerCase().includes('run') && workout.distanceKm
  );

  const runDistance = recentRuns.reduce((total, workout) => total + (workout.distanceKm ?? 0), 0);
  const runPace = (() => {
    const valid = recentRuns.filter((workout) => workout.paceMinPerKm);
    if (!valid.length) return null;
    const sum = valid.reduce((total, workout) => total + (workout.paceMinPerKm ?? 0), 0);
    return sum / valid.length;
  })();

  return {
    meetingsCount,
    lowValueMeetings,
    dealValueFromMeetings,
    runDistance,
    runPace
  };
};
