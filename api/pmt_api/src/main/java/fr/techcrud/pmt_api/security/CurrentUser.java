package fr.techcrud.pmt_api.security;

import fr.techcrud.pmt_api.entities.Users;
import fr.techcrud.pmt_api.exception.InvalidCredentialsException;
import fr.techcrud.pmt_api.repositories.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.UUID;

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

                .orElseThrow(InvalidCredentialsException::new);
    }
}
