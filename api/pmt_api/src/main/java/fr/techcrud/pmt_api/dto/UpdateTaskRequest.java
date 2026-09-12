package fr.techcrud.pmt_api.dto;

import fr.techcrud.pmt_api.model.TaskPriority;
import fr.techcrud.pmt_api.model.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdateTaskRequest(
        @NotBlank(message = "Le nom de la tache est obligatoire")
        @Size(max = 250, message = "Le nom ne peut pas depasser 250 caracteres")
        String name,

        @Size(max = 5000, message = "La description ne peut pas depasser 5000 caracteres")
        String description,

        LocalDate dueDate,

        LocalDate endDate,

        @NotNull(message = "La priorite est obligatoire")
        TaskPriority priority,

        @NotNull(message = "Le statut est obligatoire")
        TaskStatus status,

        String assigneeId
) {
}
