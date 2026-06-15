import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

import { createId } from "@/lib/ids";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const staffStatusEnum = pgEnum("staff_status", [
  "active",
  "invited",
  "disabled",
]);

export const roleScopeEnum = pgEnum("role_scope", ["system", "tenant"]);
export const customerTypeEnum = pgEnum("customer_type", ["person", "company"]);
export const leadActivityTypeEnum = pgEnum("lead_activity_type", [
  "created",
  "note",
  "stage_changed",
  "converted",
]);
export const webhookStatusEnum = pgEnum("webhook_status", ["active", "paused"]);
export const webhookDedupKeyEnum = pgEnum("webhook_dedup_key", [
  "email",
  "phone",
  "none",
]);
export const webhookDedupActionEnum = pgEnum("webhook_dedup_action", [
  "create",
  "update",
  "note",
]);
export const webhookUnmappedPolicyEnum = pgEnum("webhook_unmapped_policy", [
  "ignore",
  "store",
  "notify",
]);
export const webhookMappingTargetTypeEnum = pgEnum("webhook_mapping_target_type", [
  "lead_field",
  "attribution_field",
  "custom_field",
]);
export const customFieldEntityEnum = pgEnum("custom_field_entity", ["lead"]);
export const customFieldDataTypeEnum = pgEnum("custom_field_data_type", [
  "text",
  "number",
  "date",
  "boolean",
]);
export const webhookRequestResultEnum = pgEnum("webhook_request_result", [
  "created",
  "updated",
  "note",
  "rejected",
]);

export const tenants = pgTable("tenants", {
  id: uuid("id").$defaultFn(createId).primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps,
});

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
    isSuperAdmin: boolean("is_super_admin").default(false).notNull(),
    ...timestamps,
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
  }),
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    activeTenantId: uuid("active_tenant_id").references(() => tenants.id, {
      onDelete: "set null",
    }),
    activeStaffMemberId: uuid("active_staff_member_id"),
    ...timestamps,
  },
  (table) => ({
    tokenIdx: uniqueIndex("sessions_token_idx").on(table.token),
    userIdx: index("sessions_user_id_idx").on(table.userId),
  }),
);

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (table) => ({
    providerAccountIdx: unique("accounts_provider_account_unique").on(
      table.providerId,
      table.accountId,
    ),
    userIdx: index("accounts_user_id_idx").on(table.userId),
  }),
);

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey().$defaultFn(createId),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ...timestamps,
});

export const twoFactors = pgTable(
  "two_factor",
  {
    id: uuid("id").$defaultFn(createId).primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    verified: boolean("verified").default(true).notNull(),
  },
  (table) => ({
    userIdx: uniqueIndex("two_factor_user_id_idx").on(table.userId),
  }),
);

export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").$defaultFn(createId).primaryKey(),
    moduleKey: text("module_key").notNull(),
    action: text("action").notNull(),
    description: text("description").notNull(),
  },
  (table) => ({
    uniquePermissionIdx: uniqueIndex("permissions_module_action_idx").on(
      table.moduleKey,
      table.action,
    ),
  }),
);

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").$defaultFn(createId).primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, {
        onDelete: "cascade",
      }),
    name: text("name").notNull(),
    scope: roleScopeEnum("scope").default("tenant").notNull(),
    isSystem: boolean("is_system").default(false).notNull(),
    ...timestamps,
  },
  (table) => ({
    tenantNameIdx: uniqueIndex("roles_tenant_name_idx").on(
      table.tenantId,
      table.name,
    ),
  }),
).enableRLS();

export const rolePermissions = pgTable(
  "role_permissions",
  {
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
    tenantRoleIdx: index("role_permissions_tenant_role_idx").on(
      table.tenantId,
      table.roleId,
    ),
  }),
).enableRLS();

export const staffMembers = pgTable(
  "staff_members",
  {
    id: uuid("id").$defaultFn(createId).primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    displayName: text("display_name").notNull(),
    status: staffStatusEnum("status").default("active").notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (table) => ({
    tenantUserIdx: uniqueIndex("staff_members_tenant_user_idx").on(
      table.tenantId,
      table.userId,
    ),
    tenantRoleIdx: index("staff_members_tenant_role_idx").on(
      table.tenantId,
      table.roleId,
    ),
  }),
).enableRLS();

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").$defaultFn(createId).primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    actorStaffMemberId: uuid("actor_staff_member_id").references(
      () => staffMembers.id,
      { onDelete: "set null" },
    ),
    event: text("event").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: uuid("resource_id"),
    payload: jsonb("payload").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantEventIdx: index("audit_logs_tenant_event_idx").on(
      table.tenantId,
      table.event,
    ),
  }),
).enableRLS();

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").$defaultFn(createId).primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    type: customerTypeEnum("type").default("company").notNull(),
    legalName: text("legal_name").notNull(),
    tradeName: text("trade_name"),
    taxId: text("tax_id").notNull(),
    stateRegistration: text("state_registration"),
    zipCode: text("zip_code"),
    addressLine1: text("address_line_1"),
    addressLine2: text("address_line_2"),
    neighborhood: text("neighborhood"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    country: text("country").default("BR").notNull(),
    phone: text("phone"),
    website: text("website"),
    currency: text("currency").default("BRL").notNull(),
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    createdByStaffMemberId: uuid("created_by_staff_member_id").references(
      () => staffMembers.id,
      { onDelete: "set null" },
    ),
    ...timestamps,
  },
  (table) => ({
    tenantTaxIdIdx: uniqueIndex("customers_tenant_tax_id_idx").on(
      table.tenantId,
      table.taxId,
    ),
    tenantNameIdx: index("customers_tenant_legal_name_idx").on(
      table.tenantId,
      table.legalName,
    ),
  }),
).enableRLS();

export const customerContacts = pgTable(
  "customer_contacts",
  {
    id: uuid("id").$defaultFn(createId).primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    whatsapp: text("whatsapp"),
    jobTitle: text("job_title"),
    isPrimary: boolean("is_primary").default(false).notNull(),
    portalPermissions: jsonb("portal_permissions").$type<string[]>().default([]).notNull(),
    ...timestamps,
  },
  (table) => ({
    tenantCustomerEmailIdx: uniqueIndex("customer_contacts_tenant_email_idx").on(
      table.tenantId,
      table.email,
    ),
    tenantCustomerIdx: index("customer_contacts_tenant_customer_idx").on(
      table.tenantId,
      table.customerId,
    ),
  }),
).enableRLS();

export const customerNotes = pgTable(
  "customer_notes",
  {
    id: uuid("id").$defaultFn(createId).primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    authorStaffMemberId: uuid("author_staff_member_id").references(
      () => staffMembers.id,
      { onDelete: "set null" },
    ),
    body: text("body").notNull(),
    ...timestamps,
  },
  (table) => ({
    tenantCustomerIdx: index("customer_notes_tenant_customer_idx").on(
      table.tenantId,
      table.customerId,
    ),
  }),
).enableRLS();

export const leadStages = pgTable(
  "lead_stages",
  {
    id: uuid("id").$defaultFn(createId).primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").default("#2563EB").notNull(),
    position: integer("position").notNull(),
    isSystem: boolean("is_system").default(true).notNull(),
    ...timestamps,
  },
  (table) => ({
    tenantNameIdx: uniqueIndex("lead_stages_tenant_name_idx").on(
      table.tenantId,
      table.name,
    ),
    tenantPositionIdx: uniqueIndex("lead_stages_tenant_position_idx").on(
      table.tenantId,
      table.position,
    ),
  }),
).enableRLS();

export const customFields = pgTable(
  "custom_fields",
  {
    id: uuid("id").$defaultFn(createId).primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    entity: customFieldEntityEnum("entity").default("lead").notNull(),
    key: text("key").notNull(),
    label: text("label").notNull(),
    dataType: customFieldDataTypeEnum("data_type").default("text").notNull(),
    isRequired: boolean("is_required").default(false).notNull(),
    ...timestamps,
  },
  (table) => ({
    tenantEntityKeyIdx: uniqueIndex("custom_fields_tenant_entity_key_idx").on(
      table.tenantId,
      table.entity,
      table.key,
    ),
  }),
).enableRLS();

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").$defaultFn(createId).primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    stageId: uuid("stage_id")
      .notNull()
      .references(() => leadStages.id, { onDelete: "restrict" }),
    assignedStaffMemberId: uuid("assigned_staff_member_id").references(
      () => staffMembers.id,
      { onDelete: "set null" },
    ),
    convertedCustomerId: uuid("converted_customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    company: text("company"),
    email: text("email").notNull(),
    phone: text("phone"),
    source: text("source").notNull(),
    estimatedValueInCents: integer("estimated_value_in_cents").default(0).notNull(),
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    customData: jsonb("custom_data").$type<Record<string, unknown>>().default({}).notNull(),
    description: text("description"),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).defaultNow().notNull(),
    createdByStaffMemberId: uuid("created_by_staff_member_id").references(
      () => staffMembers.id,
      { onDelete: "set null" },
    ),
    ...timestamps,
  },
  (table) => ({
    tenantEmailIdx: index("leads_tenant_email_idx").on(table.tenantId, table.email),
    tenantStageIdx: index("leads_tenant_stage_idx").on(table.tenantId, table.stageId),
    tenantAssignedIdx: index("leads_tenant_assigned_idx").on(
      table.tenantId,
      table.assignedStaffMemberId,
    ),
  }),
).enableRLS();

export const leadActivities = pgTable(
  "lead_activities",
  {
    id: uuid("id").$defaultFn(createId).primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    actorStaffMemberId: uuid("actor_staff_member_id").references(
      () => staffMembers.id,
      { onDelete: "set null" },
    ),
    type: leadActivityTypeEnum("type").notNull(),
    body: text("body").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    ...timestamps,
  },
  (table) => ({
    tenantLeadIdx: index("lead_activities_tenant_lead_idx").on(
      table.tenantId,
      table.leadId,
    ),
  }),
).enableRLS();

export const leadAttributions = pgTable(
  "lead_attributions",
  {
    id: uuid("id").$defaultFn(createId).primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    entryPoint: text("entry_point").notNull(),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    utmTerm: text("utm_term"),
    utmContent: text("utm_content"),
    gclid: text("gclid"),
    fbclid: text("fbclid"),
    fbp: text("fbp"),
    fbc: text("fbc"),
    ttclid: text("ttclid"),
    ctwaClid: text("ctwa_clid"),
    referral: text("referral"),
    pageUrl: text("page_url"),
    referrer: text("referrer"),
    extraData: jsonb("extra_data").$type<Record<string, unknown>>().default({}).notNull(),
    ...timestamps,
  },
  (table) => ({
    leadIdx: uniqueIndex("lead_attributions_lead_id_idx").on(table.leadId),
    tenantSourceIdx: index("lead_attributions_tenant_source_idx").on(
      table.tenantId,
      table.utmSource,
    ),
  }),
).enableRLS();

export const inboundWebhooks = pgTable(
  "inbound_webhooks",
  {
    id: uuid("id").$defaultFn(createId).primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    secretHash: text("secret_hash").notNull(),
    defaultStageId: uuid("default_stage_id").references(() => leadStages.id, {
      onDelete: "set null",
    }),
    defaultSource: text("default_source"),
    defaultOwnerId: uuid("default_owner_id").references(() => staffMembers.id, {
      onDelete: "set null",
    }),
    roundRobinEnabled: boolean("round_robin_enabled").default(false).notNull(),
    autoTags: jsonb("auto_tags").$type<string[]>().default([]).notNull(),
    dedupKey: webhookDedupKeyEnum("dedup_key").default("email").notNull(),
    dedupAction: webhookDedupActionEnum("dedup_action").default("create").notNull(),
    unmappedPolicy: webhookUnmappedPolicyEnum("unmapped_policy").default("store").notNull(),
    status: webhookStatusEnum("status").default("active").notNull(),
    validation: jsonb("validation").$type<Record<string, unknown>>().default({}).notNull(),
    ...timestamps,
  },
  (table) => ({
    tenantNameIdx: uniqueIndex("inbound_webhooks_tenant_name_idx").on(
      table.tenantId,
      table.name,
    ),
  }),
).enableRLS();

export const webhookFieldMappings = pgTable(
  "webhook_field_mappings",
  {
    id: uuid("id").$defaultFn(createId).primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    webhookId: uuid("webhook_id")
      .notNull()
      .references(() => inboundWebhooks.id, { onDelete: "cascade" }),
    sourceField: text("source_field").notNull(),
    targetType: webhookMappingTargetTypeEnum("target_type").notNull(),
    targetKey: text("target_key").notNull(),
    transform: jsonb("transform").$type<Record<string, unknown>>().default({}).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    ...timestamps,
  },
  (table) => ({
    webhookSourceIdx: uniqueIndex("webhook_field_mappings_source_idx").on(
      table.webhookId,
      table.sourceField,
      table.targetKey,
    ),
  }),
).enableRLS();

export const webhookRequestLogs = pgTable(
  "webhook_request_logs",
  {
    id: uuid("id").$defaultFn(createId).primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    webhookId: uuid("webhook_id")
      .notNull()
      .references(() => inboundWebhooks.id, { onDelete: "cascade" }),
    rawPayload: jsonb("raw_payload").$type<Record<string, unknown>>().notNull(),
    result: webhookRequestResultEnum("result").notNull(),
    reason: text("reason"),
    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
    ipAddress: text("ip_address"),
    eventId: text("event_id"),
    ...timestamps,
  },
  (table) => ({
    webhookCreatedIdx: index("webhook_request_logs_webhook_created_idx").on(
      table.webhookId,
      table.createdAt,
    ),
    webhookEventIdx: uniqueIndex("webhook_request_logs_event_id_idx").on(
      table.webhookId,
      table.eventId,
    ),
  }),
).enableRLS();

export const queueJobs = pgTable(
  "queue_jobs",
  {
    id: uuid("id").$defaultFn(createId).primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    queueName: text("queue_name").notNull(),
    jobName: text("job_name").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    status: text("status").default("pending").notNull(),
    ...timestamps,
  },
  (table) => ({
    tenantQueueIdx: index("queue_jobs_tenant_queue_idx").on(
      table.tenantId,
      table.queueName,
    ),
  }),
).enableRLS();

export const tenantScopedTables = {
  roles,
  staffMembers,
  auditLogs,
  customers,
  customerContacts,
  customerNotes,
  leadStages,
  customFields,
  leads,
  leadActivities,
  leadAttributions,
  inboundWebhooks,
  webhookFieldMappings,
  webhookRequestLogs,
  queueJobs,
} as const;

export type TenantScopedTableName = keyof typeof tenantScopedTables;

export const usersRelations = relations(users, ({ many }) => ({
  staffMemberships: many(staffMembers),
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [roles.tenantId],
    references: [tenants.id],
  }),
  staffMembers: many(staffMembers),
  rolePermissions: many(rolePermissions),
}));

export const staffMembersRelations = relations(staffMembers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [staffMembers.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [staffMembers.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [staffMembers.roleId],
    references: [roles.id],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [customers.tenantId],
    references: [tenants.id],
  }),
  createdBy: one(staffMembers, {
    fields: [customers.createdByStaffMemberId],
    references: [staffMembers.id],
  }),
  contacts: many(customerContacts),
  notes: many(customerNotes),
}));

export const customerContactsRelations = relations(customerContacts, ({ one }) => ({
  tenant: one(tenants, {
    fields: [customerContacts.tenantId],
    references: [tenants.id],
  }),
  customer: one(customers, {
    fields: [customerContacts.customerId],
    references: [customers.id],
  }),
}));

export const customerNotesRelations = relations(customerNotes, ({ one }) => ({
  tenant: one(tenants, {
    fields: [customerNotes.tenantId],
    references: [tenants.id],
  }),
  customer: one(customers, {
    fields: [customerNotes.customerId],
    references: [customers.id],
  }),
  author: one(staffMembers, {
    fields: [customerNotes.authorStaffMemberId],
    references: [staffMembers.id],
  }),
}));

export const leadStagesRelations = relations(leadStages, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [leadStages.tenantId],
    references: [tenants.id],
  }),
  leads: many(leads),
}));

export const customFieldsRelations = relations(customFields, ({ one }) => ({
  tenant: one(tenants, {
    fields: [customFields.tenantId],
    references: [tenants.id],
  }),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [leads.tenantId],
    references: [tenants.id],
  }),
  stage: one(leadStages, {
    fields: [leads.stageId],
    references: [leadStages.id],
  }),
  assignee: one(staffMembers, {
    fields: [leads.assignedStaffMemberId],
    references: [staffMembers.id],
  }),
  convertedCustomer: one(customers, {
    fields: [leads.convertedCustomerId],
    references: [customers.id],
  }),
  createdBy: one(staffMembers, {
    fields: [leads.createdByStaffMemberId],
    references: [staffMembers.id],
  }),
  activities: many(leadActivities),
  attribution: many(leadAttributions),
  webhookLogs: many(webhookRequestLogs),
}));

export const leadActivitiesRelations = relations(leadActivities, ({ one }) => ({
  tenant: one(tenants, {
    fields: [leadActivities.tenantId],
    references: [tenants.id],
  }),
  lead: one(leads, {
    fields: [leadActivities.leadId],
    references: [leads.id],
  }),
  actor: one(staffMembers, {
    fields: [leadActivities.actorStaffMemberId],
    references: [staffMembers.id],
  }),
}));

export const leadAttributionsRelations = relations(leadAttributions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [leadAttributions.tenantId],
    references: [tenants.id],
  }),
  lead: one(leads, {
    fields: [leadAttributions.leadId],
    references: [leads.id],
  }),
}));

export const inboundWebhooksRelations = relations(inboundWebhooks, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [inboundWebhooks.tenantId],
    references: [tenants.id],
  }),
  defaultStage: one(leadStages, {
    fields: [inboundWebhooks.defaultStageId],
    references: [leadStages.id],
  }),
  defaultOwner: one(staffMembers, {
    fields: [inboundWebhooks.defaultOwnerId],
    references: [staffMembers.id],
  }),
  mappings: many(webhookFieldMappings),
  requestLogs: many(webhookRequestLogs),
}));

export const webhookFieldMappingsRelations = relations(
  webhookFieldMappings,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [webhookFieldMappings.tenantId],
      references: [tenants.id],
    }),
    webhook: one(inboundWebhooks, {
      fields: [webhookFieldMappings.webhookId],
      references: [inboundWebhooks.id],
    }),
  }),
);

export const webhookRequestLogsRelations = relations(webhookRequestLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [webhookRequestLogs.tenantId],
    references: [tenants.id],
  }),
  webhook: one(inboundWebhooks, {
    fields: [webhookRequestLogs.webhookId],
    references: [inboundWebhooks.id],
  }),
  lead: one(leads, {
    fields: [webhookRequestLogs.leadId],
    references: [leads.id],
  }),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [rolePermissions.tenantId],
    references: [tenants.id],
  }),
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const authSchema = {
  user: users,
  session: sessions,
  account: accounts,
  verification: verifications,
  twoFactor: twoFactors,
};

export const schema = {
  tenants,
  users,
  sessions,
  accounts,
  verifications,
  twoFactors,
  staffMembers,
  roles,
  permissions,
  rolePermissions,
  auditLogs,
  customers,
  customerContacts,
  customerNotes,
  leadStages,
  customFields,
  leads,
  leadActivities,
  leadAttributions,
  inboundWebhooks,
  webhookFieldMappings,
  webhookRequestLogs,
  queueJobs,
};

export type DatabaseSchema = typeof schema;

export const rlsTenantExpression = sql`current_setting('app.current_tenant_id', true)::uuid`;
