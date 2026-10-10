export type NodeType = 'file' | 'folder';

export interface TreeNode {
  /** Stable path-based identity, e.g. `app/(auth)/login/page.tsx`. */
  id: string;
  name: string;
  type: NodeType;
  children: TreeNode[];
  /** 1-based source line the node came from, or null for an inferred folder. */
  line: number | null;
}

export type DiagnosticSeverity = 'error' | 'warning';

export interface Diagnostic {
  line: number | null;
  severity: DiagnosticSeverity;
  message: string;
  /** Machine-readable code, useful for tests and for grouping in the UI. */
  code: DiagnosticCode;
}

export type DiagnosticCode =
  | 'empty-input'
  | 'inconsistent-indent'
  | 'illegal-character'
  | 'path-traversal'
  | 'absolute-path'
  | 'reserved-name'
  | 'name-too-long'
  | 'duplicate-entry'
  | 'too-many-nodes'
  | 'too-deep'
  | 'folder-with-extension'
  | 'trailing-dot';

export interface TreeStats {
  files: number;
  folders: number;
  depth: number;
}

export interface ParseResult {
  roots: TreeNode[];
  diagnostics: Diagnostic[];
  stats: TreeStats;
}
