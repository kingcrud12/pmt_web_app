package fr.techcrud.pmt_api.exception;

public class InvalidCredentialsException extends BusinessException {
    public InvalidCredentialsException() {
        super("Identifiants invalides");
    }
}
