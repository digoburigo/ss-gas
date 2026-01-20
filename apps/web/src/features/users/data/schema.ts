import { z } from "zod";

// User status derived from invitation status or member state
const userStatusSchema = z.union([
  z.literal("active"),
  z.literal("inactive"),
  z.literal("invited"),
  z.literal("suspended"),
]);
export type UserStatus = z.infer<typeof userStatusSchema>;

// Better-auth organization roles
const memberRoleSchema = z.union([
  z.literal("owner"),
  z.literal("admin"),
  z.literal("member"),
]);
export type MemberRole = z.infer<typeof memberRoleSchema>;

// SS-GAS User Profiles
const gasUserProfileSchema = z.union([
  z.literal("admin"),
  z.literal("manager"),
  z.literal("operator"),
  z.literal("viewer"),
]);
export type GasUserProfile = z.infer<typeof gasUserProfileSchema>;

// Member with user data from better-auth listMembers
const memberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  organizationId: z.string(),
  role: memberRoleSchema,
  createdAt: z.coerce.date(),
  // User data (nested from better-auth)
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    image: z.string().nullable().optional(),
    emailVerified: z.boolean().optional(),
  }),
  // SS-GAS profile extension
  profile: gasUserProfileSchema.optional().default("viewer"),
  deactivatedAt: z.coerce.date().nullable().optional(),
});
export type Member = z.infer<typeof memberSchema>;

export const memberListSchema = z.array(memberSchema);

// Invitation from better-auth
const invitationSchema = z.object({
  id: z.string(),
  email: z.string(),
  organizationId: z.string(),
  role: memberRoleSchema.optional(),
  status: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  inviterId: z.string(),
});
export type Invitation = z.infer<typeof invitationSchema>;

export const invitationListSchema = z.array(invitationSchema);

// Legacy User type for backward compatibility with existing table
const userSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  username: z.string(),
  email: z.string(),
  phoneNumber: z.string(),
  status: userStatusSchema,
  role: z.union([
    z.literal("superadmin"),
    z.literal("admin"),
    z.literal("cashier"),
    z.literal("manager"),
  ]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type User = z.infer<typeof userSchema>;

export const userListSchema = z.array(userSchema);
