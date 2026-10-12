import { ticketStatusSchema } from "@mini-ticket-tracker/api/schemas/ticket";
import { Button } from "@mini-ticket-tracker/ui/components/button";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import z from "zod";

import TicketFilters from "@/components/tickets/ticket-filters";
import TicketStats from "@/components/tickets/ticket-stats";
import TicketTable from "@/components/tickets/ticket-table";
import { orpc } from "@/utils/orpc";

const PAGE_SIZE = 10;

const ticketsSearchSchema = z.object({
  status: ticketStatusSchema.optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
});

export const Route = createFileRoute("/tickets")({
  validateSearch: ticketsSearchSchema,
  component: TicketsPage,
});

function TicketsPage() {
  const { status, page = 1 } = Route.useSearch();
  const navigate = Route.useNavigate();

  const tickets = useQuery({
    ...orpc.tickets.list.queryOptions({ input: { status, page, limit: PAGE_SIZE } }),
    placeholderData: keepPreviousData,
  });
  const pagination = tickets.data?.pagination;
  const totalPages = Math.max(pagination?.totalPages ?? 1, 1);

  const goToPage = (next: number) =>
    navigate({ search: (prev) => ({ ...prev, page: next > 1 ? next : undefined }) });

  return (
    <div className="container mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Tickets</h1>
          <p className="text-muted-foreground text-sm">Track issues by status and priority.</p>
        </div>
      </div>

      <TicketStats />

      <div className="flex items-center justify-between gap-4">
        <TicketFilters
          status={status}
          onStatusChange={(next) => navigate({ search: { status: next } })}
        />
        {pagination && (
          <span className="text-muted-foreground text-xs">
            {pagination.total} ticket{pagination.total === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <TicketTable tickets={tickets.data?.data} isLoading={tickets.isPending} />

      <div className="flex items-center justify-end gap-2">
        <span className="text-muted-foreground text-xs">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => goToPage(page - 1)}
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => goToPage(page + 1)}
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}
