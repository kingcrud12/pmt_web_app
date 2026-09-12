package fr.techcrud.pmt_api.repositories;

import fr.techcrud.pmt_api.entities.Users;
import fr.techcrud.pmt_api.model.Email;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UsersRepository extends JpaRepository<Users, UUID> {
    Optional<Users> findByEmail(Email email);

    boolean existsByEmail(Email email);
}
