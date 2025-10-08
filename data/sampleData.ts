import { LifegraphData } from '@/types/data';

export const sampleData: LifegraphData = {
  people: [
    {
      id: 'person-alex-van-dijk',
      name: 'Alex van Dijk',
      role: 'Founder',
      org: 'Atlas Labs',
      tags: ['work', 'health'],
      type: 'person'
    },
    {
      id: 'person-samira-khan',
      name: 'Samira Khan',
      role: 'COO',
      org: 'Atlas Labs',
      tags: ['work'],
      type: 'person'
    },
    {
      id: 'person-lotte-van-der-berg',
      name: 'Lotte van der Berg',
      role: 'Partner',
      org: 'Momentum Ventures',
      tags: ['work'],
      type: 'person'
    },
    {
      id: 'person-jules-van-dijk',
      name: 'Jules van Dijk',
      role: 'Student',
      org: 'TU Delft',
      tags: ['school', 'family'],
      type: 'person'
    }
  ],
  deals: [
    {
      id: 'deal-apollo',
      name: 'Apollo AI Pilot',
      owner: 'Samira Khan',
      stage: 'Negotiation',
      value: 42000,
      type: 'deal'
    },
    {
      id: 'deal-nova',
      name: 'Nova Renewal',
      owner: 'Alex van Dijk',
      stage: 'Proposal',
      value: 18000,
      type: 'deal'
    }
  ],
  events: [
    {
      id: 'event-standup-2024-10-06',
      kind: 'team sync',
      start: new Date().toISOString(),
      end: new Date().toISOString(),
      title: 'Weekly GTM sync',
      primaryPerson: 'Alex van Dijk',
      relatedPerson: 'Samira Khan',
      deal: 'Apollo AI Pilot',
      nextStep: 'Send proposal deck',
      hasArtifact: true,
      type: 'event'
    },
    {
      id: 'event-nova-review',
      kind: 'client meeting',
      start: new Date().toISOString(),
      title: 'Nova renewal Q4',
      primaryPerson: 'Alex van Dijk',
      relatedPerson: 'Lotte van der Berg',
      deal: 'Nova Renewal',
      nextStep: '',
      hasArtifact: false,
      type: 'event'
    }
  ],
  workouts: [
    {
      id: 'workout-run-2024-10-05',
      person: 'Alex van Dijk',
      date: new Date().toISOString(),
      sport: 'Run',
      distanceKm: 8.6,
      paceMinPerKm: 5.1,
      hrAvg: 148,
      type: 'workout'
    },
    {
      id: 'workout-ride-2024-10-03',
      person: 'Samira Khan',
      date: new Date().toISOString(),
      sport: 'Ride',
      distanceKm: 24.3,
      paceMinPerKm: 2.4,
      hrAvg: 132,
      type: 'workout'
    }
  ]
};
