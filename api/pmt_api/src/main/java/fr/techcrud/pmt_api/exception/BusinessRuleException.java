package fr.techcrud.pmt_api.exception;

/**
 * Une regle metier est violee alors que la requete est syntaxiquement valide.
 * Traduit en 400.
 */
public class BusinessRuleException extends BusinessException {

    public BusinessRuleException(String message) {
        super(message);
    }
}
