import { db } from "@acme/zen-v3";

type AuditAction = "create" | "update" | "delete" | "login" | "logout";

interface AuditLogParams {
	entityType: string;
	entityId: string;
	entityName?: string;
	action: AuditAction;
	field?: string;
	oldValue?: string | null;
	newValue?: string | null;
	changes?: Record<string, { old: unknown; new: unknown }>;
	userId?: string;
	userName?: string;
	userEmail?: string;
	organizationId?: string;
	metadata?: Record<string, unknown>;
}

interface FieldChange {
	old: unknown;
	new: unknown;
}

/**
 * Computes field-level changes between two objects.
 * Returns a record of { fieldName: { old, new } } for fields that differ.
 */
function computeChanges(
	oldData: Record<string, unknown>,
	newData: Record<string, unknown>,
	fieldsToTrack?: string[],
): Record<string, FieldChange> | null {
	const changes: Record<string, FieldChange> = {};
	const keys = fieldsToTrack ?? Object.keys(newData);

	for (const key of keys) {
		const oldVal = oldData[key];
		const newVal = newData[key];

		// Skip internal/system fields
		if (
			key === "id" ||
			key === "createdAt" ||
			key === "updatedAt" ||
			key === "organizationId" ||
			key === "createdById"
		) {
			continue;
		}

		const oldStr = JSON.stringify(oldVal ?? null);
		const newStr = JSON.stringify(newVal ?? null);

		if (oldStr !== newStr) {
			changes[key] = { old: oldVal ?? null, new: newVal ?? null };
		}
	}

	return Object.keys(changes).length > 0 ? changes : null;
}

function serializeValue(value: unknown): string | null {
	if (value === null || value === undefined) return null;
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean")
		return String(value);
	if (value instanceof Date) return value.toISOString();
	return JSON.stringify(value);
}

export const AuditService = {
	/**
	 * Log a single audit event.
	 * Fire-and-forget: errors are caught and logged but don't block the caller.
	 */
	async log(params: AuditLogParams): Promise<void> {
		try {
			await db.gasAuditLog.create({
				data: {
					entityType: params.entityType,
					entityId: params.entityId,
					entityName: params.entityName ?? null,
					action: params.action,
					field: params.field ?? null,
					oldValue:
						params.oldValue !== undefined
							? serializeValue(params.oldValue)
							: null,
					newValue:
						params.newValue !== undefined
							? serializeValue(params.newValue)
							: null,
					changes: params.changes ? JSON.stringify(params.changes) : null,
					userId: params.userId ?? null,
					userName: params.userName ?? null,
					userEmail: params.userEmail ?? null,
					organizationId: params.organizationId ?? null,
					metadata: params.metadata ? JSON.stringify(params.metadata) : null,
				},
			});
		} catch (error) {
			console.error("[AuditService] Failed to write audit log:", error);
		}
	},

	/**
	 * Log a create action — records the new entity.
	 */
	async logCreate(params: {
		entityType: string;
		entityId: string;
		entityName?: string;
		userId?: string;
		userName?: string;
		userEmail?: string;
		organizationId?: string;
		newData?: Record<string, unknown>;
	}): Promise<void> {
		await this.log({
			entityType: params.entityType,
			entityId: params.entityId,
			entityName: params.entityName,
			action: "create",
			changes: params.newData
				? Object.fromEntries(
						Object.entries(params.newData)
							.filter(
								([k]) =>
									!["id", "createdAt", "updatedAt", "organizationId", "createdById"].includes(k),
							)
							.map(([k, v]) => [k, { old: null, new: v }]),
					)
				: undefined,
			userId: params.userId,
			userName: params.userName,
			userEmail: params.userEmail,
			organizationId: params.organizationId,
		});
	},

	/**
	 * Log an update action — computes field-level changes automatically.
	 */
	async logUpdate(params: {
		entityType: string;
		entityId: string;
		entityName?: string;
		oldData: Record<string, unknown>;
		newData: Record<string, unknown>;
		fieldsToTrack?: string[];
		userId?: string;
		userName?: string;
		userEmail?: string;
		organizationId?: string;
	}): Promise<void> {
		const changes = computeChanges(
			params.oldData,
			params.newData,
			params.fieldsToTrack,
		);

		if (!changes) return; // No actual changes detected

		// If a single field changed, populate field/oldValue/newValue for convenience
		const changedFields = Object.keys(changes);
		const singleField = changedFields.length === 1 ? changedFields[0] : null;

		await this.log({
			entityType: params.entityType,
			entityId: params.entityId,
			entityName: params.entityName,
			action: "update",
			field: singleField ?? undefined,
			oldValue: singleField ? serializeValue(changes[singleField]!.old) : undefined,
			newValue: singleField ? serializeValue(changes[singleField]!.new) : undefined,
			changes,
			userId: params.userId,
			userName: params.userName,
			userEmail: params.userEmail,
			organizationId: params.organizationId,
		});
	},

	/**
	 * Log a delete action.
	 */
	async logDelete(params: {
		entityType: string;
		entityId: string;
		entityName?: string;
		userId?: string;
		userName?: string;
		userEmail?: string;
		organizationId?: string;
	}): Promise<void> {
		await this.log({
			entityType: params.entityType,
			entityId: params.entityId,
			entityName: params.entityName,
			action: "delete",
			userId: params.userId,
			userName: params.userName,
			userEmail: params.userEmail,
			organizationId: params.organizationId,
		});
	},

	/**
	 * Log a login event.
	 */
	async logLogin(params: {
		userId: string;
		userName: string;
		userEmail: string;
		organizationId?: string;
		metadata?: Record<string, unknown>;
	}): Promise<void> {
		await this.log({
			entityType: "session",
			entityId: params.userId,
			entityName: params.userName,
			action: "login",
			userId: params.userId,
			userName: params.userName,
			userEmail: params.userEmail,
			organizationId: params.organizationId,
			metadata: params.metadata,
		});
	},

	/**
	 * Log a logout event.
	 */
	async logLogout(params: {
		userId: string;
		userName: string;
		userEmail: string;
		organizationId?: string;
		metadata?: Record<string, unknown>;
	}): Promise<void> {
		await this.log({
			entityType: "session",
			entityId: params.userId,
			entityName: params.userName,
			action: "logout",
			userId: params.userId,
			userName: params.userName,
			userEmail: params.userEmail,
			organizationId: params.organizationId,
			metadata: params.metadata,
		});
	},

	computeChanges,
	serializeValue,
};
