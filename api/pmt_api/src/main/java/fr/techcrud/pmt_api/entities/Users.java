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

/**
 * L'utilisateur — MODELE UNIQUE de l'application.
 *
 * En architecture en couches, cette classe joue les deux roles a la fois :
 * elle decrit le stockage (annotations JPA) ET porte le modele metier (types
 * Email et HashedPassword). C'est le compromis assume : un seul objet, un seul
 * endroit a maintenir, au prix de la separation stricte que l'hexagonal
 * garantissait.
 */
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

    /**
     * @JdbcTypeCode(CHAR) est INDISPENSABLE.
     *
     * Par defaut, Hibernate 6+ envoie un UUID au pilote JDBC sous forme
     * BINAIRE (16 octets). Face a une colonne CHAR(36) textuelle, MySQL repond
     * « Incorrect string value ». columnDefinition ne corrige rien : il ne sert
     * qu'a generer le DDL, pas a encoder la valeur transmise.
     */
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

    /**
     * Fabrique un utilisateur qui n'existait pas encore.
     *
     * L'application possede l'identite et la date : c'est pourquoi il n'y a ni
     * @GeneratedValue ni @CreationTimestamp. Ca supprime au passage le
     * probleme des deux horloges (JVM et serveur MySQL) qui pouvaient se
     * contredire.
     */
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
