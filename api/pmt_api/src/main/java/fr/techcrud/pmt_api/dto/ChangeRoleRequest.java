package fr.techcrud.pmt_api.dto;

import fr.techcrud.pmt_api.model.ProjectRole;
import jakarta.validation.constraints.NotNull;

public record ChangeRoleRequest(
        @NotNull(message = "Le role est obligatoire") ProjectRole role
) {
}
