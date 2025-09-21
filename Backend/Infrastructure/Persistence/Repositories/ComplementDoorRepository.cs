using Domain.Entities;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories
{
    public class ComplementDoorRepository : IComplementDoorRepository
    {
        private readonly AppDbContext _context;

        public ComplementDoorRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ComplementDoor>> GetAllAsync()
        {
            return await _context.ComplementDoors.ToListAsync();
        }

        public async Task<ComplementDoor?> GetByIdAsync(int id)
        {
            return await _context.ComplementDoors.FindAsync(id);
        }

        public async Task AddAsync(ComplementDoor door)
        {
            _context.ComplementDoors.Add(door);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(ComplementDoor door)
        {
            _context.ComplementDoors.Update(door);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var entity = await _context.ComplementDoors.FindAsync(id);
            if (entity != null)
            {
                _context.ComplementDoors.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }

        // Nueva: búsqueda por texto (contains, case-insensitive)
        public async Task<IEnumerable<ComplementDoor>> SearchByNameAsync(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return Enumerable.Empty<ComplementDoor>();
            var lower = text.ToLower();
            return await _context.ComplementDoors
                .Where(d => EF.Functions.Like(d.name.ToLower(), $"%{lower}%"))
                .ToListAsync();
        }
    }
}
