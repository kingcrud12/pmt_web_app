package fr.techcrud.pmt_api.entities;

import fr.techcrud.pmt_api.model.ProjectRole;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

/**
 * L'appartenance d'un utilisateur a un projet, avec son role.
 *
 * C'est la table qui porte TOUTE l'autorisation applicative. Chaque endpoint
 * projet ou tache commence par verifier qu'une ligne existe ici pour le couple
 * (utilisateur courant, projet demande) — c'est la parade aux failles IDOR.
 */
@Entity
@Table(
        name = "project_members",
        uniqueConstraints = @UniqueConstraint(name = "uk_project_members", columnNames = {"project_id", "user_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class ProjectMember {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", columnDefinition = "CHAR(36)", length = 36, updatable = false, nullable = false)
    @EqualsAndHashCode.Include
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    /**
     * EnumType.STRING et non ORDINAL : avec ORDINAL, inserer une valeur au
     * milieu de l'enum decalerait silencieusement tous les roles deja en base.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 20, nullable = false)
    private ProjectRole role;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    public static ProjectMember create(Project project, Users user, ProjectRole role) {
        ProjectMember member = new ProjectMember();
        member.id = UUID.randomUUID();
        member.project = project;
        member.user = user;
        member.role = role;
        member.joinedAt = Instant.now();
        return member;
    }
}
