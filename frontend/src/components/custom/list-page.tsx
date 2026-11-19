import type { ReactNode } from "react";

export function ListPage({
  title,
  actions,
  children,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="gw-page">
      <header className={title ? "gw-page-heading" : "flex justify-end"}>
        {title && <h1>{title}</h1>}
        {actions}
      </header>
      {children}
    </div>
  );
}
