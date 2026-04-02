import React from "react";

/**
 * Admin layout - for admin pages
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}
