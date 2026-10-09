import type { Priority, Ticket } from "./types.js";
import { PRIORITY_RANK } from "./types.js";
import { getQueueTypes, getTickets, saveQueueTypes, saveTickets } from "./storage.js";

// Only way to make a ticket. Bumps QueueType.lastNumber.
export function createTicket(code: string, priority: Priority): Ticket {
  const types = getQueueTypes();
  const type = types.find((t) => t.code === code);
  if (!type) throw new Error(`Jenis antrian ${code} tidak ditemukan`);
  if (!type.active) throw new Error(`Jenis antrian ${code} tidak aktif`);

  type.lastNumber += 1;
  const ticket: Ticket = {
    id: `${code}-${String(type.lastNumber).padStart(3, "0")}`,
    code,
    number: type.lastNumber,
    priority,
    status: "waiting",
    createdAt: Date.now(),
  };
  saveQueueTypes(types);
  saveTickets([...getTickets(), ticket]);
  return ticket;
}

// priority rank first, then oldest first
export function sortQueue(tickets: Ticket[]): Ticket[] {
  return [...tickets].sort(
    (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.createdAt - b.createdAt,
  );
}

// Reset Antrian: clear tickets, every lastNumber back to 0
export function resetQueue(): void {
  saveTickets([]);
  saveQueueTypes(getQueueTypes().map((t) => ({ ...t, lastNumber: 0 })));
}
