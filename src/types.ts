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

// lower = served first
export const PRIORITY_RANK: Record<Priority, number> = {
  vip: 0,
  disabilitas: 1,
  lansia: 2,
  normal: 3,
};
