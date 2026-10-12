import {
  type TicketPriority,
  type TicketStatus,
  ticketPrioritySchema,
  ticketStatusSchema,
} from "@mini-ticket-tracker/api/schemas/ticket";

export const statusLabels: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  closed: "Closed",
};

export const priorityLabels: Record<TicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const statusItems = ticketStatusSchema.options.map((value) => ({
  value,
  label: statusLabels[value],
}));

export const priorityItems = ticketPrioritySchema.options.map((value) => ({
  value,
  label: priorityLabels[value],
}));
