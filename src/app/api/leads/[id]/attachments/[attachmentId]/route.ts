import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { leadAttachments } from "@/lib/db/schema";
import { assertPermission } from "@/lib/rbac";
import { storage } from "@/lib/storage";
import { getTenantContext } from "@/lib/tenant-context";
import { and, eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  await assertPermission("leads", "view");
  const tenantContext = await getTenantContext();
  const { id, attachmentId } = await params;

  const attachment = await db.query.leadAttachments.findFirst({
    where: and(
      eq(leadAttachments.id, attachmentId),
      eq(leadAttachments.leadId, id),
      eq(leadAttachments.tenantId, tenantContext.tenantId),
    ),
  });

  if (!attachment) {
    return NextResponse.json({ error: "Anexo nao encontrado." }, { status: 404 });
  }

  const object = await storage.getObject({
    key: attachment.storageKey,
  });

  const body = object.Body ? Buffer.from(await object.Body.transformToByteArray()) : Buffer.alloc(0);

  return new NextResponse(body, {
    headers: {
      "Content-Type": attachment.contentType,
      "Content-Length": String(attachment.sizeInBytes),
      "Content-Disposition": `attachment; filename="${encodeURIComponent(attachment.fileName)}"`,
    },
  });
}
