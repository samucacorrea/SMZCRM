"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { customFields, customerContacts, customerNotes, customers } from "@/lib/db/schema";
import { AppError } from "@/lib/errors";
import { createId } from "@/lib/ids";
import { assertPermission } from "@/lib/rbac";
import { getTenantContext } from "@/lib/tenant-context";
import { parseCustomerImportCsv } from "@/modules/customers/csv";
import {
  customerPortalPermissionValues,
  createCustomerContactSchema,
  createCustomerCustomFieldSchema,
  createCustomerNoteSchema,
  createCustomerSchema,
  importCustomerRowSchema,
  updateCustomerContactAccessSchema,
  updateCustomerCustomDataSchema,
} from "@/modules/customers/validators";

export type CustomerActionState = {
  error?: string;
  success?: string;
};

export type CustomerImportActionState = CustomerActionState & {
  created?: number;
  failed?: number;
  errors?: string[];
};

function getCustomerCustomFieldFormKey(fieldKey: string) {
  return `custom:${fieldKey}`;
}

function normalizeCustomerCustomFieldValue(
  field: {
    key: string;
    label: string;
    dataType: "text" | "number" | "date" | "boolean";
    isRequired: boolean;
  },
  formData: FormData,
) {
  if (field.dataType === "boolean") {
    return {
      ok: true as const,
      value: formData.get(getCustomerCustomFieldFormKey(field.key)) === "on",
    };
  }

  const rawValue = formData.get(getCustomerCustomFieldFormKey(field.key));
  const value = typeof rawValue === "string" ? rawValue.trim() : "";

  if (!value) {
    if (field.isRequired) {
      return {
        ok: false as const,
        error: `O campo ${field.label} e obrigatorio.`,
      };
    }

    return {
      ok: true as const,
      value: null,
    };
  }

  if (field.dataType === "number") {
    const parsedNumber = Number(value.replace(",", "."));

    if (Number.isNaN(parsedNumber)) {
      return {
        ok: false as const,
        error: `O campo ${field.label} precisa ser numerico.`,
      };
    }

    return {
      ok: true as const,
      value: parsedNumber,
    };
  }

  if (field.dataType === "date") {
    if (Number.isNaN(Date.parse(value))) {
      return {
        ok: false as const,
        error: `O campo ${field.label} precisa ser uma data valida.`,
      };
    }

    return {
      ok: true as const,
      value,
    };
  }

  return {
    ok: true as const,
    value,
  };
}

export async function createCustomerAction(
  _previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  await assertPermission("customers", "create");
  const tenantContext = await getTenantContext();

  const parsed = createCustomerSchema.safeParse({
    legalName: formData.get("legalName"),
    tradeName: formData.get("tradeName"),
    taxId: formData.get("taxId"),
    email: formData.get("email"),
    contactName: formData.get("contactName"),
    phone: formData.get("phone"),
    website: formData.get("website"),
    zipCode: formData.get("zipCode"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2"),
    neighborhood: formData.get("neighborhood"),
    city: formData.get("city"),
    state: formData.get("state"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const existingCustomer = await db.query.customers.findFirst({
    where: (table, { and, eq }) =>
      and(eq(table.tenantId, tenantContext.tenantId), eq(table.taxId, parsed.data.taxId)),
  });

  if (existingCustomer) {
    return {
      error: "Ja existe um cliente com este CPF/CNPJ neste tenant.",
    };
  }

  const customerId = createId();
  const contactId = createId();

  await db.transaction(async (tx) => {
    await tx.insert(customers).values({
      id: customerId,
      tenantId: tenantContext.tenantId,
      legalName: parsed.data.legalName,
      tradeName: parsed.data.tradeName || parsed.data.legalName,
      taxId: parsed.data.taxId,
      zipCode: parsed.data.zipCode || null,
      addressLine1: parsed.data.addressLine1 || null,
      addressLine2: parsed.data.addressLine2 || null,
      neighborhood: parsed.data.neighborhood || null,
      city: parsed.data.city,
      state: parsed.data.state.toUpperCase(),
      country: "BR",
      phone: parsed.data.phone,
      website: parsed.data.website || null,
      currency: "BRL",
      tags: [],
      createdByStaffMemberId: tenantContext.staffMemberId,
    });

    await tx.insert(customerContacts).values({
      id: contactId,
      tenantId: tenantContext.tenantId,
      customerId,
      name: parsed.data.contactName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      whatsapp: parsed.data.phone,
      jobTitle: "Contato principal",
      isPrimary: true,
      portalPermissions: [],
    });
  });

  revalidatePath("/customers");

  return {
    success: "Cliente criado com sucesso.",
  };
}

export async function createCustomerContactAction(
  customerId: string,
  _previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  await assertPermission("customers", "edit");
  const tenantContext = await getTenantContext();

  const parsed = createCustomerContactSchema.safeParse({
    customerId,
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    jobTitle: formData.get("jobTitle"),
    isPrimary: formData.get("isPrimary") === "on",
    portalPermissions: formData
      .getAll("portalPermissions")
      .filter((value): value is string =>
        typeof value === "string" &&
        customerPortalPermissionValues.includes(value as (typeof customerPortalPermissionValues)[number]),
      ),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const customer = await db.query.customers.findFirst({
    where: and(
      eq(customers.id, parsed.data.customerId),
      eq(customers.tenantId, tenantContext.tenantId),
    ),
  });

  if (!customer) {
    return {
      error: "Cliente nao encontrado.",
    };
  }

  const existingContact = await db.query.customerContacts.findFirst({
    where: and(
      eq(customerContacts.tenantId, tenantContext.tenantId),
      eq(customerContacts.email, parsed.data.email),
    ),
  });

  if (existingContact) {
    return {
      error: "Ja existe um contato com este e-mail neste tenant.",
    };
  }

  const existingContacts = await db.query.customerContacts.findMany({
    where: and(
      eq(customerContacts.tenantId, tenantContext.tenantId),
      eq(customerContacts.customerId, parsed.data.customerId),
    ),
  });

  const shouldBePrimary = parsed.data.isPrimary || existingContacts.length === 0;

  await db.transaction(async (tx) => {
    if (shouldBePrimary) {
      await tx
        .update(customerContacts)
        .set({
          isPrimary: false,
        })
        .where(
          and(
            eq(customerContacts.tenantId, tenantContext.tenantId),
            eq(customerContacts.customerId, parsed.data.customerId),
          ),
        );
    }

    await tx.insert(customerContacts).values({
      id: createId(),
      tenantId: tenantContext.tenantId,
      customerId: parsed.data.customerId,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      whatsapp: parsed.data.whatsapp || parsed.data.phone,
      jobTitle: parsed.data.jobTitle || "Contato",
      isPrimary: shouldBePrimary,
      portalPermissions: parsed.data.portalPermissions,
    });
  });

  revalidatePath(`/customers/${customerId}`);

  return {
    success: "Contato criado com sucesso.",
  };
}

export async function updateCustomerContactAccessAction(
  contactId: string,
  _previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  await assertPermission("customers", "edit");
  const tenantContext = await getTenantContext();

  const parsed = updateCustomerContactAccessSchema.safeParse({
    contactId,
    customerId: formData.get("customerId"),
    isPrimary: formData.get("isPrimary") === "on",
    portalPermissions: formData
      .getAll("portalPermissions")
      .filter((value): value is string =>
        typeof value === "string" &&
        customerPortalPermissionValues.includes(value as (typeof customerPortalPermissionValues)[number]),
      ),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const contact = await db.query.customerContacts.findFirst({
    where: and(
      eq(customerContacts.id, parsed.data.contactId),
      eq(customerContacts.tenantId, tenantContext.tenantId),
      eq(customerContacts.customerId, parsed.data.customerId),
    ),
  });

  if (!contact) {
    return {
      error: "Contato nao encontrado.",
    };
  }

  await db.transaction(async (tx) => {
    if (parsed.data.isPrimary) {
      await tx
        .update(customerContacts)
        .set({
          isPrimary: false,
        })
        .where(
          and(
            eq(customerContacts.tenantId, tenantContext.tenantId),
            eq(customerContacts.customerId, parsed.data.customerId),
          ),
        );
    }

    await tx
      .update(customerContacts)
      .set({
        isPrimary: parsed.data.isPrimary,
        portalPermissions: parsed.data.portalPermissions,
      })
      .where(eq(customerContacts.id, parsed.data.contactId));
  });

  revalidatePath(`/customers/${parsed.data.customerId}`);

  return {
    success: "Acesso do contato atualizado.",
  };
}

export async function createCustomerCustomFieldAction(
  customerId: string,
  _previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  await assertPermission("customers", "edit");
  const tenantContext = await getTenantContext();

  const parsed = createCustomerCustomFieldSchema.safeParse({
    customerId,
    label: formData.get("label"),
    key: formData.get("key"),
    dataType: formData.get("dataType"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const customer = await db.query.customers.findFirst({
    where: and(
      eq(customers.id, parsed.data.customerId),
      eq(customers.tenantId, tenantContext.tenantId),
    ),
  });

  if (!customer) {
    return {
      error: "Cliente nao encontrado.",
    };
  }

  const existingField = await db.query.customFields.findFirst({
    where: and(
      eq(customFields.tenantId, tenantContext.tenantId),
      eq(customFields.entity, "customer"),
      eq(customFields.key, parsed.data.key),
    ),
  });

  if (existingField) {
    return {
      error: "Ja existe um campo extra com esta chave.",
    };
  }

  await db.insert(customFields).values({
    id: createId(),
    tenantId: tenantContext.tenantId,
    entity: "customer",
    key: parsed.data.key,
    label: parsed.data.label,
    dataType: parsed.data.dataType,
    isRequired: false,
  });

  revalidatePath(`/customers/${parsed.data.customerId}`);

  return {
    success: "Campo extra criado com sucesso.",
  };
}

export async function updateCustomerCustomDataAction(
  customerId: string,
  _previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  await assertPermission("customers", "edit");
  const tenantContext = await getTenantContext();

  const parsed = updateCustomerCustomDataSchema.safeParse({
    customerId,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const [customer, fields] = await Promise.all([
    db.query.customers.findFirst({
      where: and(
        eq(customers.id, parsed.data.customerId),
        eq(customers.tenantId, tenantContext.tenantId),
      ),
    }),
    db.query.customFields.findMany({
      where: and(
        eq(customFields.tenantId, tenantContext.tenantId),
        eq(customFields.entity, "customer"),
      ),
      orderBy: (table, { asc }) => [asc(table.label)],
    }),
  ]);

  if (!customer) {
    return {
      error: "Cliente nao encontrado.",
    };
  }

  const nextCustomData = { ...(customer.customData ?? {}) } as Record<string, unknown>;

  for (const field of fields) {
    const normalized = normalizeCustomerCustomFieldValue(field, formData);

    if (!normalized.ok) {
      return {
        error: normalized.error,
      };
    }

    if (normalized.value === null) {
      delete nextCustomData[field.key];
      continue;
    }

    nextCustomData[field.key] = normalized.value;
  }

  await db
    .update(customers)
    .set({
      customData: nextCustomData,
      updatedAt: new Date(),
    })
    .where(eq(customers.id, parsed.data.customerId));

  revalidatePath(`/customers/${parsed.data.customerId}`);

  return {
    success: "Campos extras atualizados.",
  };
}

export async function createCustomerNoteAction(
  customerId: string,
  _previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  await assertPermission("customers", "edit");
  const tenantContext = await getTenantContext();

  const parsed = createCustomerNoteSchema.safeParse({
    customerId,
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const customer = await db.query.customers.findFirst({
    where: and(
      eq(customers.id, parsed.data.customerId),
      eq(customers.tenantId, tenantContext.tenantId),
    ),
  });

  if (!customer) {
    return {
      error: "Cliente nao encontrado.",
    };
  }

  await db.insert(customerNotes).values({
    id: createId(),
    tenantId: tenantContext.tenantId,
    customerId: parsed.data.customerId,
    authorStaffMemberId: tenantContext.staffMemberId,
    body: parsed.data.body,
  });

  revalidatePath(`/customers/${customerId}`);

  return {
    success: "Nota registrada com sucesso.",
  };
}

export async function importCustomersCsvAction(
  _previousState: CustomerImportActionState,
  formData: FormData,
): Promise<CustomerImportActionState> {
  await assertPermission("customers", "create");
  const tenantContext = await getTenantContext();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return {
      error: "Selecione um arquivo CSV valido.",
    };
  }

  if (file.size > 1024 * 1024) {
    return {
      error: "O CSV deve ter no maximo 1 MB.",
    };
  }

  let rows;

  try {
    const content = new TextDecoder("utf-8").decode(await file.arrayBuffer());
    rows = parseCustomerImportCsv(content);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Falha ao ler o CSV.",
    };
  }

  const errors: string[] = [];
  const parsedRows = rows.map((row, index) => ({
    index,
    parsed: importCustomerRowSchema.safeParse(row),
  }));

  for (const row of parsedRows) {
    if (!row.parsed.success) {
      errors.push(
        `Linha ${row.index + 2}: ${row.parsed.error.issues[0]?.message ?? "dados invalidos"}`,
      );
    }
  }

  const validRows = parsedRows
    .filter((row): row is { index: number; parsed: { success: true; data: typeof rows[number] } } => row.parsed.success)
    .map((row) => row.parsed.data);

  const taxIds = validRows.map((row) => row.taxId);
  const existingCustomers = taxIds.length
    ? await db.query.customers.findMany({
        where: and(
          eq(customers.tenantId, tenantContext.tenantId),
          inArray(customers.taxId, taxIds),
        ),
      })
    : [];

  const existingTaxIds = new Set(existingCustomers.map((customer) => customer.taxId));
  const seenTaxIds = new Set<string>();
  const rowsToInsert = validRows.filter((row, index) => {
    if (existingTaxIds.has(row.taxId)) {
      errors.push(`Linha ${index + 2}: cliente com este CPF/CNPJ ja existe.`);
      return false;
    }

    if (seenTaxIds.has(row.taxId)) {
      errors.push(`Linha ${index + 2}: CPF/CNPJ duplicado no mesmo arquivo.`);
      return false;
    }

    seenTaxIds.add(row.taxId);
    return true;
  });

  if (rowsToInsert.length > 0) {
    await db.transaction(async (tx) => {
      for (const row of rowsToInsert) {
        const customerId = createId();

        await tx.insert(customers).values({
          id: customerId,
          tenantId: tenantContext.tenantId,
          legalName: row.legalName,
          tradeName: row.tradeName || row.legalName,
          taxId: row.taxId,
          city: row.city,
          state: row.state.toUpperCase(),
          country: "BR",
          phone: row.phone,
          website: row.website || null,
          zipCode: row.zipCode || null,
          addressLine1: row.addressLine1 || null,
          addressLine2: row.addressLine2 || null,
          neighborhood: row.neighborhood || null,
          currency: "BRL",
          tags: [],
          createdByStaffMemberId: tenantContext.staffMemberId,
        });

        await tx.insert(customerContacts).values({
          id: createId(),
          tenantId: tenantContext.tenantId,
          customerId,
          name: row.contactName,
          email: row.email,
          phone: row.phone,
          whatsapp: row.phone,
          jobTitle: "Contato principal",
          isPrimary: true,
          portalPermissions: [],
        });
      }
    });
  }

  revalidatePath("/customers");

  return {
    success:
      rowsToInsert.length > 0
        ? "Importacao concluida."
        : "Nenhum cliente novo foi importado.",
    created: rowsToInsert.length,
    failed: errors.length,
    errors: errors.slice(0, 10),
  };
}

export async function assertCustomerModuleEnabled() {
  const tenantContext = await getTenantContext();

  if (!tenantContext.tenantId) {
    throw new AppError("Tenant ativo nao encontrado", 400);
  }
}
