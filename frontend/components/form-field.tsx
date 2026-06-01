import type { ReactNode } from "react";

const labelClass = "mb-1 block font-mono text-xs text-ink/70";
const hintClass = "mt-1 text-xs text-ink/60";

type FormFieldProps = {
  label: string;
  id: string;
  children: ReactNode;
  hint?: string;
  optional?: boolean;
  className?: string;
};

/** Accessible label wrapper — always pair with a control `id` matching `htmlFor`. */
export function FormField({
  label,
  id,
  children,
  hint,
  optional,
  className,
}: FormFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {label}
        {optional ? (
          <span className="font-normal text-ink/50"> (optional)</span>
        ) : null}
      </label>
      {hint ? <p className={hintClass}>{hint}</p> : null}
      <div className={hint ? "mt-1" : undefined}>{children}</div>
    </div>
  );
}

export const fieldInputClass =
  "w-full rounded-btn border border-ink/15 bg-canvas px-3 py-2 text-ink outline-none ring-ochre/40 focus:ring-2";

export const fieldSelectClass =
  "w-full rounded-btn border border-ink/15 bg-canvas px-3 py-2 text-ink";

export const briefInputClass =
  "mt-1 w-full rounded-btn border border-ink/20 bg-white/60 px-3 py-2 font-display text-ink outline-none ring-ochre/40 focus:ring-2";

export const briefLabelClass = "block text-sm font-medium text-ink";
