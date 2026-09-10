package fr.techcrud.pmt_api.model;

/**
 * Objet-valeur : un mot de passe DEJA HACHE.
 *
 * C'est le type qui empeche la faute la plus grave du projet. Comme Users
 * exige un HashedPassword et qu'on ne peut en construire un qu'a partir de 60
 * caracteres, enregistrer un mot de passe en clair par distraction ne compile
 * pas.
 *
 * Un hachage BCrypt fait toujours exactement 60 caracteres.
 */
public record HashedPassword(String value) {

    private static final int BCRYPT_LENGTH = 60;

    public HashedPassword {
        if (value == null) {
            throw new IllegalArgumentException("Le hachage est obligatoire");
        }
        if (value.length() != BCRYPT_LENGTH) {
            throw new IllegalArgumentException(
                    "Un hachage BCrypt fait exactement " + BCRYPT_LENGTH
                            + " caracteres, recu : " + value.length());
        }
    }

    @Override
    public String toString() {
        return "HashedPassword[****]";
    }
}
