import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`card ${className}`}>{children}</div>
);

export const CardHeader: React.FC<{
  children?: React.ReactNode;
  title?: string;
  className?: string;
}> = ({ children, title, className = "" }) => (
  <div className={`card-header ${className}`}>
    {title && <h3 className="card-title">{title}</h3>}
    {children}
  </div>
);

export const CardContent: React.FC<CardProps> = ({
  children,
  className = "",
}) => <div className={`card-content ${className}`}>{children}</div>;

export const CardDescription: React.FC<CardProps> = ({
  children,
  className = "",
}) => <p className={`card-description ${className}`}>{children}</p>;
