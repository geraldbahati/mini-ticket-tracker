import { publicProcedure } from "../index";
import {
  createTicketInput,
  listTicketsInput,
  listTicketsOutput,
  ticketSchema,
  ticketStatsOutput,
  updateTicketInput,
} from "../schemas/ticket";
import { createTicket, getTicketStats, listTickets, updateTicket } from "../services/tickets";

export const ticketsRouter = {
  create: publicProcedure
    .route({ method: "POST", path: "/tickets", successStatus: 201, tags: ["Tickets"] })
    .input(createTicketInput)
    .output(ticketSchema)
    .handler(({ context, input }) => createTicket(context.db, input)),

  list: publicProcedure
    .route({ method: "GET", path: "/tickets", tags: ["Tickets"] })
    .input(listTicketsInput)
    .output(listTicketsOutput)
    .handler(({ context, input }) => listTickets(context.db, input)),

  stats: publicProcedure
    .route({ method: "GET", path: "/tickets/stats", tags: ["Tickets"] })
    .output(ticketStatsOutput)
    .handler(({ context }) => getTicketStats(context.db)),

  update: publicProcedure
    .route({ method: "PATCH", path: "/tickets/{id}", tags: ["Tickets"] })
    .input(updateTicketInput)
    .output(ticketSchema)
    .handler(({ context, input }) => updateTicket(context.db, input)),
};
