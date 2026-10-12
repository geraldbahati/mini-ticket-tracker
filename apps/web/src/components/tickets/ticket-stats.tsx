import { Card, CardDescription, CardHeader, CardTitle } from "@mini-ticket-tracker/ui/components/card";
import { Skeleton } from "@mini-ticket-tracker/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";

import { statusLabels } from "./ticket-meta";

export default function TicketStats() {
  const stats = useQuery(orpc.tickets.stats.queryOptions());

  const cards = [
    { label: "Total", value: stats.data?.total },
    { label: statusLabels.open, value: stats.data?.open },
    { label: statusLabels.in_progress, value: stats.data?.in_progress },
    { label: statusLabels.closed, value: stats.data?.closed },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map(({ label, value }) => (
        <Card key={label} size="sm">
          <CardHeader>
            <CardDescription>{label}</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {value === undefined ? <Skeleton className="h-7 w-10" /> : value}
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
