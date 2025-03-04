using Domain.Entities;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

public class WorkTypeRepository : IWorkTypeRepository
{
    private readonly AppDbContext _context;

    public WorkTypeRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<WorkType>> GetAllAsync()
    {
        return await _context.WorkTypes.ToListAsync();
    }
}
