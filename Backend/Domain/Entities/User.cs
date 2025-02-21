using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Entities;

// Representa la tabla 'user' en la base de datos
public class User
{
    public int id { get; set; }  // ID del usuario
    public string name { get; set; }  // Nombre
    public string lastname { get; set; }  // Apellido
    public string Legajo { get; set; } = string.Empty;  // Identificador único para login
    public string password_hash { get; set; } = string.Empty;  // Contraseña encriptada
    public int role_id { get; set; }  // Clave foránea hacia UserRole
    public UserRole role { get; set; }  // Relación con UserRole (navegación)

    public User() { }  // Constructor vacío necesario para Entity Framework

}

