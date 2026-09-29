import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function CardAction({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <Link className="pm-card-action" to={to}>
      <span>{children}</span>
      <span className="pm-card-action__arrow" aria-hidden="true" />
    </Link>
  );
}
