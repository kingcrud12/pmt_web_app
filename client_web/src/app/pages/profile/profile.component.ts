import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ProjectService } from '../../core/project.service';
import { ApiError, Project, ProjectRole, User } from '../../core/models';

/**
 * Mon profil — lecture seule.
 *
 * Les champs affichés viennent de /api/auth/me plutôt que du signal de
 * l'AuthService : ce dernier restitue la copie figée à la connexion, alors
 * que la page a justement pour objet de montrer l'état courant du compte.
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="page-head">
      <div>
        <a routerLink="/projects" class="back">← Mes projets</a>
        <h1>Mon profil</h1>
        <p class="sub">Les informations rattachées à votre compte.</p>
      </div>
      <button type="button" class="ghost" (click)="auth.logout()">Se déconnecter</button>
    </header>

    @if (error()) { <p class="error" role="alert">{{ error() }}</p> }

    @if (user(); as u) {
      <div class="columns">
        <section>
          <h2>Identité</h2>

          <div class="panel identity">
            <span class="avatar" aria-hidden="true">{{ initials() }}</span>
            <div>
              <h3>{{ u.firstName }} {{ u.lastName }}</h3>
              <p class="meta">{{ u.email }}</p>
            </div>
          </div>

          <dl class="detail">
            <div><dt>Prénom</dt><dd>{{ u.firstName }}</dd></div>
            <div><dt>Nom</dt><dd>{{ u.lastName }}</dd></div>
            <div><dt>Adresse e-mail</dt><dd>{{ u.email }}</dd></div>
            <div>
              <dt>Compte créé le</dt>
              <dd>{{ u.createdAt ? (u.createdAt | date: 'dd/MM/yyyy à HH:mm') : '—' }}</dd>
            </div>
            <div><dt>Identifiant</dt><dd class="muted ident">{{ u.id }}</dd></div>
          </dl>

          <p><small>
            Ces informations sont celles enregistrées à l'inscription. Elles ne sont pas
            modifiables depuis cette page.
          </small></p>
        </section>

        <aside>
          <h2>Mon activité</h2>
          @if (projectsLoading()) {
            <div class="panel muted"><p>Chargement…</p></div>
          } @else {
            <ul class="stats">
              <li class="stat">
                <span class="num">{{ projects().length }}</span>
                <span class="lbl">Projet{{ projects().length > 1 ? 's' : '' }}</span>
              </li>
              <li class="stat">
                <span class="num">{{ countBy('ADMIN') }}</span>
                <span class="lbl">Administrateur</span>
              </li>
              <li class="stat">
                <span class="num">{{ countBy('MEMBER') }}</span>
                <span class="lbl">Membre</span>
              </li>
              <li class="stat">
                <span class="num">{{ countBy('OBSERVER') }}</span>
                <span class="lbl">Observateur</span>
              </li>
            </ul>

            @if (projects().length === 0) {
              <div class="panel muted">
                <p>Vous n'êtes membre d'aucun projet.</p>
                <p><a routerLink="/projects">Créer un premier projet</a></p>
              </div>
            }
          }
        </aside>
      </div>
    } @else if (!error()) {
      <p class="muted">Chargement…</p>
    }
  `,
})
export class ProfileComponent {
  readonly auth = inject(AuthService);
  private readonly projectService = inject(ProjectService);

  readonly user = signal<User | null>(null);
  readonly projects = signal<Project[]>([]);
  readonly projectsLoading = signal(true);
  readonly error = signal<string | null>(null);

  readonly initials = computed(() => {
    const u = this.user();
    if (!u) return '';
    return `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase();
  });

  constructor() {
    this.auth.me().subscribe({
      next: (u) => this.user.set(u),
      // Le 401 est déjà traité par l'intercepteur, qui déconnecte.
      error: (e) => this.error.set((e.error as ApiError)?.message ?? 'Profil indisponible'),
    });

    this.projectService.list().subscribe({
      next: (list) => {
        this.projects.set(list);
        this.projectsLoading.set(false);
      },
      error: () => this.projectsLoading.set(false),
    });
  }

  countBy(role: ProjectRole): number {
    return this.projects().filter((p) => p.myRole === role).length;
  }
}
