package fr.techcrud.pmt_api.exception;

/**
 * L'appelant a bien acces a la ressource, mais son role ne l'autorise pas a
 * faire CETTE action. Typiquement : un OBSERVER qui tente de creer une tache.
 *
 * A distinguer de ResourceNotFoundException : ici on peut repondre 403 sans
 * rien reveler, puisque l'appelant sait deja que la ressource existe.
 */
public class ForbiddenActionException extends BusinessException {

    public ForbiddenActionException(String message) {
        super(message);
    }
}
