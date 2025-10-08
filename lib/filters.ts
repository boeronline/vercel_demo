import { Deal, Event, LifegraphFilters, Person, Workout } from '@/types/data';

type Entity = Person | Event | Deal | Workout;

const keywordMatches = (value: string | undefined, keywords: string[]) => {
  if (!value) return false;
  const lower = value.toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword));
};

const tagsMatch = (tags: string[] | undefined, keywords: string[]) => {
  if (!tags?.length) return false;
  return tags.some((tag) => keywords.includes(tag.toLowerCase()));
};

export const resolveCategories = (entity: Entity): Array<keyof LifegraphFilters> => {
  switch (entity.type) {
    case 'deal':
      return ['work'];
    case 'workout':
      return ['health'];
    case 'event': {
      const categories: Array<keyof LifegraphFilters> = ['work'];
      if (keywordMatches(entity.kind, ['family', 'birthday', 'gezin'])) {
        categories.push('family');
      }
      if (keywordMatches(entity.kind, ['school', 'class', 'college'])) {
        categories.push('school');
      }
      if (keywordMatches(entity.kind, ['run', 'ride', 'workout', 'training'])) {
        categories.push('health');
      }
      return Array.from(new Set(categories));
    }
    case 'person': {
      const categories: Array<keyof LifegraphFilters> = [];
      if (tagsMatch(entity.tags, ['work', 'colleague', 'sales'])) {
        categories.push('work');
      }
      if (tagsMatch(entity.tags, ['family', 'gezin', 'home'])) {
        categories.push('family');
      }
      if (tagsMatch(entity.tags, ['health', 'sport', 'fitness'])) {
        categories.push('health');
      }
      if (tagsMatch(entity.tags, ['school', 'study', 'education'])) {
        categories.push('school');
      }
      if (!categories.length) {
        categories.push('work');
      }
      return Array.from(new Set(categories));
    }
    default:
      return ['work'];
  }
};

export const entityPassesFilters = (
  entity: Entity,
  filters: LifegraphFilters
): boolean => {
  const categories = resolveCategories(entity);
  return categories.some((category) => filters[category]);
};
