export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: string;
}

export interface UserWithSecret extends User {
  passwordHash: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  rawTree: string;
  isPublic: boolean;
  shareSlug: string | null;
  viewCount: number;
  fileCount: number;
  folderCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SharedProject extends Project {
  ownerUsername: string;
}

export interface Generation {
  id: string;
  userId: string | null;
  projectId: string | null;
  projectName: string | null;
  fileCount: number;
  folderCount: number;
  sizeBytes: number;
  source: 'editor' | 'project' | 'shared' | 'import';
  createdAt: string;
}

export interface FileTemplate {
  id: string;
  name: string;
  filePattern: string;
  framework: string | null;
  content: string;
  isOfficial: boolean;
  createdAt: string;
}

export interface AdminUserRow extends User {
  projectCount: number;
  generationCount: number;
}

export interface PlatformStats {
  users: number;
  projects: number;
  publicProjects: number;
  generations: number;
  filesCreated: number;
}

export interface ActivityPoint {
  day: string;
  generations: number;
  files: number;
}
