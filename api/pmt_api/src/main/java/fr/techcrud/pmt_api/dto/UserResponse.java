package fr.techcrud.pmt_api.dto;

import fr.techcrud.pmt_api.entities.Users;

import java.time.Instant;

/**
 * Le contrat de SORTIE de l'API.
 *
 * Son interet principal tient en une absence : pas de champ password.
 * Renvoyer l'entite exposerait le hachage BCrypt dans la reponse HTTP — le
 * @ToString(exclude) de Lombok ne protege que les logs, pas le JSON.
 */
public record UserResponse(
        String id,
        String firstName,
        String lastName,
        String email,
        Instant createdAt
) {

    public static UserResponse from(Users user) {
        return new UserResponse(
                user.getId().toString(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail().value(),
                user.getCreatedAt()
        );
    }
}
