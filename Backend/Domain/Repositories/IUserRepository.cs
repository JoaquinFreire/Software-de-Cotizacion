using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Domain.Entities;

namespace Domain.Repositories;
public interface IUserRepository
{
    Task<User?> GetByLegajoAsync(string legajo);  // Obtiene un usuario por legajo
    Task<User?> GetByIdAsync(int id); // 🔹 método para obtener usuario por ID
    Task<IEnumerable<User>> GetAllAsync(); // Obtener todos los usuarios
    Task<IEnumerable<User>> GetAllActiveAsync(); // Obtener todos los usuarios activos
    Task AddAsync(User user); // Agregar un nuevo usuario
    Task UpdateAsync(User user); // Actualizar un usuario existente
    Task DeleteAsync(int id); // Eliminar un usuario por ID
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByDniAsync(string dni);
}
