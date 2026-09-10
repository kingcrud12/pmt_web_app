package fr.techcrud.pmt_api.exception;

/**
 * Identifiants refuses.
 *
 * Le message ne distingue JAMAIS « email inconnu » de « mauvais mot de passe » :
 * les differencier permettrait d'enumerer les comptes existants.
 */
public class InvalidCredentialsException extends BusinessException {

    public InvalidCredentialsException() {
        super("Identifiants invalides");
    }
}
