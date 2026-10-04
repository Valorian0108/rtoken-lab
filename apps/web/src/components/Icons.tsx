import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function ArrowUpRightIcon(props: IconProps) {
  return <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
    <path d="M4 12 12 4M5 4h7v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

export function ArrowLeftIcon(props: IconProps) {
  return <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
    <path d="M13 8H3m0 0 4.5-4.5M3 8l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

export function ChevronDownIcon(props: IconProps) {
  return <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
    <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

export function SearchIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <circle cx="11" cy="11" r="7.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="m16.5 16.5 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>;
}

export function SendIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path d="M21 3 10.8 13.2M21 3l-6.5 18-3.7-7.8L3 9.5 21 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

export function MessageMarkIcon({ type, ...props }: IconProps & { type: "question" | "answer" | "error" }) {
  return <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
    {type === "question" && <>
      <path d="M5.9 5.7a2.2 2.2 0 1 1 3.8 1.5c-.8.8-1.7 1.1-1.7 2.3" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
      <circle cx="8" cy="12" r=".75" fill="currentColor" />
    </>}
    {type === "answer" && <path d="m3.5 8.2 2.8 2.7 6.2-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
    {type === "error" && <>
      <path d="M8 3.3v5.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="12" r=".8" fill="currentColor" />
    </>}
  </svg>;
}
