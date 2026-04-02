import React from "react";

interface BadgeProps {
  variant?: "primary" | "success" | "warning" | "danger";
  children: React.ReactNode;
  className?: string;
}

const variantClasses = {
  primary: "badge-primary",
  success: "badge-success",
  warning: "badge-warning",
  danger: "badge-danger",
};

export const Badge: React.FC<BadgeProps> = ({
  variant = "primary",
  children,
  className = "",
}) => (
  <span className={`badge ${variantClasses[variant]} ${className}`}>
    {children}
  </span>
);
