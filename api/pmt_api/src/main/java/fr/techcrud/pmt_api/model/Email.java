package fr.techcrud.pmt_api.model;

import fr.techcrud.pmt_api.exception.InvalidEmailException;

import java.util.regex.Pattern;

/**
 * Objet-valeur : une adresse email VALIDE.
 *
 * C'est la piece qu'on a gardee de l'architecture hexagonale, parce qu'elle
 * apporte une garantie que la discipline seule n'apporte pas : il est
 * IMPOSSIBLE de construire un Email invalide. Partout ou une methode recoit un
 * Email, le compilateur garantit que la valeur a ete verifiee.
 *
 * La normalisation en minuscules est une decision metier : elle correspond a
 * la collation utf8mb4_unicode_ci de la table users, qui traite deja
 * Ron@pmt.fr et ron@pmt.fr comme un doublon.
 */
public record Email(String value) {

    private static final int MAX_LENGTH = 250;

    private static final Pattern FORMAT =
            Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]{2,}$");

    public Email {
        if (value == null || value.isBlank()) {
            throw new InvalidEmailException("L'email est obligatoire");
        }
        value = value.trim().toLowerCase();

        if (value.length() > MAX_LENGTH) {
            throw new InvalidEmailException(
                    "L'email ne peut pas depasser " + MAX_LENGTH + " caracteres");
        }
        if (!FORMAT.matcher(value).matches()) {
            throw new InvalidEmailException("Format d'email invalide : " + value);
        }
    }

    @Override
    public String toString() {
        return value;
    }
}
