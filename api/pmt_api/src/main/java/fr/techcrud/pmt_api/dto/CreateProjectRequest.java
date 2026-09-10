package fr.techcrud.pmt_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateProjectRequest(
        @NotBlank(message = "Le nom du projet est obligatoire")
        @Size(max = 250, message = "Le nom ne peut pas depasser 250 caracteres")
        String name,

        @Size(max = 5000, message = "La description ne peut pas depasser 5000 caracteres")
        String description,

        @NotNull(message = "La date de debut est obligatoire")
        LocalDate startDate
) {
}
