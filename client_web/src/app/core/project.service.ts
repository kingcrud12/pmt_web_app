import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ChangeRoleRequest, CreateProjectRequest, InviteMemberRequest,
  MemberResponse, ProjectResponse, ProjectRole, TaskResponse,
} from './models';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<ProjectResponse[]> {
    return this.http.get<ProjectResponse[]>('/api/projects');
  }

  getOne(projectId: string): Observable<ProjectResponse> {
    return this.http.get<ProjectResponse>(`/api/projects/${projectId}`);
  }

  create(name: string, description: string, startDate: string): Observable<ProjectResponse> {
    const body: CreateProjectRequest = { name, description: description || null, startDate };
    return this.http.post<ProjectResponse>('/api/projects', body);
  }

  members(projectId: string): Observable<MemberResponse[]> {
    return this.http.get<MemberResponse[]>(`/api/projects/${projectId}/members`);
  }

  invite(projectId: string, email: string, role: ProjectRole): Observable<MemberResponse> {
    const body: InviteMemberRequest = { email, role };
    return this.http.post<MemberResponse>(`/api/projects/${projectId}/members`, body);
  }

  changeRole(projectId: string, userId: string, role: ProjectRole): Observable<MemberResponse> {
    const body: ChangeRoleRequest = { role };
    return this.http.put<MemberResponse>(`/api/projects/${projectId}/members/${userId}/role`, body);
  }

  tasks(projectId: string): Observable<TaskResponse[]> {
    return this.http.get<TaskResponse[]>(`/api/projects/${projectId}/tasks`);
  }
}
