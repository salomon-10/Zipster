/** Hard ceilings. Generation happens in the browser, so these protect the
 *  user's own tab rather than a server — but they also keep saved projects and
 *  previews within sane bounds. */
export const LIMITS = {
  maxNodes: 2000,
  maxDepth: 20,
  maxNameLength: 255,
  maxInputChars: 200_000,
  maxLines: 4000,
} as const;

/** Windows forbids these outright; the others break shells or archive tools. */
export const ILLEGAL_NAME_CHARS = /[<>:"\\|?*\u0000-\u001f]/;

/** Reserved device names on Windows. Checked against the name without its
 *  extension, case-insensitively. */
export const WINDOWS_RESERVED_NAMES = new Set([
  'con', 'prn', 'aux', 'nul',
  'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
  'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9',
]);

/** Files that carry no extension and would otherwise be read as folders. */
export const EXTENSIONLESS_FILES = new Set([
  'dockerfile', 'makefile', 'procfile', 'license', 'licence', 'readme',
  'changelog', 'contributing', 'authors', 'notice', 'codeowners', 'gemfile',
  'rakefile', 'brewfile', 'justfile', 'vagrantfile', 'jenkinsfile',
  'cname', 'caddyfile', 'copying', 'owners',
]);

/** Dot-prefixed names that are conventionally folders, not files. */
export const DOT_FOLDERS = new Set([
  '.github', '.vscode', '.husky', '.idea', '.git', '.next', '.circleci',
  '.devcontainer', '.storybook', '.yarn', '.cache', '.config', '.bin',
  '.gitlab', '.aws', '.docker', '.expo', '.turbo',
]);

/** Glyphs used by `tree`, `tree /F`, and hand-drawn variants. Each is replaced
 *  by an equal run of spaces so indentation arithmetic stays intact. */
export const BRANCH_TOKENS = ['├──', '└──', '|--', '`--', '+--', '\\--', '├─', '└─'];
export const VERTICAL_GLYPHS = ['│', '|', '┃', '┆', '┊'];

export const TAB_WIDTH = 4;
