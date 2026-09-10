package fr.techcrud.pmt_api.model;

import fr.techcrud.pmt_api.exception.InvalidEmailException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DisplayName("Email")
class EmailTest {

    @Test
    @DisplayName("Un utilisateur fournit un email au format invalide")
    void rejectsAMalformedEmail() {
        InvalidEmailException thrown = assertThrows(
                InvalidEmailException.class,
                () -> new Email("wrongemail"));

        assertEquals("Format d'email invalide : wrongemail", thrown.getMessage());
    }
}
