// No drizzle imports here: the web app bundles this file.
export const ticketStatus = ["open", "in_progress", "closed"] as const;
export const ticketPriority = ["low", "medium", "high"] as const;

export type TicketStatus = (typeof ticketStatus)[number];
export type TicketPriority = (typeof ticketPriority)[number];
