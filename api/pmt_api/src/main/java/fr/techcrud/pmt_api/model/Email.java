package fr.techcrud.pmt_api.model;

import fr.techcrud.pmt_api.exception.InvalidEmailException;

import java.util.regex.Pattern;

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
