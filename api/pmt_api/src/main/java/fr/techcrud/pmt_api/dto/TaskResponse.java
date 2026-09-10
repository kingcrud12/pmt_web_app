package fr.techcrud.pmt_api.dto;

import fr.techcrud.pmt_api.entities.Task;
import fr.techcrud.pmt_api.model.TaskPriority;
import fr.techcrud.pmt_api.model.TaskStatus;

import java.time.Instant;
import java.time.LocalDate;

public record TaskResponse(
        String id,
        String projectId,
        String name,
        String description,
        LocalDate dueDate,
        LocalDate endDate,
        TaskPriority priority,
        TaskStatus status,
        String assigneeId,
        String assigneeName,
        Instant createdAt,
        Instant updatedAt
) {
    public static TaskResponse of(Task task) {
        var assignee = task.getAssignee();
        return new TaskResponse(
                task.getId().toString(),
                task.getProject().getId().toString(),
                task.getName(),
                task.getDescription(),
                task.getDueDate(),
                task.getEndDate(),
                task.getPriority(),
                task.getStatus(),
                assignee == null ? null : assignee.getId().toString(),
                assignee == null ? null : assignee.getFirstName() + " " + assignee.getLastName(),
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }
}
