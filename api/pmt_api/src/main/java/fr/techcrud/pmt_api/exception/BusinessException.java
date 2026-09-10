package fr.techcrud.pmt_api.exception;

/**
 * Racine des erreurs metier.
 *
 * Aucune reference a HTTP : c'est GlobalExceptionHandler, dans la couche web,
 * qui traduira ces exceptions en codes de statut. Le service reste ignorant du
 * protocole — c'est la seule frontiere de l'hexagonal qu'on garde, et elle ne
 * coute aucun fichier supplementaire.
 */
public abstract class BusinessException extends RuntimeException {

    protected BusinessException(String message) {
        super(message);
    }
}
