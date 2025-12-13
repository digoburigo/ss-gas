import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { schema } from "@acme/zen-v3/zenstack/schema";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { toast } from "sonner";
import * as z from "zod";

import { authClient } from "~/clients/auth-client";

export function TestCreate() {
	const { data: activeOrganization } = authClient.useActiveOrganization();
	const client = useClientQueries(schema);

	// const { mutate: createTodo } = useMutation({
	//   mutationFn: async (data: { title: string }) => {
	//     const { data: responseData, error } = await api().todos.v2.post(data);

	//     if (error?.status === 403) {
	//       console.log("🚀 -> error:", error.value);

	//       throw new Error(error.value.message);
	//     }

	//     return responseData;
	//   },
	//   onSuccess: () => {
	//     toast.success("Todo created successfully");
	//   },
	//   onError: (error) => {
	//     toast.error(error.message);
	//   },
	//   meta: {
	//     invalidateQueryKeys: [["todos", activeOrganization?.id]],
	//   },
	// });

	const { mutate: createTest } = client.test.useCreate({
		onSuccess: () => {
			toast.success("Test created successfully");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const form = useForm({
		defaultValues: {
			name: "",
		},
		onSubmit: ({ value }) => {
			createTest({ data: value });
		},
		validators: {
			onSubmit: z.object({
				name: z.string().min(1, "Name is required"),
			}),
		},
	});

	return (
		<form
			className="space-y-4"
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<div>
				<form.Field name="name">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor={field.name}>Name</Label>
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
						</div>
					)}
				</form.Field>
			</div>

			<form.Subscribe>
				{(state) => (
					<Button
						className="w-full"
						disabled={!state.canSubmit || state.isSubmitting}
						type="submit"
					>
						{state.isSubmitting ? "Creating..." : "Create Test"}
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
}
