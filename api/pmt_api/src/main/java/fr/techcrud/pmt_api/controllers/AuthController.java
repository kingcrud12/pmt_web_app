package fr.techcrud.pmt_api.controllers;

import fr.techcrud.pmt_api.dto.LoginRequest;
import fr.techcrud.pmt_api.dto.LoginResponse;
import fr.techcrud.pmt_api.dto.RegisterRequest;
import fr.techcrud.pmt_api.dto.UserResponse;
import fr.techcrud.pmt_api.entities.Users;
import fr.techcrud.pmt_api.security.CurrentUser;
import fr.techcrud.pmt_api.security.JwtService;
import fr.techcrud.pmt_api.services.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final JwtService jwtService;
    private final CurrentUser currentUser;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody RegisterRequest request) {
        Users user = authService.register(request);
        return UserResponse.from(user);
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        Users user = authService.login(request);
        String token = jwtService.generateToken(user);
        return LoginResponse.of(token, jwtService.getExpirationSeconds(), UserResponse.from(user));
    }

    @GetMapping("/me")
    public UserResponse me() {
        return UserResponse.from(currentUser.entity());
    }
}
