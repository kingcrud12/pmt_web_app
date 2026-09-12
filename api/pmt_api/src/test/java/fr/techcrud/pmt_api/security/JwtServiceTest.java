package fr.techcrud.pmt_api.security;

import fr.techcrud.pmt_api.entities.Users;
import fr.techcrud.pmt_api.model.Email;
import fr.techcrud.pmt_api.model.HashedPassword;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DisplayName("JwtService")
class JwtServiceTest {

    private static final String SECRET = "secret-de-test-unitaire-32-caracteres-minimum";

    private JwtService jwtService;
    private JwtDecoder decoder;
    private Users user;

    @BeforeEach
    void setUp() {
        SecretKey key = new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        jwtService = new JwtService(NimbusJwtEncoder.withSecretKey(key).build(), 3600);
        decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
        user = Users.create("Alice", "Durand", new Email("alice@pmt.fr"),
                new HashedPassword("$2a$10$" + "x".repeat(53)));
    }

    @Test
    @DisplayName("le sujet du jeton est l'identifiant de l'utilisateur")
    void subjectIsUserId() {
        Jwt jwt = decoder.decode(jwtService.generateToken(user));
        assertEquals(user.getId().toString(), jwt.getSubject());
    }

    @Test
    @DisplayName("le jeton porte l'email mais JAMAIS le mot de passe")
    void carriesEmailNeverPassword() {
        Jwt jwt = decoder.decode(jwtService.generateToken(user));

        assertEquals("alice@pmt.fr", jwt.getClaimAsString("email"));
        assertTrue(jwt.getClaims().keySet().stream().noneMatch(k -> k.contains("password")));
        assertTrue(jwt.getTokenValue().length() < 600);
    }

    @Test
    @DisplayName("le jeton ne porte aucun role de projet : les roles changent, pas le jeton")
    void carriesNoProjectRole() {
        Jwt jwt = decoder.decode(jwtService.generateToken(user));

        assertTrue(jwt.getClaims().keySet().stream()
                .noneMatch(k -> k.equalsIgnoreCase("role") || k.equalsIgnoreCase("roles")));
    }

    @Test
    @DisplayName("l'expiration suit la duree configuree")
    void expiresAfterConfiguredDuration() {
        Jwt jwt = decoder.decode(jwtService.generateToken(user));

        assertNotNull(jwt.getExpiresAt());
        long duree = jwt.getExpiresAt().getEpochSecond() - jwt.getIssuedAt().getEpochSecond();
        assertEquals(3600, duree);
        assertTrue(jwt.getExpiresAt().isAfter(Instant.now()));
        assertEquals(3600, jwtService.getExpirationSeconds());
    }

    @Test
    @DisplayName("un jeton signe avec une autre cle est rejete")
    void rejectsTokenSignedWithAnotherKey() {
        SecretKey autre = new SecretKeySpec(
                "une-tout-autre-cle-de-32-caracteres-minimum".getBytes(StandardCharsets.UTF_8),
                "HmacSHA256");
        JwtDecoder autreDecodeur = NimbusJwtDecoder.withSecretKey(autre)
                .macAlgorithm(MacAlgorithm.HS256).build();

        String jeton = jwtService.generateToken(user);

        assertThrows(Exception.class, () -> autreDecodeur.decode(jeton));
    }
}
