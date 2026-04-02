import React, { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helpText, className = "", ...props }, ref) => {
    return (
      <div className="form-group">
        {label && <label className="form-label">{label}</label>}
        <input
          ref={ref}
          className={`form-input ${error ? "ring-2 ring-destructive" : ""} ${className}`}
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

Input.displayName = "Input";
