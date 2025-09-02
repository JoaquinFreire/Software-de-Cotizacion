using Domain.Entities;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

public class OpeningConfigurationRepository : IOpeningConfigurationRepository
{
    private readonly AppDbContext _context;

    public OpeningConfigurationRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Opening_Configuration>> GetAllAsync()
    {
        return await _context.Opening_Configurations.ToListAsync();
    }
}
