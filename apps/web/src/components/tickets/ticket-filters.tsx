import type { TicketStatus } from "@mini-ticket-tracker/api/schemas/ticket";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mini-ticket-tracker/ui/components/select";

import { statusItems } from "./ticket-meta";

const ALL = "all";
const filterItems = [{ value: ALL, label: "All statuses" }, ...statusItems];

export default function TicketFilters({
  status,
  onStatusChange,
}: {
  status: TicketStatus | undefined;
  onStatusChange: (status: TicketStatus | undefined) => void;
}) {
  return (
    <Select
      items={filterItems}
      value={status ?? ALL}
      onValueChange={(value) =>
        onStatusChange(!value || value === ALL ? undefined : (value as TicketStatus))
      }
    >
      <SelectTrigger className="w-40" aria-label="Filter by status">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {filterItems.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
