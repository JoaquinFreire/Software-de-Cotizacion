using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Application.DTOs
{
    public class UserRole
    {
        public int id { get; set; }  // ID del rol
        public string? role_name { get; set; }  // Nombre del rol (Ej: "manager", "coordinator")
    }
}