package fr.techcrud.pmt_api.dto;

import fr.techcrud.pmt_api.model.ProjectRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record InviteMemberRequest(
        @NotBlank(message = "L'email est obligatoire")
        @Email(message = "Format d'email invalide")
        String email,

        /** Facultatif : MEMBER par defaut. */
        ProjectRole role
) {
}
