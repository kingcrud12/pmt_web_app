package fr.techcrud.pmt_api.entities.converter;

import fr.techcrud.pmt_api.model.HashedPassword;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Le pont entre HashedPassword et la colonne VARCHAR(250).
 *
 * ATTENTION : convertToEntityAttribute REVALIDE ce qui sort de la base. Une
 * ligne dont le mot de passe ne fait pas 60 caracteres levera une exception au
 * chargement. C'est voulu — c'est ce qui empeche des donnees corrompues de se
 * propager dans l'application.
 *
 * Consequence immediate : les deux utilisateurs de db/init/init.sql (13 et 38
 * caracteres) ne pourront pas etre relus tant que leurs hachages n'auront pas
 * ete regeneres.
 */
@Converter(autoApply = true)
public class HashedPasswordConverter implements AttributeConverter<HashedPassword, String> {

    @Override
    public String convertToDatabaseColumn(HashedPassword attribute) {
        return attribute == null ? null : attribute.value();
    }

    @Override
    public HashedPassword convertToEntityAttribute(String dbData) {
        return dbData == null ? null : new HashedPassword(dbData);
    }
}
