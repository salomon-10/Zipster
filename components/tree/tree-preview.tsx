'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { TreeNode } from '@/lib/tree/types';
import { ChevronIcon, FileIcon, FolderIcon, FolderOpenIcon, fileAccent } from '@/components/ui/icons';

/**
 * Renders the parsed tree with real box-drawing connectors rather than nested
 * padding, so the preview matches the text the user typed line for line.
 */
export function TreePreview({ roots, className }: { roots: TreeNode[]; className?: string }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className={cn('overflow-x-auto py-1 font-mono text-xs leading-6', className)} role="tree">
      {roots.map((node, index) => (
        <Row
          key={node.id}
          node={node}
          prefix=""
          isLast={index === roots.length - 1}
          isRoot
          collapsed={collapsed}
          onToggle={toggle}
          level={1}
          position={index + 1}
          setSize={roots.length}
        />
      ))}
    </div>
  );
}

function Row({
  node,
  prefix,
  isLast,
  isRoot = false,
  collapsed,
  onToggle,
  level,
  position,
  setSize,
}: {
  node: TreeNode;
  prefix: string;
  isLast: boolean;
  isRoot?: boolean;
  collapsed: Set<string>;
  onToggle: (id: string) => void;
  level: number;
  position: number;
  setSize: number;
}) {
  const isFolder = node.type === 'folder';
  const hasChildren = node.children.length > 0;
  const isCollapsed = collapsed.has(node.id);
  const connector = isRoot ? '' : isLast ? '└── ' : '├── ';
  const childPrefix = isRoot ? '' : prefix + (isLast ? '    ' : '│   ');

  const content = (
    <>
      <span className="select-none whitespace-pre text-rail-strong">{prefix + connector}</span>
      {isFolder ? (
        <>
          {hasChildren ? (
            <ChevronIcon
              width={12}
              height={12}
              className={cn(
                'shrink-0 text-muted transition-transform duration-[120ms]',
                !isCollapsed && 'rotate-90',
              )}
            />
          ) : (
            <span className="w-3 shrink-0" />
          )}
          {isCollapsed && hasChildren ? (
            <FolderIcon width={14} height={14} className="shrink-0 text-folder" />
          ) : (
            <FolderOpenIcon width={14} height={14} className="shrink-0 text-folder" />
          )}
          <span title={node.name} className="truncate text-ink">{node.name}</span>
          <span className="text-rail-strong">/</span>
        </>
      ) : (
        <>
          <span className="w-3 shrink-0" />
          <FileIcon width={14} height={14} className={cn('shrink-0', fileAccent(node.name))} />
          <span title={node.name} className="truncate text-ink-soft">{node.name}</span>
        </>
      )}
    </>
  );

  return (
    <>
      {isFolder && hasChildren ? (
        <button
          type="button"
          onClick={() => onToggle(node.id)}
          aria-expanded={!isCollapsed}
          role="treeitem"
          aria-selected={false}
          aria-level={level}
          aria-posinset={position}
          aria-setsize={setSize}
          title={node.name}
          className="flex w-full items-center gap-1.5 rounded-[3px] px-1 text-left hover:bg-sunken"
        >
          {content}
        </button>
      ) : (
        <div
          role="treeitem"
          aria-selected={false}
          tabIndex={0}
          aria-level={level}
          aria-posinset={position}
          aria-setsize={setSize}
          title={node.name}
          className="flex items-center gap-1.5 rounded-[3px] px-1 hover:bg-sunken focus-visible:bg-sunken"
        >
          {content}
        </div>
      )}

      {hasChildren && !isCollapsed
        ? node.children.map((child, index) => (
            <Row
              key={child.id}
              node={child}
              prefix={childPrefix}
              isLast={index === node.children.length - 1}
              collapsed={collapsed}
              onToggle={onToggle}
              level={level + 1}
              position={index + 1}
              setSize={node.children.length}
            />
          ))
        : null}
    </>
  );
}
