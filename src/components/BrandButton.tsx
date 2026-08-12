"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type BrandButtonVariant =
  | "default"
  | "white"
  | "emerald"
  | "sky"
  | "violet"
  | "amber"
  | "yellow"
  | "rose";

type BrandButtonSharedProps = {
  className?: string;
  children?: React.ReactNode;
  variant?: BrandButtonVariant;
};

type BrandButtonAsButton = BrandButtonSharedProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type BrandButtonAsLink = BrandButtonSharedProps & {
  href: string;
  target?: string;
  rel?: string;
} & Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "children" | "href" | "type"
>;

export type BrandButtonProps = BrandButtonAsButton | BrandButtonAsLink;

const insetGlow =
  "shadow-[0px_0px_10px_0px_rgba(255,255,255,0.2)_inset] hover:shadow-[0px_0px_20px_0px_rgba(255,255,255,0.4)_inset]";

const insetRing =
  "ring ring-white/20 ring-inset ring-offset-2 hover:ring-white/40";

export const brandBaseClass =
  "inline-flex cursor-pointer items-center justify-center gap-2 font-display text-sm font-semibold " +
  "rounded-xl px-4 py-2 transition-all duration-200 active:scale-[0.98] " +
  "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100";

/** Soft secondary surface — sidebar active, panel chips, outline CTAs */
export const brandWhiteSurfaceClass =
  "bg-linear-to-b from-canvas to-surface-soft text-ink " +
  "shadow-[0px_0px_10px_0px_rgba(255,255,255,0.55)_inset] " +
  "ring ring-ink/10 ring-inset ring-offset-2 ring-offset-canvas " +
  "hover:shadow-[0px_0px_16px_0px_rgba(255,255,255,0.75)_inset] hover:ring-ink/20";

export const brandVariantClass: Record<BrandButtonVariant, string> = {
  default: cn(
    "bg-linear-to-b from-tertiary to-primary text-white",
    insetGlow,
    insetRing,
    "ring-offset-primary",
  ),
  white: brandWhiteSurfaceClass,
  emerald: cn(
    "bg-linear-to-b from-emerald-400 to-emerald-700 text-white",
    insetGlow,
    insetRing,
    "ring-offset-emerald-700",
  ),
  sky: cn(
    "bg-linear-to-b from-sky-400 to-sky-700 text-white",
    insetGlow,
    insetRing,
    "ring-offset-sky-700",
  ),
  violet: cn(
    "bg-linear-to-b from-violet-400 to-violet-700 text-white",
    insetGlow,
    insetRing,
    "ring-offset-violet-700",
  ),
  amber: cn(
    "bg-linear-to-b from-amber-400 to-amber-600 text-white",
    insetGlow,
    insetRing,
    "ring-offset-amber-600",
  ),
  yellow: cn(
    "bg-linear-to-b from-yellow-300 to-amber-500 text-amber-950",
    "shadow-[0px_0px_10px_0px_rgba(255,255,255,0.35)_inset] hover:shadow-[0px_0px_20px_0px_rgba(255,255,255,0.55)_inset]",
    "ring ring-white/35 ring-inset ring-offset-2 ring-offset-amber-500 hover:ring-white/55",
  ),
  rose: cn(
    "bg-linear-to-b from-rose-400 to-rose-700 text-white",
    insetGlow,
    insetRing,
    "ring-offset-rose-700",
  ),
};

export type BrandIconVariant = Exclude<BrandButtonVariant, "white">;

export const brandIconBadgeVariantClass: Record<BrandIconVariant, string> = {
  default: brandVariantClass.default,
  emerald: brandVariantClass.emerald,
  sky: brandVariantClass.sky,
  violet: brandVariantClass.violet,
  amber: brandVariantClass.amber,
  yellow: brandVariantClass.yellow,
  rose: brandVariantClass.rose,
};

export function BrandIconBadge({
  variant = "default",
  children,
  className,
}: {
  variant?: BrandIconVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex size-10 shrink-0 items-center justify-center rounded-md transition-all duration-200 sm:size-11",
        brandIconBadgeVariantClass[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export const BrandButton = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  BrandButtonProps
>(function BrandButton(props, ref) {
  if ("href" in props && props.href) {
    const {
      className,
      children,
      variant = "default",
      href,
      target,
      rel,
      ...anchorProps
    } = props;

    return (
      <a
        ref={ref as React.ForwardedRef<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={rel}
        className={cn(brandBaseClass, brandVariantClass[variant], className)}
        {...anchorProps}
      >
        {children}
      </a>
    );
  }

  const {
    className,
    children,
    variant = "default",
    type = "button",
    ...buttonProps
  } = props as BrandButtonAsButton;

  return (
    <button
      ref={ref as React.ForwardedRef<HTMLButtonElement>}
      type={type}
      className={cn(brandBaseClass, brandVariantClass[variant], className)}
      {...buttonProps}
    >
      {children}
    </button>
  );
});

BrandButton.displayName = "BrandButton";

export default BrandButton;
