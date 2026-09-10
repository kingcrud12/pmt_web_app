package fr.techcrud.pmt_api.dto;

/**
 * Reponse de connexion.
 *
 * Le jeton est renvoye dans le CORPS, pas dans un cookie : c'est au client de
 * l'attacher en en-tete Authorization. Le navigateur ne l'enverra donc jamais
 * de lui-meme, ce qui rend le CSRF impossible par construction.
 */
public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresInSeconds,
        UserResponse user
) {
    public static LoginResponse of(String token, long expiresIn, UserResponse user) {
        return new LoginResponse(token, "Bearer", expiresIn, user);
    }
}
