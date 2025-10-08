'use client';

import { useEffect, useMemo, useRef } from 'react';
import cytoscape, { ElementDefinition } from 'cytoscape';
import { DetailSelection, LifegraphData, LifegraphFilters } from '@/types/data';
import { entityPassesFilters } from '@/lib/filters';

const layoutOptions: cytoscape.LayoutOptions = {
  name: 'cose',
  fit: true,
  padding: 40,
  animate: false
};

type GraphViewProps = {
  data: LifegraphData;
  filters: LifegraphFilters;
  refreshToken: number;
  onSelect: (selection: DetailSelection) => void;
};

export const GraphView = ({ data, filters, refreshToken, onSelect }: GraphViewProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  const elements = useMemo(() => buildElements(data, filters), [data, filters]);

  useEffect(() => {
    if (!containerRef.current) return;
    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#38bdf8',
            label: 'data(label)',
            color: '#e2e8f0',
            'font-size': '10px',
            'text-wrap': 'wrap',
            'text-valign': 'center',
            'text-halign': 'center'
          }
        },
        {
          selector: 'node[type = "deal"]',
          style: {
            'background-color': '#f97316'
          }
        },
        {
          selector: 'node[type = "event"]',
          style: {
            'background-color': '#22c55e'
          }
        },
        {
          selector: 'node[type = "workout"]',
          style: {
            'background-color': '#a855f7'
          }
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': '#64748b',
            'target-arrow-color': '#64748b',
            'target-arrow-shape': 'triangle',
            label: 'data(label)',
            color: '#94a3b8',
            'font-size': '9px'
          }
        },
        {
          selector: '.highlighted',
          style: {
            'background-color': '#fbbf24',
            'line-color': '#fbbf24',
            'target-arrow-color': '#fbbf24'
          }
        }
      ],
      layout: layoutOptions
    });

    cy.on('tap', 'node', (event) => {
      const node = event.target;
      onSelect({ kind: 'node', data: node.data('payload') });
      cy.elements().removeClass('highlighted');
      node.addClass('highlighted');
    });

    cy.on('tap', 'edge', (event) => {
      const edge = event.target;
      onSelect({ kind: 'edge', data: edge.data('payload') });
      cy.elements().removeClass('highlighted');
      edge.addClass('highlighted');
    });

    cy.on('tap', (event) => {
      if (event.target === cy) {
        onSelect(null);
        cy.elements().removeClass('highlighted');
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.json({ elements });
    cy.layout(layoutOptions).run();
  }, [elements, refreshToken]);

  return <div ref={containerRef} className="h-[600px] w-full flex-1 rounded-lg bg-surface" />;
};

const buildElements = (data: LifegraphData, filters: LifegraphFilters): ElementDefinition[] => {
  const elements: ElementDefinition[] = [];

  const people = data.people.filter((person) => entityPassesFilters(person, filters));
  const deals = data.deals.filter((deal) => entityPassesFilters(deal, filters));
  const events = data.events.filter((event) => entityPassesFilters(event, filters));
  const workouts = data.workouts.filter((workout) => entityPassesFilters(workout, filters));

  const personByName = new Map(people.map((person) => [person.name.toLowerCase(), person]));
  const dealByName = new Map(deals.map((deal) => [deal.name.toLowerCase(), deal]));
  people.forEach((person) => {
    elements.push({
      data: {
        id: person.id,
        label: person.name,
        type: person.type,
        payload: person
      }
    });
  });

  deals.forEach((deal) => {
    elements.push({
      data: {
        id: deal.id,
        label: deal.name,
        type: deal.type,
        payload: deal
      }
    });
  });

  events.forEach((event) => {
    elements.push({
      data: {
        id: event.id,
        label: event.title,
        type: event.type,
        payload: event
      }
    });
  });

  workouts.forEach((workout) => {
    elements.push({
      data: {
        id: workout.id,
        label: `${workout.sport} ${workout.distanceKm ?? ''}`.trim(),
        type: workout.type,
        payload: workout
      }
    });
  });

  events.forEach((event) => {
    if (event.primaryPerson) {
      const person = personByName.get(event.primaryPerson.toLowerCase());
      if (person) {
        elements.push({
          data: {
            id: `${person.id}->${event.id}`,
            source: person.id,
            target: event.id,
            label: 'ATTENDED',
            payload: {
              relation: 'ATTENDED',
              person: person.name,
              event: event.title
            }
          }
        });
      }
    }

    if (event.deal) {
      const deal = dealByName.get(event.deal.toLowerCase());
      if (deal) {
        elements.push({
          data: {
            id: `${event.id}->${deal.id}`,
            source: event.id,
            target: deal.id,
            label: 'RELATES_TO',
            payload: {
              relation: 'RELATES_TO',
              event: event.title,
              deal: deal.name
            }
          }
        });
      }
    }

    if (event.relatedPerson) {
      const related = personByName.get(event.relatedPerson.toLowerCase());
      if (related) {
        elements.push({
          data: {
            id: `${event.id}->${related.id}`,
            source: event.id,
            target: related.id,
            label: 'WITH',
            payload: {
              relation: 'WITH',
              event: event.title,
              person: related.name
            }
          }
        });
      }
    }
  });

  workouts.forEach((workout) => {
    const person = personByName.get(workout.person.toLowerCase());
    if (person) {
      elements.push({
        data: {
          id: `${workout.id}->${person.id}`,
          source: workout.id,
          target: person.id,
          label: 'AFFECTS',
          payload: {
            relation: 'AFFECTS',
            workout: workout.sport,
            person: person.name
          }
        }
      });
    }
  });

  // Remove duplicate edges by id
  const unique = new Map<string, ElementDefinition>();
  elements.forEach((element) => {
    if ('source' in element.data && unique.has(element.data.id as string)) {
      return;
    }
    unique.set(element.data.id as string, element);
  });

  return Array.from(unique.values());
};
