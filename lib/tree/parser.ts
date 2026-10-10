import {
  BRANCH_TOKENS,
  DOT_FOLDERS,
  EXTENSIONLESS_FILES,
  ILLEGAL_NAME_CHARS,
  LIMITS,
  TAB_WIDTH,
  VERTICAL_GLYPHS,
  WINDOWS_RESERVED_NAMES,
} from './constants';
import type { Diagnostic, DiagnosticCode, ParseResult, TreeNode } from './types';

/**
 * Turns a hand-written or copy-pasted folder tree into a typed tree.
 *
 * The parser is deliberately forgiving: it accepts `tree` output with box
 * glyphs, plain 2- or 4-space indentation, tabs, mixed indentation, inline
 * comments, and slash-separated paths on a single line. It never throws —
 * problems come back as diagnostics so the editor can keep previewing while
 * the user is still typing.
 */

interface Internal {
  name: string;
  line: number | null;
  /** The line ended with `/`, so the author meant a folder. */
  explicitFolder: boolean;
  /** Came from a line of its own rather than being inferred from `a/b/c`. */
  explicit: boolean;
  children: Map<string, Internal>;
}

interface Frame {
  indent: number;
  depth: number;
  node: Internal | null;
  children: Map<string, Internal>;
}

const COMMENT = /\s+(?:#|\/\/)\s.*$/;
const TRAILING_BARE_COMMENT = /\s+(?:#|\/\/)$/;

function createNode(name: string, line: number | null, explicitFolder: boolean, explicit: boolean): Internal {
  return { name, line, explicitFolder, explicit, children: new Map() };
}

/** Strips box glyphs and normalises tabs so leading spaces measure indentation.
 *  Handles branch tokens and vertical continuation glyphs in combination
 *  (e.g. `│   ├── name`), replacing each with an equal-width run of spaces so
 *  the resulting indentation width is preserved for depth arithmetic. */
function normalisePrefix(raw: string): string {
  const expanded = raw.replace(/\t/g, ' '.repeat(TAB_WIDTH));
  let out = '';
  let i = 0;

  while (i < expanded.length) {
    const rest = expanded.slice(i);
    const token = BRANCH_TOKENS.find((candidate) => rest.startsWith(candidate));
    if (token) {
      out += ' '.repeat(token.length);
      i += token.length;
      continue;
    }

    const char = expanded[i] as string;
    if (char === ' ' || VERTICAL_GLYPHS.includes(char)) {
      out += ' ';
      i += 1;
      continue;
    }

    break;
  }

  out += expanded.slice(i);
  // `tree` pads continuation lines with `─`; drop any left in the prefix.
  return out.replace(/^([ ]*)[─—-]+(?=[ ]*\S)/, (_m, pad: string) => pad + ' ');
}

function stripComment(content: string): string {
  return content.replace(COMMENT, '').replace(TRAILING_BARE_COMMENT, '').trimEnd();
}

function isKnownFile(name: string): boolean {
  const lower = name.toLowerCase();
  if (EXTENSIONLESS_FILES.has(lower)) return true;
  const withoutExt = lower.includes('.') ? lower.slice(0, lower.lastIndexOf('.')) : lower;
  return EXTENSIONLESS_FILES.has(withoutExt);
}

/**
 * Decides whether a childless, unmarked entry is a file.
 * Order matters: explicit markers are handled by the caller, so this only sees
 * genuinely ambiguous names.
 */
export function looksLikeFile(name: string): boolean {
  const lower = name.toLowerCase();
  if (DOT_FOLDERS.has(lower)) return false;
  if (name.startsWith('.')) return true;
  if (isKnownFile(name)) return true;

  const dot = name.lastIndexOf('.');
  if (dot > 0 && dot < name.length - 1) {
    const ext = name.slice(dot + 1);
    if (ext.length <= 10 && /^[a-zA-Z0-9_+-]+$/.test(ext)) return true;
  }
  return false;
}

function validateName(name: string, line: number, push: (code: DiagnosticCode, message: string, severity?: 'error' | 'warning') => void): boolean {
  if (name === '.' || name === '..') {
    push('path-traversal', `"${name}" is not a valid entry name. Relative path segments are removed.`);
    return false;
  }
  if (ILLEGAL_NAME_CHARS.test(name)) {
    push('illegal-character', `"${name}" contains a character that is not allowed in a filename.`);
    return false;
  }
  if (name.length > LIMITS.maxNameLength) {
    push('name-too-long', `Entry on line ${line} is longer than ${LIMITS.maxNameLength} characters.`);
    return false;
  }
  const base = name.includes('.') ? name.slice(0, name.indexOf('.')) : name;
  if (WINDOWS_RESERVED_NAMES.has(base.toLowerCase())) {
    push('reserved-name', `"${name}" is a reserved device name on Windows and may fail to extract there.`, 'warning');
  }
  return true;
}

export function parseTree(input: string): ParseResult {
  const diagnostics: Diagnostic[] = [];
  const seenCodes = new Set<string>();

  const add = (
    code: DiagnosticCode,
    message: string,
    line: number | null,
    severity: 'error' | 'warning' = 'error',
    once = false,
  ) => {
    const key = `${code}:${once ? '*' : line}`;
    if (seenCodes.has(key)) return;
    seenCodes.add(key);
    diagnostics.push({ code, message, line, severity });
  };

  const source = input.length > LIMITS.maxInputChars ? input.slice(0, LIMITS.maxInputChars) : input;

  if (!source.trim()) {
    return {
      roots: [],
      diagnostics: [{ code: 'empty-input', message: 'Nothing to preview yet.', line: null, severity: 'warning' }],
      stats: { files: 0, folders: 0, depth: 0 },
    };
  }

  const roots = new Map<string, Internal>();
  const stack: Frame[] = [{ indent: -1, depth: 0, node: null, children: roots }];
  const canonicalIndent: (number | undefined)[] = [];
  let nodeCount = 0;

  const rawLines = source.split(/\r\n|\r|\n/).slice(0, LIMITS.maxLines);

  for (let i = 0; i < rawLines.length; i += 1) {
    const lineNumber = i + 1;
    const rawLine = rawLines[i] ?? '';
    if (!rawLine.trim()) continue;

    const normalised = normalisePrefix(rawLine);
    const indent = normalised.length - normalised.trimStart().length;
    let content = stripComment(normalised.trim());
    if (!content || content === '.' || content === './') continue;

    if (content.startsWith('/')) {
      add('absolute-path', `Line ${lineNumber} starts at the filesystem root. It is treated as a relative path.`, lineNumber, 'warning');
      content = content.replace(/^\/+/, '');
    }
    content = content.replace(/^\.\//, '');
    if (!content) continue;

    const explicitFolder = /[/\\]$/.test(content);
    const segments = content
      .replace(/[/\\]+$/, '')
      .split(/[/\\]+/)
      .map((segment) => segment.trim())
      .filter(Boolean)
      .map((segment) => {
        if (segment.length > 1 && segment.endsWith('.') && !/^\.+$/.test(segment)) {
          add('trailing-dot', `"${segment}" ends with a dot and was renamed without the trailing dot.`, lineNumber, 'warning');
          return segment.replace(/\.+$/, '');
        }
        return segment;
      });

    if (segments.length === 0) continue;

    // Pop until the top of the stack is a strict ancestor of this indentation.
    while (stack.length > 1 && indent <= (stack[stack.length - 1]?.indent ?? -1)) {
      stack.pop();
    }

    // A one-space drift from the established indentation is treated as a
    // malformed sibling; a genuinely deeper indentation still wins and turns
    // the ambiguous entry into a folder.
    while (stack.length > 1) {
      const top = stack[stack.length - 1];
      const topNode = top?.node;
      const establishedIndent = top ? canonicalIndent[top.depth] : undefined;
      if (
        !topNode ||
        topNode.explicitFolder ||
        topNode.children.size > 0 ||
        !looksLikeFile(topNode.name) ||
        establishedIndent === undefined ||
        indent - establishedIndent > 1
      ) {
        break;
      }
      add(
        'inconsistent-indent',
        `Line ${lineNumber} is indented as if it were inside "${topNode.name}", but that looks like a file. It was attached one level up instead.`,
        lineNumber,
        'warning',
      );
      stack.pop();
    }

    const parent = stack[stack.length - 1];
    if (!parent) continue;

    const depth = parent.depth + 1;
    const expected = canonicalIndent[depth];
    if (expected === undefined) {
      canonicalIndent[depth] = indent;
    } else if (expected !== indent) {
      add(
        'inconsistent-indent',
        `Line ${lineNumber} is indented differently from its siblings. It was attached to the nearest parent above it.`,
        lineNumber,
        'warning',
      );
    }
    canonicalIndent.length = depth + 1;

    if (depth + segments.length - 1 > LIMITS.maxDepth) {
      add('too-deep', `The tree goes deeper than ${LIMITS.maxDepth} levels. Deeper entries were skipped.`, lineNumber, 'error', true);
      continue;
    }

    let cursor = parent.children;
    let created: Internal | null = null;
    let aborted = false;

    for (let s = 0; s < segments.length; s += 1) {
      const name = segments[s] as string;
      const isLast = s === segments.length - 1;

      if (!validateName(name, lineNumber, (code, message, severity) => add(code, message, lineNumber, severity))) {
        aborted = true;
        break;
      }

      const existing = cursor.get(name);
      if (existing) {
        if (isLast && existing.explicit && existing.children.size === 0) {
          add('duplicate-entry', `"${name}" appears more than once at the same level. The duplicate was merged.`, lineNumber, 'warning');
        }
        if (isLast) {
          existing.explicit = true;
          existing.explicitFolder = existing.explicitFolder || explicitFolder;
          if (existing.line === null) existing.line = lineNumber;
        }
        created = existing;
        cursor = existing.children;
        continue;
      }

      if (nodeCount >= LIMITS.maxNodes) {
        add('too-many-nodes', `The tree exceeds ${LIMITS.maxNodes} entries. The remainder was skipped.`, lineNumber, 'error', true);
        aborted = true;
        break;
      }

      const node = createNode(name, lineNumber, isLast ? explicitFolder : true, isLast);
      cursor.set(name, node);
      nodeCount += 1;
      created = node;
      cursor = node.children;
    }

    if (aborted || !created) continue;

    stack.push({ indent, depth: depth + segments.length - 1, node: created, children: created.children });
  }

  const finalRoots = finalise([...roots.values()], '', 1, (code, message, line, severity) =>
    add(code, message, line, severity),
  );

  return { roots: finalRoots, diagnostics, stats: collectStats(finalRoots) };
}

function finalise(
  nodes: Internal[],
  prefix: string,
  depth: number,
  report: (code: DiagnosticCode, message: string, line: number | null, severity: 'error' | 'warning') => void,
): TreeNode[] {
  return nodes.map((node) => {
    const hasChildren = node.children.size > 0;
    const isFolder = hasChildren || node.explicitFolder || !looksLikeFile(node.name);

    if (node.explicitFolder && !hasChildren && looksLikeFile(node.name)) {
      report(
        'folder-with-extension',
        `"${node.name}" ends with a slash so it is created as a folder, even though the name looks like a file.`,
        node.line,
        'warning',
      );
    }

    const id = prefix ? `${prefix}/${node.name}` : node.name;
    return {
      id,
      name: node.name,
      type: isFolder ? 'folder' : 'file',
      line: node.line,
      children: isFolder ? finalise([...node.children.values()], id, depth + 1, report) : [],
    };
  });
}

export function collectStats(nodes: TreeNode[], depth = 1): { files: number; folders: number; depth: number } {
  let files = 0;
  let folders = 0;
  let maxDepth = nodes.length > 0 ? depth : 0;

  for (const node of nodes) {
    if (node.type === 'folder') {
      folders += 1;
      const nested = collectStats(node.children, depth + 1);
      files += nested.files;
      folders += nested.folders;
      maxDepth = Math.max(maxDepth, nested.depth);
    } else {
      files += 1;
    }
  }

  return { files, folders, depth: maxDepth };
}

/** Flattens the tree into archive-ready paths. Folders keep a trailing slash. */
export function flattenTree(nodes: TreeNode[], prefix = ''): { path: string; type: 'file' | 'folder' }[] {
  const out: { path: string; type: 'file' | 'folder' }[] = [];
  for (const node of nodes) {
    const path = prefix ? `${prefix}/${node.name}` : node.name;
    if (node.type === 'folder') {
      out.push({ path: `${path}/`, type: 'folder' });
      out.push(...flattenTree(node.children, path));
    } else {
      out.push({ path, type: 'file' });
    }
  }
  return out;
}
