package fr.techcrud.pmt_api.security;

import fr.techcrud.pmt_api.entities.Users;
import fr.techcrud.pmt_api.exception.InvalidCredentialsException;
import fr.techcrud.pmt_api.repositories.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Fournit l'utilisateur authentifie a partir du jeton.
 *
 * REGLE DE SECURITE CENTRALE : l'identite vient TOUJOURS d'ici, jamais d'un
 * parametre de requete. Un endpoint qui accepterait ?userId=... laisserait
 * n'importe qui agir au nom d'un autre — c'est la faille IDOR de base.
 */
@Component
@RequiredArgsConstructor
public class CurrentUser {

    private final UsersRepository usersRepository;

    public UUID id() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new InvalidCredentialsException();
        }
        return UUID.fromString(jwt.getSubject());
    }

    public Users entity() {
        return usersRepository.findById(id())
                // Jeton valide mais compte supprime entre-temps.
                .orElseThrow(InvalidCredentialsException::new);
    }
}
