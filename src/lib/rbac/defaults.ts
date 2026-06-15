import type { PermissionAction } from "@/lib/rbac";

export const MODULE_KEYS = [
  "crm",
  "customers",
  "leads",
  "webhooks",
  "billing",
  "iam",
  "realtime",
] as const;

export const PERMISSION_ACTIONS: PermissionAction[] = [
  "view",
  "view_own",
  "create",
  "edit",
  "delete",
];

export const DEFAULT_ROLE_NAMES = [
  "Admin",
  "Gerente",
  "Vendedor",
  "Atendente",
  "Financeiro",
] as const;

export const DEFAULT_PERMISSIONS = MODULE_KEYS.flatMap((moduleKey) =>
  PERMISSION_ACTIONS.map((action) => ({
    moduleKey,
    action,
    description: `${moduleKey}:${action}`,
  })),
);

type PermissionKey = `${(typeof MODULE_KEYS)[number]}.${PermissionAction}`;
type RoleName = (typeof DEFAULT_ROLE_NAMES)[number];

const allPermissionKeys = DEFAULT_PERMISSIONS.map(
  (permission) => `${permission.moduleKey}.${permission.action}` as PermissionKey,
);

export const DEFAULT_ROLE_PERMISSION_MAP: Record<RoleName, PermissionKey[]> = {
  Admin: allPermissionKeys,
  Gerente: allPermissionKeys.filter((key) => !key.startsWith("iam.delete")),
  Vendedor: [
    "crm.view",
    "crm.view_own",
    "crm.create",
    "crm.edit",
    "leads.view",
    "leads.view_own",
    "leads.create",
    "leads.edit",
    "webhooks.view",
    "billing.view_own",
    "realtime.view",
  ],
  Atendente: [
    "crm.view",
    "crm.view_own",
    "crm.edit",
    "leads.view",
    "leads.view_own",
    "leads.edit",
    "webhooks.view",
    "realtime.view",
    "realtime.edit",
  ],
  Financeiro: [
    "billing.view",
    "billing.view_own",
    "billing.create",
    "billing.edit",
    "billing.delete",
    "crm.view",
    "leads.view",
    "webhooks.view",
  ],
};
