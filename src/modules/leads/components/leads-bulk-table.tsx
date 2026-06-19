"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  bulkAssignLeadOwnerAction,
  bulkDeleteLeadsAction,
  bulkMoveLeadsStageAction,
  bulkQualifyLeadsAction,
  bulkUpdateLeadTagsAction,
  type LeadActionState,
} from "@/modules/leads/actions";

const initialState: LeadActionState = {};

type LeadRow = {
  id: string;
  name: string;
  company: string | null;
  email: string;
  source: string;
  qualification: "none" | "qualified" | "won" | "lost";
  estimatedValueInCents: number;
  assigneeName: string | null;
  stageName: string;
};

type StageOption = {
  id: string;
  name: string;
};

type OwnerOption = {
  id: string;
  displayName: string;
};

function getQualificationLabel(value: LeadRow["qualification"]) {
  switch (value) {
    case "qualified":
      return "Qualificado";
    case "won":
      return "Ganho";
    case "lost":
      return "Perdido";
    default:
      return "Em aberto";
  }
}

export function LeadsBulkTable({
  leads,
  stages,
  owners,
}: {
  leads: LeadRow[];
  stages: StageOption[];
  owners: OwnerOption[];
}) {
  const router = useRouter();
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [stageId, setStageId] = useState<string>("");
  const [qualification, setQualification] = useState<"" | "qualified" | "lost">("");
  const [lostReason, setLostReason] = useState("");
  const [assignedStaffMemberId, setAssignedStaffMemberId] = useState("");
  const [tags, setTags] = useState("");
  const [deleteState, deleteFormAction, deletePending] = useActionState(
    bulkDeleteLeadsAction,
    initialState,
  );
  const [moveState, moveFormAction, movePending] = useActionState(
    bulkMoveLeadsStageAction,
    initialState,
  );
  const [qualifyState, qualifyFormAction, qualifyPending] = useActionState(
    bulkQualifyLeadsAction,
    initialState,
  );
  const [assignState, assignFormAction, assignPending] = useActionState(
    bulkAssignLeadOwnerAction,
    initialState,
  );
  const [tagsState, tagsFormAction, tagsPending] = useActionState(
    bulkUpdateLeadTagsAction,
    initialState,
  );

  const allSelected = useMemo(
    () => leads.length > 0 && selectedLeadIds.length === leads.length,
    [leads.length, selectedLeadIds.length],
  );

  useEffect(() => {
    if (
      deleteState.success ||
      moveState.success ||
      qualifyState.success ||
      assignState.success ||
      tagsState.success
    ) {
      setSelectedLeadIds([]);
      setStageId("");
      setQualification("");
      setLostReason("");
      setAssignedStaffMemberId("");
      setTags("");
      router.refresh();
    }
  }, [
    assignState.success,
    deleteState.success,
    moveState.success,
    qualifyState.success,
    router,
    tagsState.success,
  ]);

  function toggleLead(leadId: string) {
    setSelectedLeadIds((current) =>
      current.includes(leadId)
        ? current.filter((currentId) => currentId !== leadId)
        : [...current, leadId],
    );
  }

  function toggleAll() {
    setSelectedLeadIds((current) => (current.length === leads.length ? [] : leads.map((lead) => lead.id)));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-border bg-background p-4">
        <div>
          <p className="text-sm font-medium text-foreground">Ações em massa</p>
          <p className="text-sm text-muted-foreground">
            {selectedLeadIds.length === 0
              ? "Selecione leads para editar ou excluir em lote."
              : `${selectedLeadIds.length} lead(s) selecionado(s).`}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <form action={moveFormAction} className="flex flex-wrap items-end gap-3">
            {selectedLeadIds.map((leadId) => (
              <input key={leadId} type="hidden" name="leadIds" value={leadId} />
            ))}
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Novo estágio
              </label>
              <select
                name="stageId"
                value={stageId}
                onChange={(event) => setStageId(event.target.value)}
                className="flex h-10 min-w-[220px] rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
              >
                <option value="">Selecione um estágio</option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" size="sm" variant="outline" disabled={movePending || selectedLeadIds.length === 0 || !stageId}>
              {movePending ? "Atualizando..." : "Editar em massa"}
            </Button>
          </form>

          <form action={qualifyFormAction} className="flex flex-wrap items-end gap-3">
            {selectedLeadIds.map((leadId) => (
              <input key={leadId} type="hidden" name="leadIds" value={leadId} />
            ))}
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Status comercial
              </label>
              <select
                name="qualification"
                value={qualification}
                onChange={(event) =>
                  setQualification(event.target.value as "" | "qualified" | "lost")
                }
                className="flex h-10 min-w-[180px] rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
              >
                <option value="">Selecione um status</option>
                <option value="qualified">Qualificado</option>
                <option value="lost">Perdido</option>
              </select>
            </div>
            {qualification === "lost" ? (
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Motivo da perda
                </label>
                <input
                  name="reason"
                  value={lostReason}
                  onChange={(event) => setLostReason(event.target.value)}
                  placeholder="Sem fit, sem verba, sem retorno..."
                  className="flex h-10 min-w-[240px] rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
                />
              </div>
            ) : null}
            <Button
              type="submit"
              size="sm"
              variant="outline"
              disabled={
                qualifyPending ||
                selectedLeadIds.length === 0 ||
                !qualification ||
                (qualification === "lost" && lostReason.trim().length < 3)
              }
            >
              {qualifyPending ? "Atualizando..." : "Status em massa"}
            </Button>
          </form>

          <form action={deleteFormAction}>
            {selectedLeadIds.map((leadId) => (
              <input key={leadId} type="hidden" name="leadIds" value={leadId} />
            ))}
            <Button
              type="submit"
              size="sm"
              variant="outline"
              disabled={deletePending || selectedLeadIds.length === 0}
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              {deletePending ? "Excluindo..." : "Excluir em massa"}
            </Button>
          </form>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <form action={assignFormAction} className="flex flex-wrap items-end gap-3">
            {selectedLeadIds.map((leadId) => (
              <input key={leadId} type="hidden" name="leadIds" value={leadId} />
            ))}
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Responsável
              </label>
              <select
                name="assignedStaffMemberId"
                value={assignedStaffMemberId}
                onChange={(event) => setAssignedStaffMemberId(event.target.value)}
                className="flex h-10 min-w-[220px] rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
              >
                <option value="">Remover responsável</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.displayName}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" size="sm" variant="outline" disabled={assignPending || selectedLeadIds.length === 0}>
              {assignPending ? "Atribuindo..." : "Responsável em massa"}
            </Button>
          </form>

          <form action={tagsFormAction} className="flex flex-wrap items-end gap-3">
            {selectedLeadIds.map((leadId) => (
              <input key={leadId} type="hidden" name="leadIds" value={leadId} />
            ))}
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Tags
              </label>
              <input
                name="tags"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="vip, black-friday, teste"
                className="flex h-10 min-w-[260px] rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
              />
            </div>
            <Button type="submit" size="sm" variant="outline" disabled={tagsPending || selectedLeadIds.length === 0 || tags.trim().length === 0}>
              {tagsPending ? "Aplicando..." : "Tags em massa"}
            </Button>
          </form>
        </div>
      </div>

      {moveState.error ? <p className="text-sm text-red-600">{moveState.error}</p> : null}
      {moveState.success ? <p className="text-sm text-green-700">{moveState.success}</p> : null}
      {qualifyState.error ? <p className="text-sm text-red-600">{qualifyState.error}</p> : null}
      {qualifyState.success ? <p className="text-sm text-green-700">{qualifyState.success}</p> : null}
      {assignState.error ? <p className="text-sm text-red-600">{assignState.error}</p> : null}
      {assignState.success ? <p className="text-sm text-green-700">{assignState.success}</p> : null}
      {tagsState.error ? <p className="text-sm text-red-600">{tagsState.error}</p> : null}
      {tagsState.success ? <p className="text-sm text-green-700">{tagsState.success}</p> : null}
      {deleteState.error ? <p className="text-sm text-red-600">{deleteState.error}</p> : null}
      {deleteState.success ? <p className="text-sm text-green-700">{deleteState.success}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-background text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Selecionar todos os leads"
                  className="h-4 w-4 rounded border-border"
                />
              </th>
              <th className="px-4 py-3 font-medium">Lead</th>
              <th className="px-4 py-3 font-medium">Estágio</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Origem</th>
              <th className="px-4 py-3 font-medium">Responsável</th>
              <th className="px-4 py-3 font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedLeadIds.includes(lead.id)}
                    onChange={() => toggleLead(lead.id)}
                    aria-label={`Selecionar ${lead.name}`}
                    className="h-4 w-4 rounded border-border"
                  />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/leads/${lead.id}`} className="font-medium text-foreground">
                    {lead.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {lead.company || "Sem empresa"} · {lead.email}
                  </p>
                </td>
                <td className="px-4 py-3">{lead.stageName}</td>
                <td className="px-4 py-3">{getQualificationLabel(lead.qualification)}</td>
                <td className="px-4 py-3">{lead.source}</td>
                <td className="px-4 py-3">{lead.assigneeName || "Sem dono"}</td>
                <td className="px-4 py-3">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(lead.estimatedValueInCents / 100)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
