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

    // Método asíncrono para obtener todos los usuarios
    public async Task<IEnumerable<User>> GetAllAsync()
    {
        return await _context.Users.Include(u => u.role).ToListAsync();
    }

    // Método asíncrono para obtener un usuario por su legajo
    public async Task<User?> GetByLegajoAsync(string legajo)
    {
        return await _context.Users
            .Include(u => u.role)  // 🔹 Asegura que el usuario tenga su rol cargado
            .FirstOrDefaultAsync(u => u.legajo == legajo);
    }

    // Método asíncrono para obtener un usuario por su ID
    public async Task<User?> GetByIdAsync(int id)
    {
        return await _context.Users
            .Include(u => u.role)
            .FirstOrDefaultAsync(u => u.id == id);
    }

    // Método asíncrono para agregar un nuevo usuario
    public async Task AddAsync(User user)
    {
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
    }

    // Método asíncrono para actualizar un usuario existente
    public async Task UpdateAsync(User user)
    {
        _context.Users.Update(user);
        await _context.SaveChangesAsync();
    }

    // Método asíncrono para eliminar un usuario por su ID
    public async Task DeleteAsync(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user != null)
        {
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
        }
    }

    // Método asíncrono para obtener un usuario por su correo electrónico
    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.mail == email);
    }

    // Método asíncrono para obtener un usuario por su DNI
    public async Task<User?> GetByDniAsync(string dni)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.legajo == dni);
    }
}
