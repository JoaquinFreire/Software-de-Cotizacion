using Domain.Entities;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories
{
    public class AlumTreatmentRepository : IAlumTreatmentRepository
    {
        private readonly AppDbContext _context;

        public AlumTreatmentRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<AlumTreatment>> GetAllAsync()
            => await _context.AlumTreatments.ToListAsync();

        public async Task<AlumTreatment?> GetByIdAsync(int id)
            => await _context.AlumTreatments.FindAsync(id);

        public async Task AddAsync(AlumTreatment treatment)
        {
            _context.AlumTreatments.Add(treatment);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(AlumTreatment treatment)
        {
            _context.AlumTreatments.Update(treatment);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var entity = await _context.AlumTreatments.FindAsync(id);
            if (entity != null)
            {
                _context.AlumTreatments.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }
    }
}
