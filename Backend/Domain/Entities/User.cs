using MongoDB.Bson.Serialization.Attributes;

namespace Domain.Entities;

// Representa la tabla 'user' en la base de datos
public class User
{
    [BsonIgnore]
    public int id { get; set; }  // ID del usuario
    [BsonElement("name")]
    public string name { get; set; } = string.Empty;  // Nombre
    [BsonElement("lastName")]
    public string lastName { get; set; } = string.Empty;  // Apellido //cambie acá n por N
    [BsonIgnore]
    public string legajo { get; set; } = string.Empty; //le saqué la L mayus // Identificador único para login
    [BsonIgnore]
    public string password_hash { get; set; } = string.Empty;  // Contraseña encriptada
    [BsonIgnore]
    public int role_id { get; set; }  // Clave foránea hacia UserRole
    [BsonIgnore]
    public UserRole role { get; set; }
    [BsonElement("mail")]
    public string mail { get; set; } = string.Empty; 
                                                     // TODO : @Joaquin: Agregar Telefono
    // acá saqué el BsonIgnore, posible error con mongo TODO: @Joaquin: Ver si es necesario
    public int status { get; set; } = 1; // Nueva columna (0 = inactivo, 1 = activo)

    public User() { }  // Constructor vacío necesario para Entity Framework
}

