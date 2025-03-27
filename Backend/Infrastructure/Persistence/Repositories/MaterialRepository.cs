/* using Domain.Entities;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

// Implementación del repositorio de materiales
public class MaterialRepository : IMaterialRepository
{
    private readonly AppDbContext _context; // Contexto de la base de datos

    public MaterialRepository(AppDbContext context)
    {
        _context = context; // Se inyecta el contexto de la base de datos
    }

    // Obtiene todos los materiales e incluye sus relaciones con MaterialType y MaterialCategory
    public async Task<IEnumerable<Material>> GetAllAsync()
    {
        return await _context.Materials
            .Include(m => m.type)                // Incluye el tipo de material
            .ThenInclude(t => t.category)        // Luego incluye la categoría del tipo de material
            .ToListAsync();                      // Convierte la consulta en una lista de materiales
    }

    // Obtiene un material por su ID, incluyendo su tipo y su categoría
    public async Task<Material?> GetByIdAsync(int id)
    {
        return await _context.Materials
            .Include(m => m.type)                // Incluye el tipo de material
            .ThenInclude(t => t.category)        // Luego incluye la categoría del tipo de material
            .FirstOrDefaultAsync(m => m.id == id); // Busca el material con el ID especificado
    }

     public async Task AddAsync(Material material)
    {
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Material material)
    {
        _context.Materials.Update(material);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var material = await _context.Materials.FindAsync(id);
        if (material != null)
        {
            _context.Materials.Remove(material);
            await _context.SaveChangesAsync();
        }
    }
}    */