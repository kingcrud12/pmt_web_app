package fr.techcrud.pmt_api.entities;

import fr.techcrud.pmt_api.model.Email;
import fr.techcrud.pmt_api.entities.converter.EmailConverter;
import fr.techcrud.pmt_api.entities.converter.HashedPasswordConverter;
import fr.techcrud.pmt_api.model.HashedPassword;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "users",
        uniqueConstraints = @UniqueConstraint(name = "uk_users_email", columnNames = "email")
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = "password")
public class Users {
    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", columnDefinition = "CHAR(36)", length = 36, updatable = false, nullable = false)
    @EqualsAndHashCode.Include
    private UUID id;

    @Column(name = "first_name", length = 250, nullable = false)
    private String firstName;

    @Column(name = "last_name", length = 250, nullable = false)
    private String lastName;

    @Convert(converter = EmailConverter.class)
    @Column(name = "email", length = 250, nullable = false, unique = true)
    private Email email;

    @Convert(converter = HashedPasswordConverter.class)
    @Column(name = "password", length = 250, nullable = false)
    private HashedPassword password;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public static Users create(String firstName,
                               String lastName,
                               Email email,
                               HashedPassword password) {
        return new Users(
                UUID.randomUUID(),
                firstName.trim(),
                lastName.trim(),
                email,
                password,
                Instant.now()
        );
    }
}
