import type { QueueType, Session, Ticket } from "./types.js";

const KEYS = {
  session: "session",
  queueTypes: "queueTypes",
  tickets: "tickets",
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getSession(): Session | null {
  return read<Session | null>(KEYS.session, null);
}
export function saveSession(session: Session): void {
  write(KEYS.session, session);
}
export function clearSession(): void {
  localStorage.removeItem(KEYS.session);
}

export function getQueueTypes(): QueueType[] {
  return read<QueueType[]>(KEYS.queueTypes, []);
}
export function saveQueueTypes(types: QueueType[]): void {
  write(KEYS.queueTypes, types);
}

export function getTickets(): Ticket[] {
  return read<Ticket[]>(KEYS.tickets, []);
}
export function saveTickets(tickets: Ticket[]): void {
  write(KEYS.tickets, tickets);
}
