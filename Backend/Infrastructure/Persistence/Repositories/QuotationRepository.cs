using Domain.Entities;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

public class QuotationRepository : IQuotationRepository
{
    private readonly AppDbContext _context;

    public QuotationRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Quotation>> GetAllAsync()
    {
        return await _context.Quotations
            .Include(q => q.Customer)
            .Include(q => q.User)
            .Include(q => q.WorkPlace)
            .ToListAsync();
    }

    public async Task<Quotation?> GetByIdAsync(int id)
    {
        return await _context.Quotations
            .Include(q => q.Customer)
            .Include(q => q.User)
            .Include(q => q.WorkPlace)
            .FirstOrDefaultAsync(q => q.Id == id);
    }

    public async Task AddAsync(Quotation quotation)
    {
        try
        {
            quotation.LastEdit = DateTime.UtcNow;  // Asigna la fecha actual
            quotation.CreationDate = DateTime.UtcNow;  // Asigna la fecha de creación
            await _context.Quotations.AddAsync(quotation);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // Agrega más detalles de depuración
            Console.WriteLine("Error adding quotation: " + ex.Message);
            Console.WriteLine("Stack Trace: " + ex.StackTrace);
            throw;
        }
    }

    public async Task UpdateAsync(Quotation quotation)
    {
        try
        {
            quotation.LastEdit = DateTime.UtcNow;  // Actualizar timestamp
            _context.Entry(quotation).State = EntityState.Modified;  // Actualizar estado
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // Agrega más detalles de depuración
            Console.WriteLine("Error updating quotation: " + ex.Message);
            Console.WriteLine("Stack Trace: " + ex.StackTrace);
            throw;
        }
    }

    public async Task DeleteAsync(int id)
    {
        try
        {
            var quotation = await GetByIdAsync(id);
            if (quotation == null)
            {
                throw new KeyNotFoundException($"Quotation with ID {id} not found.");
            }

            _context.Quotations.Remove(quotation);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // Agrega más detalles de depuración
            Console.WriteLine("Error deleting quotation: " + ex.Message);
            Console.WriteLine("Stack Trace: " + ex.StackTrace);
            throw;
        }
    }

    public async Task<IEnumerable<Quotation>> GetByPeriodAsync(DateTime from, DateTime to)
{
    return await _context.Quotations
        .Include(q => q.Customer)
        .Include(q => q.User)
        .Include(q => q.WorkPlace)
        .Where(q => q.CreationDate >= from && q.CreationDate <= to)
        .ToListAsync();
}

}
