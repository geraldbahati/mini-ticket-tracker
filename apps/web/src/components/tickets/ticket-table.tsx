import type {
  Ticket,
  TicketPriority,
  TicketStatus,
} from "@mini-ticket-tracker/api/schemas/ticket";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@mini-ticket-tracker/ui/components/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mini-ticket-tracker/ui/components/select";
import { Skeleton } from "@mini-ticket-tracker/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mini-ticket-tracker/ui/components/table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { orpc } from "@/utils/orpc";

import { priorityItems, statusItems } from "./ticket-meta";

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

function InlineSelect<T extends string>({
  label,
  items,
  value,
  disabled,
  onChange,
}: {
  label: string;
  items: { value: T; label: string }[];
  value: T;
  disabled: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <Select
      items={items}
      value={value}
      disabled={disabled}
      onValueChange={(next) => next && next !== value && onChange(next)}
    >
      <SelectTrigger size="sm" className="w-32" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function TicketTable({
  tickets,
  isLoading,
}: {
  tickets: Ticket[] | undefined;
  isLoading: boolean;
}) {
  const queryClient = useQueryClient();

  const updateTicket = useMutation(
    orpc.tickets.update.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.tickets.key() }),
      onError: (error) => toast.error(error.message),
    }),
  );

  const isUpdating = (id: string) => updateTicket.isPending && updateTicket.variables?.id === id;

  if (!isLoading && tickets?.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>No tickets</EmptyTitle>
          <EmptyDescription>Nothing matches this filter yet.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead className="text-right">Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading || !tickets
          ? Array.from({ length: 5 }, (_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={4}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            ))
          : tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="max-w-md whitespace-normal">
                  <div className="font-medium">{ticket.title}</div>
                  {ticket.description && (
                    <div className="line-clamp-1 text-muted-foreground">{ticket.description}</div>
                  )}
                </TableCell>
                <TableCell>
                  <InlineSelect<TicketStatus>
                    label={`Status of ${ticket.title}`}
                    items={statusItems}
                    value={ticket.status}
                    disabled={isUpdating(ticket.id)}
                    onChange={(status) => updateTicket.mutate({ id: ticket.id, status })}
                  />
                </TableCell>
                <TableCell>
                  <InlineSelect<TicketPriority>
                    label={`Priority of ${ticket.title}`}
                    items={priorityItems}
                    value={ticket.priority}
                    disabled={isUpdating(ticket.id)}
                    onChange={(priority) => updateTicket.mutate({ id: ticket.id, priority })}
                  />
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {dateFormat.format(ticket.createdAt)}
                </TableCell>
              </TableRow>
            ))}
      </TableBody>
    </Table>
  );
}
