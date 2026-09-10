import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Task, TaskPriority, TaskStatus } from './models';

export interface CreateTaskPayload {
  name: string;
  description: string | null;
  dueDate: string | null;
  priority: TaskPriority;
  assigneeId: string | null;
}

export interface UpdateTaskPayload extends CreateTaskPayload {
  endDate: string | null;
  status: TaskStatus;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  constructor(private readonly http: HttpClient) {}

  create(projectId: string, payload: CreateTaskPayload): Observable<Task> {
    return this.http.post<Task>(`/api/projects/${projectId}/tasks`, payload);
  }

  getOne(taskId: string): Observable<Task> {
    return this.http.get<Task>(`/api/tasks/${taskId}`);
  }

  update(taskId: string, payload: UpdateTaskPayload): Observable<Task> {
    return this.http.put<Task>(`/api/tasks/${taskId}`, payload);
  }
}
