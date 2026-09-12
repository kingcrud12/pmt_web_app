package fr.techcrud.pmt_api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

        @NotBlank(message = "Le prenom est obligatoire")
        @Size(max = 250, message = "Le prenom ne peut pas depasser 250 caracteres")
        String firstName,

        @NotBlank(message = "Le nom est obligatoire")
        @Size(max = 250, message = "Le nom ne peut pas depasser 250 caracteres")
        String lastName,

        @NotBlank(message = "L'email est obligatoire")
        @Email(message = "Format d'email invalide")
        @Size(max = 250, message = "L'email ne peut pas depasser 250 caracteres")
        String email,

        @NotBlank(message = "Le mot de passe est obligatoire")
        @Size(min = 8, message = "Le mot de passe doit faire au moins 8 caracteres")
        String password
) {
}
