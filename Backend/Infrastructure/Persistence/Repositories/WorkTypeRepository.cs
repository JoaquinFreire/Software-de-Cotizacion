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
        try
        {
            var workTypes = await _context.WorkTypes.ToListAsync();
            Console.WriteLine("WorkTypes in repository: " + workTypes.Count); // Verificar la cantidad de workTypes
            return workTypes;
        }
        catch (Exception ex)
        {
            // Agrega más detalles de depuración
            Console.WriteLine("Error in repository fetching work types: " + ex.Message);
            Console.WriteLine("Stack Trace: " + ex.StackTrace);
            throw;
        }
    }
}
