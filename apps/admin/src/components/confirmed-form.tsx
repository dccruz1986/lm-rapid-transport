"use client";
import { Button, useLanguage } from "@lm/ui";
import { type ReactNode, useId, useRef } from "react";

export function ConfirmedForm({
  action,
  children,
  values,
  question,
  className = "stack",
}: {
  action: (form: FormData) => void;
  children: ReactNode;
  values: string[];
  question: string;
  className?: string;
}) {
  const { t } = useLanguage();
  const form = useRef<HTMLFormElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const submitter = useRef<HTMLButtonElement | null>(null);
  const approved = useRef(false);
  const title = useId();
  return (
    <form
      ref={form}
      action={action}
      className={className}
      onSubmit={(event) => {
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
            }}
          >
            {t("Confirmar", "Confirm")}
          </Button>
        </div>
      </dialog>
    </form>
  );
}
