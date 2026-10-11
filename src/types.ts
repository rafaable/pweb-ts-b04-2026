export type Role = "admin" | "moderator" | "user";
export type Priority = "normal" | "lansia" | "disabilitas" | "vip";
export type TicketStatus = "waiting" | "called" | "done" | "skipped";

export interface Session {
  token: string;
  role: Role;
  firstName: string;
}

export interface QueueType {
  code: string; // 1 capital letter
  name: string;
  active: boolean;
  lastNumber: number;
}

export interface Ticket {
  id: string; // e.g. "A-001"
  code: string;
  number: number;
  priority: Priority;
  status: TicketStatus;
  createdAt: number;
}

// Prioritas: vip, disabilitas, lansia (0) lebih didahulukan daripada normal (1).
// Antar sesama prioritas diurutkan berdasarkan angka antrian.
export const PRIORITY_RANK: Record<Priority, number> = {
  vip: 0,
  disabilitas: 0,
  lansia: 0,
  normal: 1,
};
