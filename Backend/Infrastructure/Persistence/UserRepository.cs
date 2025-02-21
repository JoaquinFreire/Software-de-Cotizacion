using Microsoft.EntityFrameworkCore;
using Domain.Entities;
using Domain.Repositories;

// Implementación de la interfaz IUserRepository para acceder a los datos de los usuarios
public class UserRepository : IUserRepository
{
    // Inyección de dependencia del contexto de base de datos (AppDbContext)
    private readonly AppDbContext _context;

    // Constructor que recibe el contexto de la base de datos e inicializa la variable _context
    public UserRepository(AppDbContext context)
    {
        _context = context;
    }

    // Método asíncrono para obtener un usuario por su legajo
    public async Task<User?> GetByLegajoAsync(string legajo)
    {
        return await _context.Users
            .Include(u => u.role)  // 🔹 Asegura que el usuario tenga su rol cargado
            .FirstOrDefaultAsync(u => u.Legajo == legajo);
    }
    public async Task<User?> GetByIdAsync(int id)  // 🔹 Implementación del nuevo método
    {
        return await _context.Users
            .Include(u => u.role)
            .FirstOrDefaultAsync(u => u.id == id);
    }
}
