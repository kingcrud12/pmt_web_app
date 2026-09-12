package fr.techcrud.pmt_api.security;

import fr.techcrud.pmt_api.entities.Users;
import fr.techcrud.pmt_api.exception.InvalidCredentialsException;
import fr.techcrud.pmt_api.model.Email;
import fr.techcrud.pmt_api.model.HashedPassword;
import fr.techcrud.pmt_api.repositories.UsersRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@ExtendWith(MockitoExtension.class)
@DisplayName("CurrentUser")
class CurrentUserTest {

    @Mock private UsersRepository usersRepository;
    @InjectMocks private CurrentUser currentUser;

    private Users alice;

    @BeforeEach
    void setUp() {
        alice = Users.create("Alice", "Durand", new Email("alice@pmt.fr"),
                new HashedPassword("$2a$10$" + "x".repeat(53)));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authentifier(String sujet) {
        Jwt jwt = Jwt.withTokenValue("jeton")
                .header("alg", "HS256")
                .subject(sujet)
                .claim("email", "alice@pmt.fr")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(jwt, null, List.of()));
    }

    @Test
    @DisplayName("l'identite vient du jeton, jamais d'un parametre de requete")
    void identityComesFromToken() {
        authentifier(alice.getId().toString());
        assertEquals(alice.getId(), currentUser.id());
    }

    @Test
    @DisplayName("sans authentification, l'acces est refuse")
    void refusesWhenUnauthenticated() {
        SecurityContextHolder.clearContext();
        assertThrows(InvalidCredentialsException.class, () -> currentUser.id());
    }

    @Test
    @DisplayName("charge l'utilisateur complet depuis la base")
    void loadsFullUser() {
        authentifier(alice.getId().toString());
        org.mockito.Mockito.when(usersRepository.findById(alice.getId()))
                .thenReturn(Optional.of(alice));

        assertEquals("alice@pmt.fr", currentUser.entity().getEmail().value());
    }

    @Test
    @DisplayName("un jeton valide dont le compte a disparu est refuse")
    void refusesWhenAccountDeleted() {
        authentifier(alice.getId().toString());
        org.mockito.Mockito.when(usersRepository.findById(alice.getId()))
                .thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class, () -> currentUser.entity());
    }
}
