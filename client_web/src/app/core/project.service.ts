import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Member, Project, ProjectRole, Task } from './models';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<Project[]> {
    return this.http.get<Project[]>('/api/projects');
  }

  getOne(projectId: string): Observable<Project> {
    return this.http.get<Project>(`/api/projects/${projectId}`);
  }

  create(name: string, description: string, startDate: string): Observable<Project> {
    return this.http.post<Project>('/api/projects', { name, description, startDate });
  }

  members(projectId: string): Observable<Member[]> {
    return this.http.get<Member[]>(`/api/projects/${projectId}/members`);
  }

  invite(projectId: string, email: string, role: ProjectRole): Observable<Member> {
    return this.http.post<Member>(`/api/projects/${projectId}/members`, { email, role });
  }

  changeRole(projectId: string, userId: string, role: ProjectRole): Observable<Member> {
    return this.http.put<Member>(`/api/projects/${projectId}/members/${userId}/role`, { role });
  }

  tasks(projectId: string): Observable<Task[]> {
    return this.http.get<Task[]>(`/api/projects/${projectId}/tasks`);
  }
}
