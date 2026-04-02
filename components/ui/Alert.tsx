import React from "react";

interface AlertProps {
  variant?: "success" | "error" | "warning" | "info";
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const variantClasses = {
  success: "alert-success",
  error: "alert-error",
  warning: "alert-warning",
  info: "alert-info",
};

export const Alert: React.FC<AlertProps> = ({
  variant = "info",
  title,
  children,
  className = "",
}) => (
  <div className={`alert ${variantClasses[variant]} ${className}`}>
    {title && <h4 className="font-semibold mb-2">{title}</h4>}
    {children}
  </div>
);
