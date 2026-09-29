import { Link } from "react-router-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Base = {
  children: ReactNode;
  variant?: "red" | "yellow" | "outline" | "text";
  className?: string;
};
type LinkProps = Base & { to: string; onClick?: never };
type NativeProps = Base &
  ButtonHTMLAttributes<HTMLButtonElement> & { to?: never };

export function Button(props: LinkProps | NativeProps) {
  const className =
    `pm-button pm-button--${props.variant || "red"} ${props.className || ""}`.trim();
  if ("to" in props && props.to)
    return (
      <Link className={className} to={props.to}>
        {props.children}
      </Link>
    );
  const {
    children,
    variant: _variant,
    className: _className,
    to: _to,
    ...rest
  } = props as NativeProps;
  return (
    <button className={className} {...rest}>
      {children}
    </button>
  );
}
