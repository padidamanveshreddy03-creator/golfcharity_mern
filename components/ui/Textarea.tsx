import React, { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helpText, className = "", ...props }, ref) => {
    return (
      <div className="form-group">
        {label && <label className="form-label">{label}</label>}
        <textarea
          ref={ref}
          className={`form-textarea ${error ? "ring-2 ring-destructive" : ""} ${className}`}
          rows={4}
          {...props}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        {helpText && !error && (
          <p className="text-xs text-muted-foreground">{helpText}</p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
