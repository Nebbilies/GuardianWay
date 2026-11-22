import type { FormEventHandler, ReactNode } from "react";

export function FormLayout({
  children,
  actions,
  onSubmit,
}: {
  children: ReactNode;
  actions: ReactNode;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  return (
    <form onSubmit={onSubmit} className="gw-form">
      <div className="gw-form-fields">{children}</div>
      <footer className="gw-form-actions">{actions}</footer>
    </form>
  );
}
