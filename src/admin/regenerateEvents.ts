import { generateRoleEventsForPerson } from "../mock/eventGenerator";
import type { MockPerson } from "../mock/types";

interface CalendarEvent {
  roleDemo?: boolean;
  [key: string]: unknown;
}

/** roleDemo 더미 일정만 교체하고 사용자가 만든 일정은 유지 */
export function regeneratePersonDemoEvents(
  eventsByPerson: Record<string, CalendarEvent[]>,
  person: MockPerson,
  nextRole?: string,
) {
  const updatedPerson = nextRole ? { ...person, role: nextRole } : person;
  return {
    ...eventsByPerson,
    [person.id]: [
      ...(eventsByPerson[person.id] || []).filter((event) => !event.roleDemo),
      ...generateRoleEventsForPerson(updatedPerson),
    ],
  };
}
