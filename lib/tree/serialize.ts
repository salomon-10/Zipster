import type { TreeNode } from './types';

/**
 * Renders a tree back to canonical `tree` output. Used by the share page and by
 * the GitHub importer, so that whatever comes out of Zipster can be pasted
 * straight back into it.
 */
export function serializeTree(nodes: TreeNode[]): string {
  const lines: string[] = [];

  const walk = (items: TreeNode[], prefix: string) => {
    items.forEach((node, index) => {
      const last = index === items.length - 1;
      const suffix = node.type === 'folder' ? '/' : '';
      lines.push(`${prefix}${last ? '└── ' : '├── '}${node.name}${suffix}`);
      if (node.children.length > 0) {
        walk(node.children, `${prefix}${last ? '    ' : '│   '}`);
      }
    });
  };

  nodes.forEach((node, index) => {
    const suffix = node.type === 'folder' ? '/' : '';
    lines.push(`${node.name}${suffix}`);
    walk(node.children, '');
    if (index < nodes.length - 1) lines.push('');
  });

  return lines.join('\n');
}

/** Renders a tree with plain two-space indentation. */
export function serializeIndented(nodes: TreeNode[], depth = 0): string {
  const lines: string[] = [];
  for (const node of nodes) {
    lines.push(`${'  '.repeat(depth)}${node.name}${node.type === 'folder' ? '/' : ''}`);
    if (node.children.length > 0) lines.push(serializeIndented(node.children, depth + 1));
  }
  return lines.filter(Boolean).join('\n');
}
