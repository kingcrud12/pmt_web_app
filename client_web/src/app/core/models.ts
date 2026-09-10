export type ProjectRole = 'ADMIN' | 'MEMBER' | 'OBSERVER';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: UserResponse;
}

export interface ProjectResponse {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  createdAt: string;

  myRole: ProjectRole;
  memberCount: number;
  taskCount: number;
  doneTaskCount: number;
}

export interface MemberResponse {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: ProjectRole;
  joinedAt: string;
}

export interface TaskResponse {
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

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateProjectRequest {
  name: string;
  description: string | null;
  startDate: string;
}

export interface InviteMemberRequest {
  email: string;
  role: ProjectRole | null;
}

export interface ChangeRoleRequest {
  role: ProjectRole;
}

export interface CreateTaskRequest {
  name: string;
  description: string | null;
  dueDate: string | null;
  priority: TaskPriority;

  assigneeId: string | null;
}

export interface UpdateTaskRequest {
  name: string;
  description: string | null;
  dueDate: string | null;
  endDate: string | null;
  priority: TaskPriority;
  status: TaskStatus;

  assigneeId: string | null;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;

  fields?: Record<string, string>;
}

export type User = UserResponse;
export type Project = ProjectResponse;
export type Member = MemberResponse;
export type Task = TaskResponse;
