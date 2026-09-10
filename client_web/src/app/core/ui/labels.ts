import { ProjectRole, TaskPriority, TaskStatus } from '../models';

export const ROLE_LABEL: Record<ProjectRole, string> = {
  ADMIN: 'Administrateur',
  MEMBER: 'Membre',
  OBSERVER: 'Observateur',
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: 'Basse',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
};

export const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: 'À faire',
  IN_PROGRESS: 'En cours',
  DONE: 'Terminée',
};

export function frDate(iso: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

export function isOverdue(dueDate: string | null, status: TaskStatus): boolean {
  if (!dueDate || status === 'DONE') return false;
  return dueDate < new Date().toISOString().substring(0, 10);
}
