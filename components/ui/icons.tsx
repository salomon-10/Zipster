import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

/**
 * One stroke weight, one cap style, one 24-grid. Hand-rolled instead of an icon
 * package so the set stays small and visually consistent with the rails motif.
 */
function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      width={18}
      height={18}
      {...props}
    >
      {children}
    </svg>
  );
}

export const FolderIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2.5h7A1.5 1.5 0 0 1 19 10v7.5A1.5 1.5 0 0 1 17.5 19h-13A1.5 1.5 0 0 1 3 17.5z" />
  </Svg>
);

export const FolderOpenIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2.5h7A1.5 1.5 0 0 1 19 10v1H6.8L3 17.5z" />
    <path d="M3 17.5 6.8 11H21l-3.4 6.4a1.5 1.5 0 0 1-1.3.6H4.5A1.5 1.5 0 0 1 3 17.5z" />
  </Svg>
);

export const FileIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M13 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V9z" />
    <path d="M13 3.5V9h5.5" />
  </Svg>
);

export const ArchiveIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7.5h16v11A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5z" />
    <path d="M3 4.5h18v3H3zM10.5 11h3M10.5 14h3" />
  </Svg>
);

export const DownloadIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4v10m0 0 3.5-3.5M12 14l-3.5-3.5M5 18.5h14" />
  </Svg>
);

export const ChevronIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);

export const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12.5 9.5 17 19 7" />
  </Svg>
);

export const CloseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const PlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const TrashIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 7h15M9 7V4.5h6V7M6.5 7l.8 12.1a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7M10 11v6M14 11v6" />
  </Svg>
);

export const LinkIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10 13.5a3.5 3.5 0 0 0 5 0l3-3a3.54 3.54 0 0 0-5-5l-1.5 1.5" />
    <path d="M14 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.54 3.54 0 0 0 5 5L12.5 17" />
  </Svg>
);

export const CopyIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 9V5.5A1.5 1.5 0 0 1 10.5 4h8A1.5 1.5 0 0 1 20 5.5v8a1.5 1.5 0 0 1-1.5 1.5H15" />
    <path d="M4 10.5A1.5 1.5 0 0 1 5.5 9h8A1.5 1.5 0 0 1 15 10.5v8a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 4 18.5z" />
  </Svg>
);

export const SaveIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5.5 4.5h10L19.5 8.5v11A1.5 1.5 0 0 1 18 21H6a1.5 1.5 0 0 1-1.5-1.5V6A1.5 1.5 0 0 1 6 4.5z" />
    <path d="M8.5 4.5V9h6V4.5M8.5 16h7" />
  </Svg>
);

export const UploadIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 19V9m0 0 3.5 3.5M12 9l-3.5 3.5M5 5h14" />
  </Svg>
);

export const AlertIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4.5 21 20H3zM12 10v4.5M12 17.2v.3" />
  </Svg>
);

export const InfoIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5M12 7.8v.3" />
  </Svg>
);

export const UserIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="9" r="3.5" />
    <path d="M5 20c1.2-3.3 3.8-4.8 7-4.8s5.8 1.5 7 4.8" />
  </Svg>
);

export const ShieldIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5 19 6v6c0 4-3 7-7 8.5-4-1.5-7-4.5-7-8.5V6z" />
    <path d="M9.5 12l2 2 3.5-3.5" />
  </Svg>
);

export const LogOutIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14.5 4.5h-8A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5h8" />
    <path d="M15 12h5m0 0-2.5-2.5M20 12l-2.5 2.5" />
  </Svg>
);

export const GithubIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 19.5c-4 1.2-4-2.1-5.5-2.6m11 5.1V18c0-1 .1-1.4-.5-2 2.3-.3 4.5-1.2 4.5-5a3.9 3.9 0 0 0-1.1-2.7 3.6 3.6 0 0 0-.1-2.8s-1.1-.3-3.6 1.4a9 9 0 0 0-4.6 0C6.6 5.2 5.5 5.5 5.5 5.5a3.6 3.6 0 0 0-.1 2.8A3.9 3.9 0 0 0 4.3 11c0 3.8 2.2 4.7 4.5 5-.6.6-.6 1.2-.5 2v4" />
  </Svg>
);

export const SunIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18" />
  </Svg>
);

export const MoonIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
  </Svg>
);

export const MenuIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const SpinnerIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true" {...p}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" opacity="0.2" fill="none" />
    <path
      d="M21 12a9 9 0 0 0-9-9"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

/** Extension-aware icon tint for the preview, so the tree reads at a glance. */
export function fileAccent(name: string): string {
  const ext = name.slice(name.lastIndexOf('.') + 1).toLowerCase();
  if (['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs'].includes(ext)) return 'text-file';
  if (['json', 'yml', 'yaml', 'toml', 'env', 'example'].includes(ext)) return 'text-folder';
  if (['css', 'scss', 'sass'].includes(ext)) return 'text-file';
  if (['md', 'mdx', 'txt'].includes(ext)) return 'text-muted';
  return 'text-muted';
}
