import React from "react";

/**
 * Public layout - for public pages
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}
