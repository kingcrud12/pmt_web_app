package fr.techcrud.pmt_api.dto;

import fr.techcrud.pmt_api.entities.Project;
import fr.techcrud.pmt_api.model.ProjectRole;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Un projet, vu par l'utilisateur courant.
 *
 * myRole permet au front d'afficher ou masquer les boutons. C'est du CONFORT
 * d'affichage uniquement : le serveur revalide le role a chaque action, on ne
 * fait jamais confiance a ce que le client croit avoir le droit de faire.
 */
public record ProjectResponse(
        String id,
        String name,
        String description,
        LocalDate startDate,
        Instant createdAt,
        ProjectRole myRole,
        int memberCount,
        long taskCount,
        long doneTaskCount
) {
    public static ProjectResponse of(Project project, ProjectRole myRole, int memberCount,
                                     long taskCount, long doneTaskCount) {
        return new ProjectResponse(
                project.getId().toString(),
                project.getName(),
                project.getDescription(),
                project.getStartDate(),
                project.getCreatedAt(),
                myRole,
                memberCount,
                taskCount,
                doneTaskCount
        );
    }
}
