using Domain.Entities;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

public class WorkPlaceRepository : IWorkPlaceRepository
{
    private readonly AppDbContext _context;

    public WorkPlaceRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<WorkPlace>> GetAllAsync()
    {
        return await _context.WorkPlaces.ToListAsync();
    }

    public async Task<WorkPlace?> GetByIdAsync(int id)
    {
        return await _context.WorkPlaces.FindAsync(id);
    }

    public async Task AddAsync(WorkPlace workPlace)
    {
        await _context.WorkPlaces.AddAsync(workPlace);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(WorkPlace workPlace)
    {
        _context.WorkPlaces.Update(workPlace);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var workPlace = await GetByIdAsync(id);
        if (workPlace != null)
        {
            _context.WorkPlaces.Remove(workPlace);
            await _context.SaveChangesAsync();
        }
    }
}
