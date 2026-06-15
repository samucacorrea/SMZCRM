"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Lightbox } from "@/components/ui/lightbox";
import { CustomerCreateForm } from "@/modules/customers/components/customer-create-form";

export function CustomerCreateLightbox() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button className="h-11 px-5" onClick={() => setOpen(true)} type="button">
        + Adicionar cliente
      </Button>
      <Lightbox
        open={open}
        onClose={() => setOpen(false)}
        title="Adicionar cliente"
        description="Crie o cliente em um fluxo isolado, sem sair da listagem."
      >
        <CustomerCreateForm />
      </Lightbox>
    </>
  );
}
