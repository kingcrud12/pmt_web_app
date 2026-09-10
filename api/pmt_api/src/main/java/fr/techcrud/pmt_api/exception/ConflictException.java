package fr.techcrud.pmt_api.exception;

/**
 * L'action entre en conflit avec l'etat actuel de la ressource.
 * Traduit en 409 par GlobalExceptionHandler.
 */
public class ConflictException extends BusinessException {

    public ConflictException(String message) {
        super(message);
    }
}
