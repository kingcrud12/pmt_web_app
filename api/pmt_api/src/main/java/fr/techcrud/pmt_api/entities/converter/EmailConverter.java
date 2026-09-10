package fr.techcrud.pmt_api.entities.converter;

import fr.techcrud.pmt_api.model.Email;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Le pont entre l'objet-valeur Email et la colonne VARCHAR(250).
 *
 * C'est ce qui remplace le UserMapper de l'architecture hexagonale : au lieu
 * d'un mapper qui recopiait TOUS les champs a la main, JPA fait la traduction
 * champ par champ, automatiquement.
 *
 * autoApply = true : le convertisseur s'applique a tout attribut de type Email
 * dans toutes les entites, sans avoir a poser @Convert a chaque fois.
 */
@Converter(autoApply = true)
public class EmailConverter implements AttributeConverter<Email, String> {

    @Override
    public String convertToDatabaseColumn(Email attribute) {
        return attribute == null ? null : attribute.value();
    }

    @Override
    public Email convertToEntityAttribute(String dbData) {
        return dbData == null ? null : new Email(dbData);
    }
}
