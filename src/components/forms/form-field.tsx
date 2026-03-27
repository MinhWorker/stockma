import { useId } from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
}

export function FormField({ label, required, error, htmlFor, children }: FormFieldProps) {
  const generatedId = useId();
  const fieldId = htmlFor ?? generatedId;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={fieldId}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && (
          <span className="ml-1 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div
        aria-invalid={!!error}
        data-invalid={!!error || undefined}
        className="[&>[data-slot=input]]:data-[invalid]:border-destructive [&>[data-slot=select-trigger]]:data-[invalid]:border-destructive [&>[data-slot=textarea]]:data-[invalid]:border-destructive"
      >
        {children}
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
