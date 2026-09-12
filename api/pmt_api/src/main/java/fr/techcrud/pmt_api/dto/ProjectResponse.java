package fr.techcrud.pmt_api.dto;

import fr.techcrud.pmt_api.entities.Project;
import fr.techcrud.pmt_api.model.ProjectRole;

import java.time.Instant;
import java.time.LocalDate;

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
