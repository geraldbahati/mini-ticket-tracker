import { ticketPriority, ticketStatus } from "@mini-ticket-tracker/db/ticket-enums";
import z from "zod";

export const ticketStatusSchema = z.enum(ticketStatus);
export const ticketPrioritySchema = z.enum(ticketPriority);

export const ticketSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: ticketStatusSchema,
  priority: ticketPrioritySchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createTicketInput = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  description: z.string().trim().max(5000).optional(),
  status: ticketStatusSchema.default("open"),
  priority: ticketPrioritySchema.default("medium"),
});

export const listTicketsInput = z.object({
  status: ticketStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateTicketInput = z
  .object({
    id: z.uuid(),
    status: ticketStatusSchema.optional(),
    priority: ticketPrioritySchema.optional(),
  })
  .refine((input) => input.status !== undefined || input.priority !== undefined, {
    message: "Provide status and/or priority to update",
  });

export const listTicketsOutput = z.object({
  data: z.array(ticketSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const ticketStatsOutput = z.object({
  open: z.number(),
  in_progress: z.number(),
  closed: z.number(),
  total: z.number(),
});

export type TicketStatus = z.infer<typeof ticketStatusSchema>;
export type TicketPriority = z.infer<typeof ticketPrioritySchema>;
export type Ticket = z.infer<typeof ticketSchema>;
export type CreateTicketInput = z.infer<typeof createTicketInput>;
export type ListTicketsInput = z.infer<typeof listTicketsInput>;
export type UpdateTicketInput = z.infer<typeof updateTicketInput>;
export type ListTicketsOutput = z.infer<typeof listTicketsOutput>;
export type TicketStats = z.infer<typeof ticketStatsOutput>;
