using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Domain.Entities;

// Representa la tabla 'user' en la base de datos
public class User
{
    [BsonIgnore][JsonIgnore]
    public int id { get; set; }  // ID del usuario
    [BsonElement("name")]
    public string name { get; set; }  // Nombre
    [BsonElement("lastName")]
    public string lastname { get; set; }  // Apellido
    //Agregar mail
    [BsonIgnore][JsonIgnore]
    public string Legajo { get; set; } = string.Empty;  // Identificador único para login
    [BsonIgnore][JsonIgnore]
    public string password_hash { get; set; } = string.Empty;  // Contraseña encriptada
    [BsonIgnore][JsonIgnore]
    public int role_id { get; set; }  // Clave foránea hacia UserRole
    [BsonIgnore][JsonIgnore]
    public UserRole role { get; set; }  // Relación con UserRole (navegación)

    public User() { }  // Constructor vacío necesario para Entity Framework

}

