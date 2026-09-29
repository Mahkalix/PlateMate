import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function CardAction({
  to,
  children,
  ariaLabel,
}: {
  to: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  return (
    <Link className="pm-card-action" to={to} aria-label={ariaLabel}>
      <span>{children}</span>
      <img
        className="pm-card-action__arrow"
        src="/figma/cards/arrow-right.svg"
        alt=""
      />
    </Link>
  );
}
