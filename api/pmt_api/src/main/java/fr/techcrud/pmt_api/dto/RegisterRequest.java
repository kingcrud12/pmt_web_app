package fr.techcrud.pmt_api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Le contrat d'ENTREE de l'API : ce que le client a le droit d'envoyer.
 *
 * Pourquoi pas l'entite Users directement en @RequestBody ? Parce que le jour
 * ou elle gagnera un champ "role", un client pourrait poster {"role":"ADMIN"}
 * et s'auto-promouvoir. Ici le champ n'existe pas : la valeur est ignoree.
 *
 * Les annotations dupliquent volontairement les regles des objets-valeurs.
 * Ce n'est pas redondant : elles rejettent la requete tot, avec un message par
 * champ exploitable par le front, tandis qu'Email et RawPassword restent la
 * derniere ligne de defense pour tout ce qui n'entre pas par HTTP.
 */
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
