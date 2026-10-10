import type { TreeNode } from '../tree/types';

export interface RepoRef {
  owner: string;
  repo: string;
}

const URL_PATTERN = /github\.com\/([^/\s]+)\/([^/\s#?]+)/i;
const SHORT_PATTERN = /^([\w.-]+)\/([\w.-]+)$/;

const OWNER_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const REPO_PATTERN = /^[A-Za-z0-9._-]{1,100}$/;

/** Anything that ends up in the API path must look like a real GitHub name,
 *  so input such as `..` or `x?y` can never reach another endpoint. */
function validRef(owner: string, repo: string): RepoRef | null {
  if (!OWNER_PATTERN.test(owner) || !REPO_PATTERN.test(repo) || repo === '.' || repo === '..') return null;
  return { owner, repo };
}

export function parseRepoInput(input: string): RepoRef | null {
  const trimmed = input.trim().replace(/\.git$/, '');

  const urlMatch = URL_PATTERN.exec(trimmed);
  if (urlMatch) return validRef(urlMatch[1] as string, urlMatch[2] as string);

  const shortMatch = SHORT_PATTERN.exec(trimmed);
  if (shortMatch) return validRef(shortMatch[1] as string, shortMatch[2] as string);

  return null;
}

interface GithubTreeEntry {
  path: string;
  type: 'blob' | 'tree' | 'commit';
}

export interface ImportedRepo {
  owner: string;
  repo: string;
  branch: string;
  roots: TreeNode[];
  truncated: boolean;
}

class ImportError extends Error {}

async function githubFetch(path: string): Promise<Response> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'zipster-app',
      // Optional: anonymous calls share 60 requests/hour per server IP, which a
      // hosted deployment burns through quickly. A token raises that to 5,000.
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
    next: { revalidate: 0 },
  });
  return response;
}

/** Builds a folder tree from GitHub's flat recursive tree listing, the same
 *  shape the parser produces, so the rest of the app (preview, generate,
 *  serialize) does not need to know entries came from an import. */
function buildTree(entries: GithubTreeEntry[]): TreeNode[] {
  const roots = new Map<string, TreeNode>();

  const ensure = (map: Map<string, TreeNode>, id: string, name: string, type: 'file' | 'folder'): TreeNode => {
    let node = map.get(name);
    if (!node) {
      node = { id, name, type, children: [], line: null };
      map.set(name, node);
    } else if (type === 'folder' && node.type === 'file') {
      node.type = 'folder';
    }
    return node;
  };

  const childMap = new WeakMap<TreeNode, Map<string, TreeNode>>();
  const mapFor = (node: TreeNode | null): Map<string, TreeNode> => {
    if (!node) return roots;
    let map = childMap.get(node);
    if (!map) {
      map = new Map(node.children.map((child) => [child.name, child]));
      childMap.set(node, map);
    }
    return map;
  };

  const sorted = [...entries].sort((a, b) => a.path.localeCompare(b.path));

  for (const entry of sorted) {
    const segments = entry.path.split('/');
    let parent: TreeNode | null = null;
    let prefix = '';

    segments.forEach((segment, index) => {
      const isLast = index === segments.length - 1;
      prefix = prefix ? `${prefix}/${segment}` : segment;
      const type: 'file' | 'folder' = isLast && entry.type === 'blob' ? 'file' : 'folder';
      const map = mapFor(parent);
      const node = ensure(map, prefix, segment, type);
      parent = node;
    });
  }

  const materialise = (map: Map<string, TreeNode>): TreeNode[] =>
    [...map.values()]
      .map((node) => ({ ...node, children: materialise(mapFor(node)) }))
      .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1));

  return materialise(roots);
}

export async function importRepoTree(ref: RepoRef): Promise<ImportedRepo> {
  const repoResponse = await githubFetch(`/repos/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}`);
  if (repoResponse.status === 404) throw new ImportError('That repository was not found, or it is private.');
  if (repoResponse.status === 403) throw new ImportError('GitHub is rate-limiting anonymous requests right now. Try again shortly.');
  if (!repoResponse.ok) throw new ImportError('GitHub could not be reached.');

  const repoData = (await repoResponse.json()) as { default_branch?: string };
  const branch = repoData.default_branch ?? 'main';

  const treeResponse = await githubFetch(
    `/repos/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
  );
  if (!treeResponse.ok) throw new ImportError('The repository tree could not be read.');

  const treeData = (await treeResponse.json()) as { tree?: GithubTreeEntry[]; truncated?: boolean };
  const entries = (treeData.tree ?? []).filter((entry) => entry.type === 'blob' || entry.type === 'tree');

  if (entries.length === 0) throw new ImportError('That repository looks empty.');

  return { owner: ref.owner, repo: ref.repo, branch, roots: buildTree(entries), truncated: Boolean(treeData.truncated) };
}

export { ImportError };
