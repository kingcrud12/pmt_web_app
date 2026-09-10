package fr.techcrud.pmt_api.services;

import fr.techcrud.pmt_api.dto.LoginRequest;
import fr.techcrud.pmt_api.dto.RegisterRequest;
import fr.techcrud.pmt_api.entities.Users;
import fr.techcrud.pmt_api.exception.EmailAlreadyUsedException;
import fr.techcrud.pmt_api.exception.InvalidCredentialsException;
import fr.techcrud.pmt_api.model.Email;
import fr.techcrud.pmt_api.model.HashedPassword;
import fr.techcrud.pmt_api.model.RawPassword;
import fr.techcrud.pmt_api.repositories.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * La logique metier de l'authentification.
 *
 * Regarde les imports : il n'y a AUCUN import de HTTP — pas de
 * HttpServletRequest, pas de ResponseEntity, pas de HttpStatus. C'est la seule
 * frontiere qu'on garde de l'hexagonal, et elle ne coute rien : ce service
 * pourrait etre appele depuis une commande CLI sans une ligne de changement.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    /**
     * Hachage BCrypt valide qui ne correspond a aucun compte.
     *
     * Sert uniquement a egaliser le temps de reponse : sans lui, un email
     * inconnu repondrait ~50 ms plus vite qu'un compte existant, ce qui permet
     * d'enumerer les utilisateurs inscrits en chronometrant.
     */
    private static final String DUMMY_HASH =
            "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

    private final UsersRepository usersRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public Users register(RegisterRequest request) {
        Email email = new Email(request.email());
        RawPassword rawPassword = new RawPassword(request.password());

        if (usersRepository.existsByEmail(email)) {
            throw new EmailAlreadyUsedException(email);
        }

        Users user = Users.create(
                request.firstName(),
                request.lastName(),
                email,
                new HashedPassword(passwordEncoder.encode(rawPassword.value()))
        );

        return usersRepository.save(user);
    }


    /**
     * Verifie les identifiants et renvoie l'utilisateur.
     *
     * La MEME exception est levee pour un email inconnu et un mot de passe
     * faux : les distinguer permettrait de savoir quelles adresses sont
     * inscrites.
     */
    @Transactional(readOnly = true)
    public Users login(LoginRequest request) {
        Optional<Users> found = usersRepository.findByEmail(new Email(request.email()));

        String referenceHash = found
                .map(u -> u.getPassword().value())
                .orElse(DUMMY_HASH);
        boolean passwordMatches = passwordEncoder.matches(request.password(), referenceHash);

        if (found.isEmpty() || !passwordMatches) {
            throw new InvalidCredentialsException();
        }

        return found.get();
    }
}
