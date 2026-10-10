/** Inline so it follows the theme (an <img> SVG cannot read currentColor, which
 *  left the old wordmark dark-on-dark in dark mode) and costs no extra request. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-ink ${className ?? ''}`}>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
        <path d="M12 10.5v6" strokeDasharray="1.4 2.2" className="text-accent" stroke="rgb(var(--accent))" />
      </svg>
      <span className="text-base font-semibold tracking-tight">Zipster</span>
    </span>
  );
}
