import { describe, expect, it } from 'vitest';
import { parseTree, flattenTree, looksLikeFile } from '@/lib/tree/parser';
import { serializeTree } from '@/lib/tree/serialize';

function names(nodes: ReturnType<typeof parseTree>['roots']): string[] {
  return nodes.map((n) => n.name);
}

describe('parseTree — basic shapes', () => {
  it('parses a simple two-space indented tree', () => {
    const { roots, stats } = parseTree('app/\n  page.tsx\n  layout.tsx\n');
    expect(names(roots)).toEqual(['app']);
    expect(names(roots[0]!.children)).toEqual(['page.tsx', 'layout.tsx']);
    expect(stats).toEqual({ files: 2, folders: 1, depth: 2 });
  });

  it('parses tab-indented trees', () => {
    const { roots } = parseTree('app/\n\tpage.tsx\n\tcomponents/\n\t\tbutton.tsx\n');
    expect(roots[0]!.children.map((c) => c.name)).toEqual(['page.tsx', 'components']);
    expect(roots[0]!.children[1]!.children[0]!.name).toBe('button.tsx');
  });

  it('parses `tree`-style box-drawing output', () => {
    const input = ['app/', '├── page.tsx', '└── components/', '    └── button.tsx'].join('\n');
    const { roots } = parseTree(input);
    expect(roots[0]!.children.map((c) => c.name)).toEqual(['page.tsx', 'components']);
    expect(roots[0]!.children[1]!.type).toBe('folder');
    expect(roots[0]!.children[1]!.children[0]!.name).toBe('button.tsx');
  });

  it('parses vertical-bar continuation glyphs at deeper levels', () => {
    const input = ['app/', '├── components/', '│   ├── button.tsx', '│   └── input.tsx', '└── page.tsx'].join('\n');
    const { roots } = parseTree(input);
    const components = roots[0]!.children[0]!;
    expect(components.name).toBe('components');
    expect(components.children.map((c) => c.name)).toEqual(['button.tsx', 'input.tsx']);
  });

  it('expands single-line slash paths into nested folders', () => {
    const { roots } = parseTree('app/(auth)/login/page.tsx');
    expect(roots[0]!.name).toBe('app');
    expect(roots[0]!.children[0]!.name).toBe('(auth)');
    expect(roots[0]!.children[0]!.children[0]!.name).toBe('login');
    expect(roots[0]!.children[0]!.children[0]!.children[0]!.type).toBe('file');
  });

  it('accepts multiple roots at the top level', () => {
    const { roots } = parseTree('app/\n  page.tsx\npackage.json\n');
    expect(names(roots)).toEqual(['app', 'package.json']);
    expect(roots[1]!.type).toBe('file');
  });

  it('handles an empty input without throwing', () => {
    const { roots, diagnostics } = parseTree('');
    expect(roots).toEqual([]);
    expect(diagnostics[0]?.code).toBe('empty-input');
  });

  it('ignores blank lines between entries', () => {
    const { roots } = parseTree('app/\n  page.tsx\n\n  layout.tsx\n');
    expect(roots[0]!.children).toHaveLength(2);
  });
});

describe('parseTree — file vs folder heuristics', () => {
  it('treats a trailing slash as an explicit folder', () => {
    const { roots } = parseTree('build/');
    expect(roots[0]!.type).toBe('folder');
  });

  it('treats extensionless well-known filenames as files', () => {
    for (const name of ['Dockerfile', 'Makefile', 'LICENSE', 'README', 'Procfile']) {
      const { roots } = parseTree(name);
      expect(roots[0]!.type, name).toBe('file');
    }
  });

  it('treats ambiguous extensionless names with children as folders', () => {
    for (const name of ['main', 'go', 'install', 'news', 'security', 'todo', 'version', 'nginx']) {
      const { roots } = parseTree(`${name}\n  child.txt\n`);
      expect(roots[0]!.type, name).toBe('folder');
      expect(roots[0]!.children[0]!.name, name).toBe('child.txt');
    }
  });

  it('treats a bare extensionless unknown name as a folder', () => {
    const { roots } = parseTree('vendor');
    expect(roots[0]!.type).toBe('folder');
  });

  it('treats dotfiles with a single dot as files', () => {
    for (const name of ['.env', '.gitignore', '.npmrc', '.editorconfig']) {
      const { roots } = parseTree(name);
      expect(roots[0]!.type, name).toBe('file');
    }
  });

  it('treats known dot-directories as folders', () => {
    for (const name of ['.github/', '.vscode/', '.git/']) {
      const { roots } = parseTree(name);
      expect(roots[0]!.type, name).toBe('folder');
    }
  });

  it('treats a name with a short alphanumeric extension as a file', () => {
    for (const name of ['index.ts', 'style.module.css', 'archive.tar.gz']) {
      const { roots } = parseTree(name);
      expect(roots[0]!.type, name).toBe('file');
    }
  });

  it('treats any name with children as a folder regardless of its shape', () => {
    const { roots } = parseTree('weird.name/\n  file.ts\n');
    expect(roots[0]!.type).toBe('folder');
  });

  it('flags a folder-looking trailing slash on a file-shaped name', () => {
    const { diagnostics } = parseTree('README.md/');
    expect(diagnostics.some((d) => d.code === 'folder-with-extension')).toBe(true);
  });

  it(looksLikeFile.name + ': treats numeric versioned folders as folders', () => {
    expect(looksLikeFile('v2')).toBe(false);
    expect(looksLikeFile('2024')).toBe(false);
  });
});

describe('parseTree — comments and noise', () => {
  it('strips trailing # comments', () => {
    const { roots } = parseTree('app/ # routes\n  page.tsx # entry point\n');
    expect(roots[0]!.name).toBe('app');
    expect(roots[0]!.children[0]!.name).toBe('page.tsx');
  });

  it('strips trailing // comments', () => {
    const { roots } = parseTree('src/ // source\n  index.ts // main\n');
    expect(roots[0]!.children[0]!.name).toBe('index.ts');
  });

  it('does not strip a # that is part of a filename-less mid content', () => {
    // A lone leading "#" is a comment marker only when preceded by whitespace.
    const { roots } = parseTree('c#-notes.txt');
    expect(roots[0]!.name).toBe('c#-notes.txt');
  });
});

describe('parseTree — indentation robustness', () => {
  it('recovers from inconsistent sibling indentation with a warning, not a crash', () => {
    const { roots, diagnostics } = parseTree('app/\n  components/\n    button.tsx\n     input.tsx\n');
    const components = roots[0]!.children[0]!;
    expect(components.children.map((c) => c.name)).toEqual(['button.tsx', 'input.tsx']);
    expect(diagnostics.some((d) => d.code === 'inconsistent-indent')).toBe(true);
  });

  it('attaches an under-indented line to the nearest valid parent', () => {
    const { roots } = parseTree('app/\n    deep.ts\n  shallow.ts\n');
    expect(roots[0]!.children.map((c) => c.name)).toContain('shallow.ts');
  });

  it('merges a duplicate entry at the same level instead of erroring', () => {
    const { roots, diagnostics } = parseTree('app/\n  page.tsx\n  page.tsx\n');
    expect(roots[0]!.children).toHaveLength(1);
    expect(diagnostics.some((d) => d.code === 'duplicate-entry')).toBe(true);
  });

  it('merges an explicit file line into a folder implied by a later nested line', () => {
    const { roots } = parseTree('app/\n  components\n  components/\n    button.tsx\n');
    const components = roots[0]!.children.find((c) => c.name === 'components');
    expect(components?.type).toBe('folder');
    expect(components?.children).toHaveLength(1);
  });

  it('lets deeper indentation turn a dotted name into a folder', () => {
    for (const name of ['config.d', 'notes.v2', 'v1.0']) {
      const { roots } = parseTree(`${name}\n  child.txt\n`);
      expect(roots[0]!.type, name).toBe('folder');
      expect(roots[0]!.children[0]!.name, name).toBe('child.txt');
    }
  });

  it('warns and removes trailing dots from names', () => {
    const { roots, diagnostics } = parseTree('trailing.\n');
    expect(roots[0]!.name).toBe('trailing');
    expect(diagnostics.some((d) => d.code === 'trailing-dot' && d.severity === 'warning')).toBe(true);
  });
});

describe('parseTree — security and limits', () => {
  it('rejects path traversal segments', () => {
    const { diagnostics, roots } = parseTree('../etc/passwd');
    expect(diagnostics.some((d) => d.code === 'path-traversal')).toBe(true);
    expect(roots).toHaveLength(0);
  });

  it('rejects only exact traversal segments, not names containing two dots', () => {
    const accepted = parseTree('my..file.txt');
    expect(accepted.roots[0]!.name).toBe('my..file.txt');
    expect(accepted.diagnostics.some((d) => d.code === 'path-traversal')).toBe(false);

    for (const input of ['../x', 'a/../b', '..']) {
      expect(parseTree(input).diagnostics.some((d) => d.code === 'path-traversal'), input).toBe(true);
    }
  });

  it('rejects illegal filename characters', () => {
    const { diagnostics } = parseTree('weird<name>.txt');
    expect(diagnostics.some((d) => d.code === 'illegal-character')).toBe(true);
  });

  it('warns on Windows reserved device names', () => {
    const { diagnostics } = parseTree('CON.txt');
    expect(diagnostics.some((d) => d.code === 'reserved-name' && d.severity === 'warning')).toBe(true);
  });

  it('treats a leading slash as relative and warns', () => {
    const { roots, diagnostics } = parseTree('/etc/hosts');
    expect(diagnostics.some((d) => d.code === 'absolute-path')).toBe(true);
    expect(roots[0]!.name).toBe('etc');
  });

  it('caps total nodes and reports it once', () => {
    const lines = Array.from({ length: 2100 }, (_, i) => `file${i}.ts`).join('\n');
    const { stats, diagnostics } = parseTree(lines);
    expect(stats.files).toBeLessThanOrEqual(2000);
    expect(diagnostics.filter((d) => d.code === 'too-many-nodes')).toHaveLength(1);
  });

  it('caps nesting depth', () => {
    const segments = Array.from({ length: 25 }, (_, i) => `d${i}`).join('/');
    const { diagnostics } = parseTree(`${segments}/file.ts`);
    expect(diagnostics.some((d) => d.code === 'too-deep')).toBe(true);
  });

  it('caps the number of input lines', () => {
    const input = [...Array.from({ length: 4000 }, () => ''), 'late.ts'].join('\n');
    const { roots } = parseTree(input);
    expect(roots).toHaveLength(0);
  });

  it('preserves unicode names and CRLF input', () => {
    const { roots } = parseTree('données/\r\n\t📦.txt\r\n');
    expect(roots[0]!.name).toBe('données');
    expect(roots[0]!.children[0]!.name).toBe('📦.txt');
  });
});

describe('flattenTree', () => {
  it('produces archive-ready paths with trailing slashes on folders', () => {
    const { roots } = parseTree('app/\n  page.tsx\n');
    const flat = flattenTree(roots);
    expect(flat).toEqual([
      { path: 'app/', type: 'folder' },
      { path: 'app/page.tsx', type: 'file' },
    ]);
  });
});

describe('serializeTree', () => {
  it('round-trips through the parser', () => {
    const { roots } = parseTree('app/\n  components/\n    button.tsx\n  page.tsx\npackage.json\n');
    const text = serializeTree(roots);
    const reparsed = parseTree(text);
    expect(reparsed.stats).toEqual({ files: 3, folders: 2, depth: 3 });
  });
});
