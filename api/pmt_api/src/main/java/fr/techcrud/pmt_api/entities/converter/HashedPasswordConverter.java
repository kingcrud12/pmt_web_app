package fr.techcrud.pmt_api.entities.converter;

import fr.techcrud.pmt_api.model.HashedPassword;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

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
