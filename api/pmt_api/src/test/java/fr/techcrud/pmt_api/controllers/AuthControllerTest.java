package fr.techcrud.pmt_api.controllers;

import fr.techcrud.pmt_api.config.SecurityConfig;
import fr.techcrud.pmt_api.entities.Users;
import fr.techcrud.pmt_api.exception.EmailAlreadyUsedException;
import fr.techcrud.pmt_api.model.Email;
import fr.techcrud.pmt_api.model.HashedPassword;
import fr.techcrud.pmt_api.security.CurrentUser;
import fr.techcrud.pmt_api.security.JwtService;
import fr.techcrud.pmt_api.services.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
@Tag("integration")
@DisplayName("POST /api/auth/register")
class AuthControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private CurrentUser currentUser;

    private static final String VALID_BODY = """
            {
              "firstName": "Ron",
              "lastName": "Malvaux",
              "email": "ron@pmt.fr",
              "password": "motdepasse123"
            }
            """;

    private static Users aUser() {
        return new Users(
                UUID.fromString("f96471dc-c69d-43d7-b209-ed0bcbcc2f9e"),
                "Ron",
                "Malvaux",
                new Email("ron@pmt.fr"),
                new HashedPassword("$2a$10$" + "x".repeat(53)),
                Instant.parse("2026-01-01T10:00:00Z")
        );
    }

    @Test
    @DisplayName("renvoie 201 et le corps attendu")
    void returns201() throws Exception {
        when(authService.register(any())).thenReturn(aUser());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("f96471dc-c69d-43d7-b209-ed0bcbcc2f9e"))
                .andExpect(jsonPath("$.firstName").value("Ron"))
                .andExpect(jsonPath("$.email").value("ron@pmt.fr"));
    }

    @Test
    @DisplayName("n'expose JAMAIS le mot de passe dans la reponse")
    void neverReturnsThePassword() throws Exception {
        when(authService.register(any())).thenReturn(aUser());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    @DisplayName("traduit EmailAlreadyUsedException en 409")
    void translatesDuplicateTo409() throws Exception {
        when(authService.register(any()))
                .thenThrow(new EmailAlreadyUsedException(new Email("ron@pmt.fr")));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.path").value("/api/auth/register"));
    }

    @Test
    @DisplayName("renvoie 400 avec le detail par champ quand @Valid echoue")
    void returns400WithFieldErrors() throws Exception {
        String invalidBody = """
                {"firstName":"","lastName":"X","email":"pas-un-email","password":"court"}
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.firstName").exists())
                .andExpect(jsonPath("$.fields.email").exists())
                .andExpect(jsonPath("$.fields.password").exists());
    }

    @Test
    @DisplayName("un endpoint hors /api/auth exige un jeton (401)")
    void protectsEverythingElse() throws Exception {
        mockMvc.perform(post("/api/projects"))
                .andExpect(status().isUnauthorized());
    }
}
