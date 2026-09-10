package fr.techcrud.pmt_api.model;

import fr.techcrud.pmt_api.exception.WeakPasswordException;

/**
 * Objet-valeur : un mot de passe EN CLAIR, conforme a la politique metier.
 *
 * Jamais persiste — il n'a donc pas de convertisseur JPA. Il existe pour deux
 * raisons : porter la regle de longueur, et masquer sa valeur dans toString()
 * pour qu'un mot de passe en clair ne finisse jamais dans un fichier de log.
 */
public record RawPassword(String value) {

    private static final int MIN_LENGTH = 8;

    public RawPassword {
        if (value == null || value.length() < MIN_LENGTH) {
            throw new WeakPasswordException(
                    "Le mot de passe doit faire au moins " + MIN_LENGTH + " caracteres");
        }
    }

    @Override
    public String toString() {
        return "RawPassword[****]";
    }
}
