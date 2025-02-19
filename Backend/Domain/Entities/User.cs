using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Entities;

public class User
{
    public int id { get; set; }
    public string name { get; set; }
    public string lastname { get; set; }
    public string Legajo { get; set; } = string.Empty;
    public string password_hash { get; set; } = string.Empty;
    public int role_id { get; set; }  // Clave foránea
    public UserRole role { get; set; }  // Navegación

    public User() { }

    /*     public User(string name, string lastname, UserRole role)
    {
        this.name = name;
        this.lastname = lastname;
        this.role = role;
    } */

}

