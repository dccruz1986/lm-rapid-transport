"use client";
import type { FieldErrors, FormOutcome } from "@lm/types";
import { Button, useLanguage } from "@lm/ui";
import { ValidatedForm } from "@lm/ui/validated-form";
import { type ReactNode, useId, useRef } from "react";

export function ConfirmedForm({
  action,
  children,
  values,
  question,
  className = "stack",
  validate,
  result,
}: {
  action: (form: FormData) => void;
  children: ReactNode;
  values: string[];
  question: string;
  className?: string;
  validate?: (data: FormData, action: string) => FieldErrors;
  result?: FormOutcome;
}) {
  const { t } = useLanguage();
  const form = useRef<HTMLFormElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const submitter = useRef<HTMLButtonElement | null>(null);
  const approved = useRef(false);
  const title = useId();
  return (
    <ValidatedForm
      result={result}
      validate={validate}
      action={action}
      className={className}
      onSubmit={(event) => {
        form.current = event.currentTarget;
        const button = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        if (approved.current) {
          approved.current = false;
          return;
        }
        if (button && values.includes(button.value)) {
          event.preventDefault();
          submitter.current = button;
          dialog.current?.showModal();
        }
      }}
    >
      {children}
      <dialog ref={dialog} aria-labelledby={title} className="confirmation-dialog">
        <h2 id={title}>{question}</h2>
        <div className="row">
          <Button type="button" variant="outline" onClick={() => dialog.current?.close()}>
            {t("Volver", "Go back")}
          </Button>
          <Button
            type="button"
            onClick={() => {
              dialog.current?.close();
              approved.current = true;
              form.current?.requestSubmit(submitter.current ?? undefined);
              approved.current = false;
            }}
          >
            {t("Confirmar", "Confirm")}
          </Button>
        </div>
      </dialog>
    </ValidatedForm>
  );
}
