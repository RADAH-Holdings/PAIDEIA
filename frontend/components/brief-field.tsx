"use client";

import {
  BRIEF_FIELDS,
  type BriefFieldKey,
} from "@/lib/brief-fields";
import { SUBJECT_OPTIONS } from "@/lib/subjects";

import { briefInputClass, briefLabelClass } from "./form-field";

function fieldId(field: BriefFieldKey) {
  return `brief-${field}`;
}

function FieldHint({
  field,
  valueLength,
}: {
  field: BriefFieldKey;
  valueLength: number;
}) {
  const meta = BRIEF_FIELDS[field];
  if (meta.min == null || !meta.example) return null;
  return (
    <p className="mt-1 font-mono text-[10px] text-ink/50">
      {valueLength} / {meta.min} min characters · e.g. {meta.example}
    </p>
  );
}

function FieldLabel({ field }: { field: BriefFieldKey }) {
  const meta = BRIEF_FIELDS[field];
  return (
    <label htmlFor={fieldId(field)} className={briefLabelClass}>
      {meta.label}
      {meta.optional ? (
        <span className="font-normal text-ink/50"> (optional)</span>
      ) : null}
    </label>
  );
}

function FieldHelp({ field }: { field: BriefFieldKey }) {
  const help = BRIEF_FIELDS[field].help;
  if (!help) return null;
  return <p className="mt-0.5 text-xs text-ink/60">{help}</p>;
}

/** Controlled brief field (new course form). */
export function BriefField({
  field,
  value,
  onChange,
  multiline,
  rows = 4,
}: {
  field: Exclude<BriefFieldKey, "subject" | "approximate_lessons">;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
}) {
  const id = fieldId(field);
  const common = {
    id,
    name: field,
    className: briefInputClass,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
  };

  return (
    <div>
      <FieldLabel field={field} />
      <FieldHelp field={field} />
      {multiline ? (
        <textarea {...common} rows={rows} />
      ) : (
        <input type="text" {...common} />
      )}
      <FieldHint field={field} valueLength={value.length} />
    </div>
  );
}

/** Uncontrolled brief field (edit form with FormData submit). */
export function BriefFormField({
  field,
  defaultValue = "",
  multiline,
  rows = 4,
  valueLength,
}: {
  field: Exclude<BriefFieldKey, "subject" | "approximate_lessons">;
  defaultValue?: string;
  multiline?: boolean;
  rows?: number;
  /** Character count for hint line; defaults to defaultValue length */
  valueLength?: number;
}) {
  const id = fieldId(field);
  const len = valueLength ?? String(defaultValue).length;
  const common = {
    id,
    name: field,
    defaultValue,
    className: briefInputClass,
  };

  return (
    <div>
      <FieldLabel field={field} />
      <FieldHelp field={field} />
      {multiline ? (
        <textarea {...common} rows={rows} />
      ) : (
        <input type="text" {...common} />
      )}
      <FieldHint field={field} valueLength={len} />
    </div>
  );
}

export function BriefSubjectField({
  value,
  onChange,
  defaultValue,
  name = "subject",
}: {
  value?: string;
  onChange?: (v: string) => void;
  defaultValue?: string;
  name?: string;
}) {
  const id = fieldId("subject");
  const meta = BRIEF_FIELDS.subject;
  const selectProps =
    value !== undefined && onChange
      ? { value, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value) }
      : { defaultValue };

  return (
    <div>
      <label htmlFor={id} className={briefLabelClass}>
        {meta.label}
      </label>
      <FieldHelp field="subject" />
      <select id={id} name={name} className={briefInputClass} {...selectProps}>
        {SUBJECT_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}

export function BriefLessonsField({
  value,
  onChange,
  defaultValue,
  name = "approximate_lessons",
}: {
  value?: number;
  onChange?: (v: number) => void;
  defaultValue?: number;
  name?: string;
}) {
  const id = fieldId("approximate_lessons");
  const meta = BRIEF_FIELDS.approximate_lessons;
  const inputProps =
    value !== undefined && onChange
      ? {
          value,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            onChange(Number(e.target.value)),
        }
      : { defaultValue };

  return (
    <div>
      <label htmlFor={id} className={briefLabelClass}>
        {meta.label}
      </label>
      <FieldHelp field="approximate_lessons" />
      <input
        id={id}
        name={name}
        type="number"
        min={meta.min}
        max={meta.max}
        className={`${briefInputClass} w-32`}
        {...inputProps}
      />
      {meta.min != null && meta.max != null ? (
        <p className="mt-1 font-mono text-[10px] text-ink/50">
          Between {meta.min} and {meta.max} lessons
        </p>
      ) : null}
    </div>
  );
}
