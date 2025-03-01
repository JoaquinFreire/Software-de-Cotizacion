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
        quotation.LastEdit = DateTime.UtcNow;  // Asigna la fecha actual
        quotation.CreationDate = DateTime.UtcNow;  // Asigna la fecha de creación
        _context.Quotations.Add(quotation);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Quotation quotation)
    {
        quotation.LastEdit = DateTime.UtcNow;  // Actualizar timestamp
        _context.Entry(quotation).State = EntityState.Modified;  // Actualizar estado
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var quotation = await GetByIdAsync(id);
        if (quotation == null)
        {
            throw new KeyNotFoundException($"Quotation with ID {id} not found.");
        }

        _context.Quotations.Remove(quotation);
        await _context.SaveChangesAsync();
    }
}
