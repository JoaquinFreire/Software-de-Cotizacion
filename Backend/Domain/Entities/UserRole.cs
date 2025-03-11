using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace Domain.Entities
{
    // Representa la tabla 'user_role' en la base de datos
    [Table("user_role")]  // 🔹 Indica el nombre exacto de la tabla en MySQL
    public class UserRole
    {
        [BsonIgnore][JsonIgnore]
        public int id { get; set; }  // ID del rol
        [BsonIgnore][JsonIgnore]
        public string? role_name { get; set; }  // Nombre del rol (Ej: "manager", "coordinator")
    }
}
