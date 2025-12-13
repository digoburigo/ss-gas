"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@acme/ui/card";
import { ScrollArea } from "@acme/ui/scroll-area";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Edit, Plus, Trash2 } from "lucide-react";

type ActivityItem = {
	id: string;
	type: "created" | "updated" | "deleted";
	entity: "product" | "todo" | "test";
	entityId: string;
	entityName: string;
	userName: string;
	userImage?: string;
	timestamp: Date;
};

// Example activity data - in a real app, this would come from your API
const exampleActivities: ActivityItem[] = [
	{
		id: "1",
		type: "created",
		entity: "product",
		entityId: "prod-1",
		entityName: "Produto A",
		userName: "João Silva",
		userImage: undefined,
		timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
	},
	{
		id: "2",
		type: "updated",
		entity: "product",
		entityId: "prod-2",
		entityName: "Produto B",
		userName: "Maria Santos",
		userImage: undefined,
		timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
	},
	{
		id: "3",
		type: "created",
		entity: "product",
		entityId: "prod-3",
		entityName: "Produto C",
		userName: "Pedro Oliveira",
		userImage: undefined,
		timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
	},
	{
		id: "4",
		type: "updated",
		entity: "product",
		entityId: "prod-4",
		entityName: "Produto D",
		userName: "Ana Costa",
		userImage: undefined,
		timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
	},
	{
		id: "5",
		type: "deleted",
		entity: "product",
		entityId: "prod-5",
		entityName: "Produto E",
		userName: "Carlos Ferreira",
		userImage: undefined,
		timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
	},
	{
		id: "6",
		type: "created",
		entity: "product",
		entityId: "prod-6",
		entityName: "Produto F",
		userName: "Julia Lima",
		userImage: undefined,
		timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
	},
];

function getActivityIcon(type: ActivityItem["type"]) {
	switch (type) {
		case "created":
			return Plus;
		case "updated":
			return Edit;
		case "deleted":
			return Trash2;
	}
}

function getActivityColor(type: ActivityItem["type"]) {
	switch (type) {
		case "created":
			return "text-green-600 dark:text-green-400";
		case "updated":
			return "text-blue-600 dark:text-blue-400";
		case "deleted":
			return "text-red-600 dark:text-red-400";
	}
}

function getActivityLabel(type: ActivityItem["type"]) {
	switch (type) {
		case "created":
			return "criou";
		case "updated":
			return "atualizou";
		case "deleted":
			return "excluiu";
	}
}

function getEntityLabel(entity: ActivityItem["entity"]) {
	switch (entity) {
		case "product":
			return "produto";
		case "todo":
			return "tarefa";
		case "test":
			return "teste";
	}
}

export function ActivityHistory() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Histórico de Alterações</CardTitle>
				<CardDescription>
					Últimas alterações realizadas no sistema
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ScrollArea className="h-[400px]">
					<div className="space-y-4">
						{exampleActivities.map((activity) => {
							const Icon = getActivityIcon(activity.type);
							const color = getActivityColor(activity.type);
							const actionLabel = getActivityLabel(activity.type);
							const entityLabel = getEntityLabel(activity.entity);

							return (
								<div
									key={activity.id}
									className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
								>
									<Avatar className="size-8">
										<AvatarImage src={activity.userImage} />
										<AvatarFallback className="text-xs">
											{activity.userName
												.split(" ")
												.map((n) => n[0])
												.join("")
												.toUpperCase()
												.slice(0, 2)}
										</AvatarFallback>
									</Avatar>
									<div className="flex-1 space-y-1">
										<div className="flex items-center gap-2 text-sm">
											<span className="font-medium">{activity.userName}</span>
											<span className="text-muted-foreground">
												{actionLabel}
											</span>
											<span className="font-medium">{activity.entityName}</span>
											<span className="text-muted-foreground">
												({entityLabel})
											</span>
										</div>
										<div className="flex items-center gap-2 text-xs text-muted-foreground">
											<Icon className={`size-3 ${color}`} />
											<span>
												{formatDistanceToNow(activity.timestamp, {
													addSuffix: true,
													locale: ptBR,
												})}
											</span>
											{activity.entity === "product" && (
												<Link
													to="/products/$id"
													params={{ id: activity.entityId }}
													className="ml-auto text-primary hover:underline"
												>
													Ver detalhes
												</Link>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
