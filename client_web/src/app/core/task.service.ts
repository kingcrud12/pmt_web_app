import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateTaskRequest, TaskResponse, UpdateTaskRequest } from './models';

@Injectable({ providedIn: 'root' })
export class TaskService {
  constructor(private readonly http: HttpClient) {}

  create(projectId: string, body: CreateTaskRequest): Observable<TaskResponse> {
    return this.http.post<TaskResponse>(`/api/projects/${projectId}/tasks`, body);
  }

  getOne(taskId: string): Observable<TaskResponse> {
    return this.http.get<TaskResponse>(`/api/tasks/${taskId}`);
  }

  update(taskId: string, body: UpdateTaskRequest): Observable<TaskResponse> {
    return this.http.put<TaskResponse>(`/api/tasks/${taskId}`, body);
  }
}
