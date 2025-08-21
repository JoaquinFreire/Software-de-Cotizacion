namespace Application.DTOs.UserDTOs.CreateUser;

public class CreateUserDTO
{
    public required string name { get; set; } // Nombre del usuario
    public required string lastName { get; set; } // Apellido del usuario
    public string? legajo { get; set; } // Identificador único para login,
    public string? password_hash { get; set; } // Contraseña encriptada, opcional
    public required int role_id { get; set; } // Clave foránea hacia UserRole
    public required string mail { get; set; } // Correo electrónico del usuario
}
