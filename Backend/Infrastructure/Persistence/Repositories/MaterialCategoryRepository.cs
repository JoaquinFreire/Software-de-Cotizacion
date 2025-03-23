using Microsoft.EntityFrameworkCore;  // Necesario para ToListAsync()
using Domain.Entities;
using Domain.Repositories;

namespace Infrastructure.Persistence.Repositories;

// Implementación del repositorio de categorías de materiales
public class MaterialCategoryRepository : IMaterialCategoryRepository
{
    private readonly AppDbContext _context; // Contexto de la base de datos

    public MaterialCategoryRepository(AppDbContext context)
    {
        _context = context; // Se inyecta el contexto de la base de datos
    }

    // Obtiene todas las categorías de materiales
    public async Task<IEnumerable<MaterialCategory>> GetAllAsync()
    {
        return await _context.MaterialCategories.ToListAsync(); // Devuelve todas las categorías en una lista
    }
}
