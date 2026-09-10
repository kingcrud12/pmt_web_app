export type ProjectRole = 'ADMIN' | 'MEMBER' | 'OBSERVER';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt?: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: User;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  createdAt: string;
  /**
   * Rôle de l'utilisateur courant sur CE projet.
   * Sert uniquement à masquer des boutons : le serveur revalide chaque action.
   */
  myRole: ProjectRole;
  memberCount: number;
}

export interface Member {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: ProjectRole;
  joinedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  dueDate: string | null;
  endDate: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId: string | null;
  assigneeName: string | null;
  createdAt: string;
  updatedAt: string | null;
}

/** Corps d'erreur renvoyé par GlobalExceptionHandler. */
export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fields?: Record<string, string>;
}
