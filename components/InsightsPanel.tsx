'use client';

import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip
} from 'chart.js';
import { LifegraphData, LifegraphFilters } from '@/types/data';
import { computeInsights } from '@/lib/insights';
import { entityPassesFilters } from '@/lib/filters';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type InsightsPanelProps = {
  data: LifegraphData;
  filters: LifegraphFilters;
};

export const InsightsPanel = ({ data, filters }: InsightsPanelProps) => {
  const filteredData = useMemo<LifegraphData>(() => ({
    people: data.people.filter((person) => entityPassesFilters(person, filters)),
    events: data.events.filter((event) => entityPassesFilters(event, filters)),
    deals: data.deals.filter((deal) => entityPassesFilters(deal, filters)),
    workouts: data.workouts.filter((workout) => entityPassesFilters(workout, filters))
  }), [data, filters]);

  const insights = useMemo(() => computeInsights(filteredData), [filteredData]);

  const chartData = {
    labels: ['Meetings', 'Low-value meetings', 'Runs (km)'],
    datasets: [
      {
        label: 'Laatste 14 dagen',
        data: [
          insights.meetingsCount,
          insights.lowValueMeetings,
          Number(insights.runDistance.toFixed(1))
        ],
        backgroundColor: ['#38bdf8', '#f97316', '#a855f7']
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#94a3b8'
        },
        grid: {
          color: '#1e293b'
        }
      },
      y: {
        ticks: {
          color: '#94a3b8'
        },
        grid: {
          color: '#1e293b'
        }
      }
    }
  } satisfies Parameters<typeof Bar>[0]['options'];

  return (
    <div className="space-y-4 rounded-lg bg-surface p-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-100">Insights</h3>
        <p className="text-sm text-slate-400">Window: laatste 14 dagen.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        <StatCard label="Meetings" value={insights.meetingsCount} />
        <StatCard label="Low-value meetings" value={insights.lowValueMeetings} accent="text-amber-300" />
        <StatCard
          label="Deal value"
          value={`€ ${insights.dealValueFromMeetings.toLocaleString('nl-NL', {
            minimumFractionDigits: 0
          })}`}
        />
        <StatCard
          label="Runs"
          value={`${insights.runDistance.toFixed(1)} km`}
          helper={
            insights.runPace
              ? `Gem. pace ${insights.runPace.toFixed(2)} min/km`
              : 'Geen runs in window'
          }
        />
      </div>
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

type StatCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  accent?: string;
};

const StatCard = ({ label, value, helper, accent }: StatCardProps) => (
  <div className="space-y-1 rounded border border-slate-800 bg-slate-900/30 p-3">
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className={`text-lg font-semibold text-slate-100 ${accent ?? ''}`}>{value}</p>
    {helper && <p className="text-xs text-slate-500">{helper}</p>}
  </div>
);
