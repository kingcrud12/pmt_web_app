package fr.techcrud.pmt_api.services;

import fr.techcrud.pmt_api.dto.RegisterRequest;
import fr.techcrud.pmt_api.entities.Users;
import fr.techcrud.pmt_api.exception.EmailAlreadyUsedException;
import fr.techcrud.pmt_api.exception.InvalidEmailException;
import fr.techcrud.pmt_api.exception.WeakPasswordException;
import fr.techcrud.pmt_api.model.Email;
import fr.techcrud.pmt_api.repositories.UsersRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * La regle metier, testee SANS base de donnees.
 *
 * C'est l'equivalent en couches du RegisterUserTest de l'hexagonal : au lieu
 * d'un InMemoryUserRepository ecrit a la main, Mockito fabrique le double du
 * repository. Meme rapidite, un fichier de moins a maintenir.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService.register")
class AuthServiceTest {

    @Mock
    private UsersRepository usersRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private static final String HASH = "$2a$10$" + "x".repeat(53);

    private RegisterRequest request(String email) {
        return new RegisterRequest("Ron", "Malvaux", email, "motdepasse123");
    }

    @Test
    @DisplayName("inscrit un utilisateur et lui donne un identifiant")
    void registersAUser() {
        when(usersRepository.existsByEmail(any())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn(HASH);
        when(usersRepository.save(any(Users.class))).thenAnswer(i -> i.getArgument(0));

        Users user = authService.register(request("ron@pmt.fr"));

        assertNotNull(user.getId());
        assertNotNull(user.getCreatedAt());
        assertEquals("Ron", user.getFirstName());
        assertEquals("ron@pmt.fr", user.getEmail().value());
    }

    @Test
    @DisplayName("hache le mot de passe et ne stocke jamais le clair")
    void hashesThePassword() {
        when(usersRepository.existsByEmail(any())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn(HASH);
        when(usersRepository.save(any(Users.class))).thenAnswer(i -> i.getArgument(0));

        Users user = authService.register(request("ron@pmt.fr"));

        verify(passwordEncoder).encode("motdepasse123");
        assertEquals(HASH, user.getPassword().value());
        assertEquals(60, user.getPassword().value().length());
    }

    @Test
    @DisplayName("refuse un email deja utilise et n'enregistre rien")
    void rejectsAnAlreadyUsedEmail() {
        when(usersRepository.existsByEmail(new Email("ron@pmt.fr"))).thenReturn(true);

        assertThrows(EmailAlreadyUsedException.class,
                () -> authService.register(request("ron@pmt.fr")));

        verify(usersRepository, never()).save(any());
    }

    @Test
    @DisplayName("normalise la casse avant de chercher le doublon")
    void normalisesEmailCase() {
        when(usersRepository.existsByEmail(new Email("ron@pmt.fr"))).thenReturn(true);

        assertThrows(EmailAlreadyUsedException.class,
                () -> authService.register(request("RON@PMT.FR")));
    }

    @Test
    @DisplayName("refuse un email mal forme avant toute request")
    void rejectsAMalformedEmail() {
        assertThrows(InvalidEmailException.class,
                () -> authService.register(request("pas-un-email")));

        verify(usersRepository, never()).existsByEmail(any());
        verify(usersRepository, never()).save(any());
    }

    @Test
    @DisplayName("refuse un mot de passe trop court")
    void rejectsAWeakPassword() {
        RegisterRequest shortPassword =
                new RegisterRequest("Ron", "Malvaux", "ron@pmt.fr", "court");

        assertThrows(WeakPasswordException.class, () -> authService.register(shortPassword));

        verify(usersRepository, never()).save(any());
    }

    @Test
    @DisplayName("le mot de passe n'apparait pas dans toString()")
    void neverLeaksThePasswordInToString() {
        when(usersRepository.existsByEmail(any())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn(HASH);
        when(usersRepository.save(any(Users.class))).thenAnswer(i -> i.getArgument(0));

        Users user = authService.register(request("ron@pmt.fr"));

        assertTrue(!user.toString().contains(HASH));
        assertTrue(!user.toString().contains("motdepasse123"));
    }
}
