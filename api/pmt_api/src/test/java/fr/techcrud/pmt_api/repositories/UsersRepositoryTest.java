package fr.techcrud.pmt_api.repositories;

import fr.techcrud.pmt_api.entities.Users;
import fr.techcrud.pmt_api.model.Email;
import fr.techcrud.pmt_api.model.HashedPassword;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Le seul test du projet qui exige MySQL. Lance d'abord :
 *   docker compose up -d
 *
 * Il verifie ce que les tests unitaires ne peuvent pas voir : que les
 * convertisseurs JPA fonctionnent dans les deux sens, et que l'UUID est bien
 * ecrit en CHAR(36) et non en binaire — le bug corrige par @JdbcTypeCode.
 *
 * @DataJpaTest est transactionnel : tout est annule a la fin, ta base de dev
 * n'est pas polluee.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Tag("integration")
@DisplayName("UsersRepository (MySQL requis)")
class UsersRepositoryTest {

    @Autowired
    private UsersRepository usersRepository;

    private static Users newUser(String email) {
        return Users.create("Ron", "Malvaux", new Email(email),
                new HashedPassword("$2a$10$" + "x".repeat(53)));
    }

    @Test
    @DisplayName("enregistre puis relit un utilisateur a l'identique")
    void savesAndReloadsIdentically() {
        Users expected = newUser("repo-test@pmt.fr");

        usersRepository.saveAndFlush(expected);
        Optional<Users> reloaded = usersRepository.findByEmail(new Email("repo-test@pmt.fr"));

        assertTrue(reloaded.isPresent());
        assertEquals(expected.getId(), reloaded.get().getId());
        assertEquals(expected.getFirstName(), reloaded.get().getFirstName());
        assertEquals(expected.getEmail(), reloaded.get().getEmail());
        assertEquals(expected.getPassword(), reloaded.get().getPassword());
    }

    @Test
    @DisplayName("l'UUID est stocke en CHAR(36) et non en binaire")
    void storesTheUuidAsChar36() {
        Users user = newUser("uuid-test@pmt.fr");

        usersRepository.saveAndFlush(user);
        Optional<Users> reloaded = usersRepository.findByEmail(new Email("uuid-test@pmt.fr"));

        assertTrue(reloaded.isPresent());
        assertEquals(user.getId(), reloaded.get().getId());
        assertEquals(36, reloaded.get().getId().toString().length());
    }

    @Test
    @DisplayName("le convertisseur Email trouve la ligne quelle que soit la casse saisie")
    void appliesTheEmailConverter() {
        usersRepository.saveAndFlush(newUser("casse-test@pmt.fr"));

        // new Email(...) normalise en minuscules avant que JPA ne convertisse
        assertTrue(usersRepository.findByEmail(new Email("CASSE-TEST@PMT.FR")).isPresent());
    }

    @Test
    @DisplayName("existsByEmail repond vrai apres enregistrement, faux avant")
    void detectsAnExistingEmail() {
        Email email = new Email("doublon-test@pmt.fr");

        assertFalse(usersRepository.existsByEmail(email));
        usersRepository.saveAndFlush(newUser(email.value()));
        assertTrue(usersRepository.existsByEmail(email));
    }

    @Test
    @DisplayName("findByEmail renvoie vide pour un inconnu")
    void returnsEmptyForUnknownEmail() {
        assertTrue(usersRepository.findByEmail(new Email("jamais-vu@pmt.fr")).isEmpty());
    }
}
