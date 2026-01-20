// import type { SelectTodo } from "@repo/db";

import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import * as z from "zod";

import type { Todo } from "@acme/zen-v3/zenstack/models";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@acme/ui/alert-dialog";
import { Button } from "@acme/ui/button";
import { showTimerToast } from "@acme/ui/custom/timer-toast";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Textarea } from "@acme/ui/textarea";
import { schema } from "@acme/zen-v3/zenstack/schema";

import { authClient } from "~/clients/auth-client";

export function TodoItem({
  todo,
  todoDeleted,
  onDeleted,
}: {
  todo: Todo;
  todoDeleted: Todo | null;
  onDeleted: Dispatch<SetStateAction<Todo | null>>;
}) {
  const [open, setOpen] = useState(false);
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const { data: session } = authClient.useSession();
  const [deletedReason, setDeletedReason] = useState("");
  const client = useClientQueries(schema);

  const { mutateAsync: updateTodo } = client.todo.useUpdate({
    onSuccess: () => {
      toast.success("Todo updated successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutateAsync: deleteTodo } = client.todo.useUpdate({
    onSuccess: () => {
      toast.success("Todo deleted successfully");
      showTimerToast({
        content: "Evento removido",
        action: {
          label: "Desfazer",
          onClick: async () => {
            await updateTodo({
              data: { deletedAt: null, deletedReason: null, deletedById: null },
              where: { id: todoDeleted?.id },
            });
            onDeleted(null);
          },
        },
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm({
    defaultValues: {
      title: todo.title,
    },
    onSubmit: async ({ value }) => {
      console.log(`🚀 -> value:`, value);
      console.log(`🚀 -> todo:`, todo);
      await updateTodo({
        data: { title: value.title },
        where: { id: todo.id },
      });
    },
    validators: {
      onSubmit: z.object({
        title: z.string().min(1, "Title is required"),
      }),
    },
  });

  return (
    <div>
      <form
        className="flex items-center gap-2 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div className="flex items-center gap-2">
          <form.Field name="title">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Title</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    type="text"
                    value={field.state.value}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p className="text-red-500" key={error?.message}>
                      {error?.message}
                    </p>
                  ))}
                  <small className="text-xs text-gray-500">
                    {formatDistanceToNow(todo.createdAt)}
                  </small>
                </div>
              </div>
            )}
          </form.Field>

          <form.Subscribe>
            {(state) => (
              <Button
                disabled={!state.canSubmit || state.isSubmitting}
                type="submit"
              >
                {state.isSubmitting ? "Updating..." : "Update Todo"}
              </Button>
            )}
          </form.Subscribe>
        </div>

        <Button
          onClick={() => setOpen(true)}
          type="button"
          variant="destructive"
        >
          Delete Todo
        </Button>
      </form>

      <AlertDialog onOpenChange={setOpen} open={open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <Textarea
              name="deletedReason"
              onChange={(e) => setDeletedReason(e.target.value)}
              placeholder="Why are you deleting this todo? (optional)"
              rows={3}
              value={deletedReason}
            />
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                onDeleted(todo);
                await deleteTodo({
                  data: {
                    deletedAt: new Date(),
                    deletedReason: deletedReason,
                    deletedById: session?.user?.id,
                  },
                  where: { id: todo.id },
                });
              }}
            >
              Delete Todo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
