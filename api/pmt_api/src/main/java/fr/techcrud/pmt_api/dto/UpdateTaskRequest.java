package fr.techcrud.pmt_api.dto;

import fr.techcrud.pmt_api.model.TaskPriority;
import fr.techcrud.pmt_api.model.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Mise a jour complete d'une tache.
 *
 * Noter l'ABSENCE de projectId : une tache ne change jamais de projet. L'y
 * autoriser ouvrirait une faille — deplacer une tache vers un projet dont on
 * est admin pour en prendre le controle.
 */
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

        /** null pour desassigner. */
        String assigneeId
) {
}
