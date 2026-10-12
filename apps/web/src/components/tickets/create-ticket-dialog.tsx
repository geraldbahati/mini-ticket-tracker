import {
  createTicketInput,
  ticketPrioritySchema,
  ticketStatusSchema,
} from "@mini-ticket-tracker/api/schemas/ticket";
import { Button } from "@mini-ticket-tracker/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@mini-ticket-tracker/ui/components/dialog";
import { Input } from "@mini-ticket-tracker/ui/components/input";
import { Label } from "@mini-ticket-tracker/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mini-ticket-tracker/ui/components/select";
import { Textarea } from "@mini-ticket-tracker/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { orpc } from "@/utils/orpc";

import { priorityItems, statusItems } from "./ticket-meta";

// TanStack Form needs the schema input to match the form values, and a textarea is always a string.
const createTicketForm = createTicketInput.extend({
  description: z.string().max(5000),
  status: ticketStatusSchema,
  priority: ticketPrioritySchema,
});

const defaultValues: z.infer<typeof createTicketForm> = {
  title: "",
  description: "",
  status: "open",
  priority: "medium",
};

export default function CreateTicketDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const createTicket = useMutation(
    orpc.tickets.create.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.tickets.key() }),
    }),
  );

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: createTicketForm,
    },
    onSubmit: async ({ value }) => {
      try {
        await createTicket.mutateAsync({
          ...value,
          description: value.description.trim() || undefined,
        });
        toast.success("Ticket created");
        form.reset();
        setOpen(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not create ticket");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon />
        New ticket
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New ticket</DialogTitle>
          <DialogDescription>Describe the issue. Status and priority can change later.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field name="title">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Title</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  autoFocus
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-destructive">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="description">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  Description <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  rows={4}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <div className="grid grid-cols-2 gap-3">
            <form.Field name="status">
              {(field) => (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    items={statusItems}
                    value={field.state.value}
                    onValueChange={(value) => value && field.handleChange(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>

            <form.Field name="priority">
              {(field) => (
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    items={priorityItems}
                    value={field.state.value}
                    onValueChange={(value) => value && field.handleChange(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>
          </div>

          <DialogFooter>
            <form.Subscribe
              selector={(state) => ({
                canSubmit: state.canSubmit,
                isSubmitting: state.isSubmitting,
              })}
            >
              {({ canSubmit, isSubmitting }) => (
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create ticket"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
