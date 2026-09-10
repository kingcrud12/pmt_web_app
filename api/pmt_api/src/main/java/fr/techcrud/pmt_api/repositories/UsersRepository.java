package fr.techcrud.pmt_api.repositories;

import fr.techcrud.pmt_api.entities.Users;
import fr.techcrud.pmt_api.model.Email;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

/**
 * Ton interface d'origine, avec une seule difference : les methodes prennent
 * un Email plutot qu'une String. Grace a EmailConverter, Spring Data sait
 * traduire le parametre vers la colonne.
 *
 * Benefice concret : findByEmail("nimportequoi") ne compile plus.
 */
public interface UsersRepository extends JpaRepository<Users, UUID> {

    Optional<Users> findByEmail(Email email);

    boolean existsByEmail(Email email);
}
