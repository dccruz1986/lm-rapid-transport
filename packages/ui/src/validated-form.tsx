"use client";
import type { FieldErrors, FieldIssue } from "@lm/types";
import { phoneSchema } from "@lm/validation";
import { type ComponentProps, createContext, useContext, useEffect, useId, useRef, useState } from "react";
import { fieldMessage } from "./field-message";
import { useLanguage } from "./language";

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
const Context = createContext<{ errors: FieldErrors; form: HTMLFormElement | null } | null>(null);
function control(form: HTMLFormElement, name: string) {
  return [...form.querySelectorAll<Control>("input,select,textarea")].find(
    (c) => c.name === name && c.type !== "hidden" && !c.matches(":disabled"),
  );
}
function nativeIssue(c: Control): FieldIssue | undefined {
  if (!c.willValidate) return;
  const v = c.validity;
  if (v.valueMissing) return { code: "REQUIRED" };
  if (v.typeMismatch) return { code: c.type === "email" ? "EMAIL" : "INVALID" };
  if (c.name === "phone" && c.value && !phoneSchema.safeParse(c.value).success) return { code: "PHONE_US" };
  if (v.rangeUnderflow) return { code: "MIN_VALUE", limit: c.getAttribute("min") ?? "" };
  if (v.rangeOverflow) return { code: "MAX_VALUE", limit: c.getAttribute("max") ?? "" };
  if (v.stepMismatch) return { code: "STEP" };
  // Check lengths explicitly too: browsers omit tooShort/tooLong after programmatic changes.
  const min = Number(c.getAttribute("minlength")),
    max = c.getAttribute("maxlength");
  if (c.value && min > c.value.length) return { code: "MIN_LENGTH", limit: min };
  if (max !== null && c.value.length > Number(max)) return { code: "MAX_LENGTH", limit: max };
  if (!v.valid) return { code: "INVALID" };
}
function focusError(form: HTMLFormElement, errors: FieldErrors) {
  const target = [...form.querySelectorAll<Control>("input,select,textarea")].find(
    (c) => errors[c.name] && c.type !== "hidden" && !c.matches(":disabled"),
  );
  if (!target) return;
  let parent = target.parentElement;
  while (parent) {
    if (parent instanceof HTMLDetailsElement) parent.open = true;
    parent = parent.parentElement;
  }
  target.focus();
}
export function ValidatedForm({
  result,
  children,
  onSubmit,
  onInput,
  onChange,
  validate,
  ...props
}: ComponentProps<"form"> & {
  result?: { fieldErrors?: FieldErrors; error?: string; success?: boolean };
  validate?: (data: FormData, intent: string) => FieldErrors;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<HTMLFormElement | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const attempted = useRef(false);
  const snapshot = useRef<Record<string, string>>({});
  const revision = useRef(0);
  const submittedRevision = useRef(0);
  const intent = useRef("");
  useEffect(() => {
    setForm(ref.current);
  }, []);
  useEffect(() => {
    if (!ref.current || !result || revision.current !== submittedRevision.current) return;
    const next: FieldErrors = {};
    for (const [name, issue] of Object.entries(result.fieldErrors ?? {})) {
      const c = control(ref.current, name);
      if (c && snapshot.current[name] === c.value) next[name] = issue;
    }
    setErrors(next);
    if (Object.keys(next).length) requestAnimationFrame(() => ref.current && focusError(ref.current, next));
  }, [result]);
  function correct(target: EventTarget) {
    revision.current += 1;
    if (!attempted.current || !ref.current || !(target instanceof HTMLElement)) return;
    const currentForm = ref.current;
    const custom = validate?.(new FormData(currentForm), intent.current) ?? {};
    setErrors((old) => {
      const next = { ...old };
      for (const name of Object.keys(old)) {
        const c = control(currentForm, name);
        if (!c) {
          delete next[name];
          continue;
        }
        // Revalidate cross-field rules; server-only errors are removed only when their control changes.
        if (c === target || validate) {
          const issue = custom[name] ?? nativeIssue(c);
          if (issue) next[name] = issue;
          else delete next[name];
        }
      }
      return next;
    });
  }
  return (
    <Context value={{ errors, form }}>
      <form
        {...props}
        ref={ref}
        noValidate
        onReset={(e) => {
          e.preventDefault();
          props.onReset?.(e);
        }}
        onInput={(e) => {
          correct(e.target);
          onInput?.(e);
        }}
        onChange={(e) => {
          correct(e.target);
          onChange?.(e);
        }}
        onSubmit={(e) => {
          attempted.current = true;
          submittedRevision.current = revision.current;
          const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
          intent.current = submitter?.value ?? "";
          const next = { ...validate?.(new FormData(e.currentTarget), intent.current) };
          snapshot.current = {};
          for (const c of e.currentTarget.querySelectorAll<Control>("input,select,textarea")) {
            if (!c.name || c.type === "hidden" || c.matches(":disabled")) continue;
            snapshot.current[c.name] = c.value;
            const issue = nativeIssue(c);
            if (issue) next[c.name] ??= issue;
          }
          setErrors(next);
          if (Object.keys(next).length) {
            e.preventDefault();
            requestAnimationFrame(() => ref.current && focusError(ref.current, next));
            return;
          }
          onSubmit?.(e);
        }}
      >
        {children}
      </form>
    </Context>
  );
}
export function FieldError({ name = "" }: { name?: string }) {
  const context = useContext(Context);
  const { locale } = useLanguage();
  const id = useId();
  const issue = context?.errors[name];
  useEffect(() => {
    if (!context?.form) return;
    const c = control(context.form, name);
    if (!c || !issue) return;
    const previous = c.getAttribute("aria-invalid");
    c.setAttribute("aria-invalid", "true");
    c.setAttribute("aria-describedby", [c.getAttribute("aria-describedby"), id].filter(Boolean).join(" "));
    return () => {
      if (previous === null) c.removeAttribute("aria-invalid");
      else c.setAttribute("aria-invalid", previous);
      const remaining = (c.getAttribute("aria-describedby") ?? "")
        .split(" ")
        .filter((v) => v !== id)
        .join(" ");
      if (remaining) c.setAttribute("aria-describedby", remaining);
      else c.removeAttribute("aria-describedby");
    };
  }, [context?.form, issue, name, id]);
  return issue ? (
    <span className="field-error" id={id}>
      {fieldMessage(issue, locale)}
    </span>
  ) : null;
}
