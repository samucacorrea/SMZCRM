"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCep, formatCpfCnpj } from "@/lib/br-documents";
import { fetchAddressByCep } from "@/lib/viacep";
import { type CustomerActionState, updateCustomerAction } from "@/modules/customers/actions";

const initialState: CustomerActionState = {};

export function CustomerDetailsForm({
  customer,
}: {
  customer: {
    id: string;
    legalName: string;
    tradeName: string | null;
    taxId: string;
    phone: string | null;
    website: string | null;
    zipCode: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    neighborhood: string | null;
    city: string;
    state: string;
  };
}) {
  const action = useMemo(() => updateCustomerAction.bind(null, customer.id), [customer.id]);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [isFetchingCep, startCepLookup] = useTransition();
  const [zipCode, setZipCode] = useState(formatCep(customer.zipCode ?? ""));
  const [taxId, setTaxId] = useState(formatCpfCnpj(customer.taxId));

  function handleZipCodeBlur(form: HTMLFormElement | null) {
    startCepLookup(async () => {
      const address = await fetchAddressByCep(zipCode);

      if (!address || !form) {
        return;
      }

      const setFieldValue = (fieldName: string, value: string) => {
        const field = form.elements.namedItem(fieldName);

        if (field instanceof HTMLInputElement) {
          field.value = value;
        }
      };

      setFieldValue("city", address.city);
      setFieldValue("state", address.state);
      setFieldValue("addressLine1", address.addressLine1);
      setFieldValue("addressLine2", address.addressLine2);
      setFieldValue("neighborhood", address.neighborhood);
      setZipCode(formatCep(address.zipCode));
    });
  }

  useEffect(() => {
    if (state.success) {
      setZipCode((current) => formatCep(current));
      setTaxId((current) => formatCpfCnpj(current));
    }
  }, [state.success]);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="legalName">Razão social</Label>
        <Input id="legalName" name="legalName" defaultValue={customer.legalName} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tradeName">Nome fantasia</Label>
        <Input id="tradeName" name="tradeName" defaultValue={customer.tradeName ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="taxId">CPF/CNPJ</Label>
        <Input
          id="taxId"
          name="taxId"
          value={taxId}
          onChange={(event) => setTaxId(formatCpfCnpj(event.target.value))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" name="phone" defaultValue={customer.phone ?? ""} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="website">Site</Label>
        <Input id="website" name="website" defaultValue={customer.website ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="zipCode">CEP</Label>
        <Input
          id="zipCode"
          name="zipCode"
          value={zipCode}
          onChange={(event) => setZipCode(formatCep(event.target.value))}
          onBlur={(event) => handleZipCodeBlur(event.currentTarget.form)}
        />
        {isFetchingCep ? (
          <p className="text-xs text-muted-foreground">Buscando endereço no ViaCEP...</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="addressLine1">Logradouro</Label>
        <Input id="addressLine1" name="addressLine1" defaultValue={customer.addressLine1 ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="addressLine2">Complemento</Label>
        <Input id="addressLine2" name="addressLine2" defaultValue={customer.addressLine2 ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="neighborhood">Bairro</Label>
        <Input id="neighborhood" name="neighborhood" defaultValue={customer.neighborhood ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="city">Cidade</Label>
        <Input id="city" name="city" defaultValue={customer.city} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="state">UF</Label>
        <Input id="state" name="state" defaultValue={customer.state} maxLength={2} />
      </div>
      <div className="flex items-center gap-3 md:col-span-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar alterações"}
        </Button>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
