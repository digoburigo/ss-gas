import { Button } from "@acme/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
} from "@acme/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@acme/ui/select";
import { Switch } from "@acme/ui/switch";
import { schema } from "@acme/zen-v3/zenstack/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "~/clients/auth-client";

const notificationsFormSchema = z.object({
	missingEntryAlertsEnabled: z.boolean(),
	preferredNotificationHour: z.number().min(0).max(23),
	escalationEnabled: z.boolean(),
	escalationDelayHours: z.number().min(1).max(24),
});

type NotificationsFormValues = z.infer<typeof notificationsFormSchema>;

// Default values for new users
const defaultValues: NotificationsFormValues = {
	missingEntryAlertsEnabled: true,
	preferredNotificationHour: 18,
	escalationEnabled: true,
	escalationDelayHours: 2,
};

// Generate hour options (0-23)
const hourOptions = Array.from({ length: 24 }, (_, i) => ({
	value: i.toString(),
	label: `${i.toString().padStart(2, "0")}:00`,
}));

// Generate escalation delay options (1-24 hours)
const escalationDelayOptions = [
	{ value: "1", label: "1 hora" },
	{ value: "2", label: "2 horas" },
	{ value: "3", label: "3 horas" },
	{ value: "4", label: "4 horas" },
	{ value: "6", label: "6 horas" },
	{ value: "8", label: "8 horas" },
	{ value: "12", label: "12 horas" },
	{ value: "24", label: "24 horas" },
];

export function NotificationsForm() {
	const client = useClientQueries(schema);
	const { data: session } = authClient.useSession();

	// Fetch current preferences
	const { data: preferences, isLoading } = client.userNotificationPreferences.useFindFirst(
		{
			where: { userId: session?.user?.id },
		},
		{
			enabled: !!session?.user?.id,
		},
	);

	const form = useForm<NotificationsFormValues>({
		resolver: zodResolver(notificationsFormSchema),
		defaultValues,
	});

	// Update form when preferences are loaded
	useEffect(() => {
		if (preferences) {
			form.reset({
				missingEntryAlertsEnabled: preferences.missingEntryAlertsEnabled,
				preferredNotificationHour: preferences.preferredNotificationHour,
				escalationEnabled: preferences.escalationEnabled,
				escalationDelayHours: preferences.escalationDelayHours,
			});
		}
	}, [preferences, form]);

	// Mutation to save preferences
	const { mutate: upsertPreferences, isPending } = client.userNotificationPreferences.useUpsert({
		onSuccess: () => {
			toast.success("Preferências de notificação atualizadas");
		},
		onError: (error) => {
			toast.error(error.message || "Erro ao salvar preferências");
		},
	});

	const onSubmit = (data: NotificationsFormValues) => {
		if (!session?.user?.id) return;
		upsertPreferences({
			where: { userId: session.user.id },
			create: { userId: session.user.id, ...data },
			update: data,
		});
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-8">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				<div className="relative">
					<h3 className="mb-4 font-medium text-lg">
						Alertas de Lançamento de Gás
					</h3>
					<div className="space-y-4">
						<FormField
							control={form.control}
							name="missingEntryAlertsEnabled"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel className="text-base">
											Alertas de lançamento pendente
										</FormLabel>
										<FormDescription>
											Receber notificações por e-mail quando o lançamento diário
											de consumo de gás não for realizado.
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="preferredNotificationHour"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel className="text-base">
											Horário preferencial de notificação
										</FormLabel>
										<FormDescription>
											Horário em que você prefere receber os alertas de
											lançamento pendente.
										</FormDescription>
									</div>
									<FormControl>
										<Select
											value={field.value.toString()}
											onValueChange={(value) =>
												field.onChange(Number.parseInt(value))
											}
										>
											<SelectTrigger className="w-24">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{hourOptions.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormControl>
								</FormItem>
							)}
						/>
					</div>
				</div>

				<div className="relative">
					<h3 className="mb-4 font-medium text-lg">Escalação para Supervisor</h3>
					<div className="space-y-4">
						<FormField
							control={form.control}
							name="escalationEnabled"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel className="text-base">
											Ativar escalação automática
										</FormLabel>
										<FormDescription>
											Notificar supervisores automaticamente quando o lançamento
											não for realizado dentro do prazo configurado.
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="escalationDelayHours"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel className="text-base">
											Tempo para escalação
										</FormLabel>
										<FormDescription>
											Tempo de espera após o alerta inicial antes de notificar
											os supervisores.
										</FormDescription>
									</div>
									<FormControl>
										<Select
											value={field.value.toString()}
											onValueChange={(value) =>
												field.onChange(Number.parseInt(value))
											}
										>
											<SelectTrigger className="w-28">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{escalationDelayOptions.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormControl>
								</FormItem>
							)}
						/>
					</div>
				</div>

				<Button type="submit" disabled={isPending}>
					{isPending && (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					)}
					Salvar preferências
				</Button>
			</form>
		</Form>
	);
}
