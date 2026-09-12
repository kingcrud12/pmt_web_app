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

@Service
@RequiredArgsConstructor
public class AuthService {
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
