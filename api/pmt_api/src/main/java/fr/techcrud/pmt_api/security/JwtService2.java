package fr.techcrud.pmt_api.security;

import fr.techcrud.pmt_api.entities.Users;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;

import java.time.Instant;

@Service
public class JwtService2 {
    private final JwtEncoder jwtEncoder;
    private final long expirationSeconds;


    public JwtService2(JwtEncoder jwtEncoder, @Value("3600") long expirationSeconds) {
        this.jwtEncoder = jwtEncoder;
        this.expirationSeconds = expirationSeconds;
    }

    public String gernerateToken(Users users) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("pmt-api")
                .issuedAt(now)
                .expiresAt(now.plusSeconds(expirationSeconds))
                .subject(users.getId().toString())
                .claim("email", users.getEmail())
                .build();


        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    public long getExpirationSeconds() {
        return expirationSeconds;
    }

}
