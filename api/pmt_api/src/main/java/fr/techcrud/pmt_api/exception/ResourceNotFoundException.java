package fr.techcrud.pmt_api.exception;

/**
 * Ressource inexistante — ou invisible pour l'appelant.
 *
 * Choix delibere contre les failles IDOR : quand un utilisateur demande un
 * projet auquel il n'appartient pas, on renvoie 404 et non 403. Un 403
 * confirmerait que le projet EXISTE, ce qui permettrait de balayer les
 * identifiants pour cartographier les donnees des autres.
 */
public class ResourceNotFoundException extends BusinessException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
