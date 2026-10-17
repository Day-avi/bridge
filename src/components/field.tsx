import type { InputHTMLAttributes } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; name: string };

export function Field({ label, name, ...props }: FieldProps) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      <input
        name={name}
        className="block w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-accent"
        {...props}
      />
    </label>
  );
}

export function SubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground disabled:opacity-60"
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <p role="alert" className="text-sm text-danger">
      {message}
    </p>
  );
}
