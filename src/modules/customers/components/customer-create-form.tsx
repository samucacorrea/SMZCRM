"use client";

import { useState, useTransition } from "react";
import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCep, formatCpfCnpj } from "@/lib/br-documents";
import { fetchAddressByCep } from "@/lib/viacep";
import {
  createCustomerAction,
  type CustomerActionState,
} from "@/modules/customers/actions";

const initialState: CustomerActionState = {};

export function CustomerCreateForm() {
  const [state, formAction, isPending] = useActionState(createCustomerAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [isFetchingCep, startCepLookup] = useTransition();
  const [zipCode, setZipCode] = useState("");
  const [taxId, setTaxId] = useState("");

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setZipCode("");
      setTaxId("");
    }
  }, [state.success]);

  function handleZipCodeBlur() {
    startCepLookup(async () => {
      const address = await fetchAddressByCep(zipCode);

      if (!address || !formRef.current) {
        return;
      }

      const setFieldValue = (fieldName: string, value: string) => {
        const field = formRef.current?.elements.namedItem(fieldName);

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

  return (
    <form ref={formRef} action={formAction} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="legalName">Razão social</Label>
        <Input id="legalName" name="legalName" placeholder="Acme LTDA" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tradeName">Nome fantasia</Label>
        <Input id="tradeName" name="tradeName" placeholder="Acme" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="taxId">CPF/CNPJ</Label>
        <Input
          id="taxId"
          name="taxId"
          onChange={(event) => setTaxId(formatCpfCnpj(event.target.value))}
          placeholder="00.000.000/0001-00"
          value={taxId}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contactName">Contato principal</Label>
        <Input id="contactName" name="contactName" placeholder="Maria Silva" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" placeholder="contato@empresa.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" name="phone" placeholder="(11) 99999-9999" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="website">Site</Label>
        <Input id="website" name="website" placeholder="https://empresa.com.br" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="zipCode">CEP</Label>
        <Input
          id="zipCode"
          name="zipCode"
          onBlur={handleZipCodeBlur}
          onChange={(event) => setZipCode(formatCep(event.target.value))}
          placeholder="00000-000"
          value={zipCode}
        />
        {isFetchingCep ? (
          <p className="text-xs text-muted-foreground">Buscando endereço no ViaCEP...</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="addressLine1">Logradouro</Label>
        <Input id="addressLine1" name="addressLine1" placeholder="Rua Exemplo, 123" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="addressLine2">Complemento</Label>
        <Input id="addressLine2" name="addressLine2" placeholder="Sala 4" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="neighborhood">Bairro</Label>
        <Input id="neighborhood" name="neighborhood" placeholder="Centro" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input id="city" name="city" placeholder="São Paulo" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">UF</Label>
          <Input id="state" name="state" maxLength={2} placeholder="SP" />
        </div>
      </div>
      <div className="md:col-span-2 flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Criar cliente"}
        </Button>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
