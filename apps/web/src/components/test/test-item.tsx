// import type { SelectTodo } from "@repo/db";

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

import type { Test } from "@acme/zen-v3/zenstack/models";
import { schema } from "@acme/zen-v3/zenstack/schema";
import { useForm } from "@tanstack/react-form";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import * as z from "zod";

import { authClient } from "~/clients/auth-client";

export function TestItem({ test }: { test: Test }) {
	const [open, setOpen] = useState(false);
	const { data: activeOrganization } = authClient.useActiveOrganization();
	const { data: session } = authClient.useSession();
	const [deletedReason, setDeletedReason] = useState("");
	const client = useClientQueries(schema);

	const { mutate: updateTest } = client.test.useUpdate({
		onSuccess: () => {
			toast.success("Test updated successfully");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const { mutate: deleteTest } = client.test.useUpdate({
		onSuccess: () => {
			toast.success("Test deleted successfully");
			showTimerToast({
				content: "Evento removido",
				action: {
					label: "Desfazer",
					onClick: () =>
						updateTest({
							data: { deletedAt: null, deletedReason: null, deletedById: null },
							where: { id: test.id },
						}),
				},
			});
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const form = useForm({
		defaultValues: {
			name: test.name,
		},
		onSubmit: ({ value }) => {
			console.log(`🚀 -> value:`, value);
			console.log(`🚀 -> test:`, test);
			updateTest({ data: { name: value.name }, where: { id: test.id } });
		},
		validators: {
			onSubmit: z.object({
				name: z.string().min(1, "Name is required"),
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
					<form.Field name="name">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Name</Label>
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
										{formatDistanceToNow(test.createdAt)}
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
							onClick={() =>
								deleteTest({
									data: {
										deletedAt: new Date(),
										deletedReason: deletedReason,
										deletedById: session?.user?.id,
									},
									where: { id: test.id },
								})
							}
						>
							Delete Todo
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
