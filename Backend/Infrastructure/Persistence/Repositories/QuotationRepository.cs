using Domain.Entities;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;

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
     public IQueryable<Quotation> Query()
        {
            return _context.Quotations
                .Include(q => q.Customer)
                .Include(q => q.WorkPlace);
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

    public async Task<IEnumerable<Quotation>> AdvancedSearchAsync(
        DateTime? from = null,
        DateTime? to = null,
        string? status = null,
        decimal? approxTotalPrice = null,
        DateTime? lastEditFrom = null,
        int? userId = null,
        string? customerDni = null
    )
    {
        var query = _context.Quotations
            .Include(q => q.Customer)
            .Include(q => q.User)
            .Include(q => q.WorkPlace)
            .AsQueryable();

        if (from.HasValue)
            query = query.Where(q => q.CreationDate >= from.Value);
        if (to.HasValue)
            query = query.Where(q => q.CreationDate <= to.Value);
        if (!string.IsNullOrEmpty(status))
            query = query.Where(q => q.Status == status);
        if (approxTotalPrice.HasValue)
            query = query.Where(q => Math.Abs(q.TotalPrice - approxTotalPrice.Value) <= 100); // margen de $100, ajusta si quieres
        if (lastEditFrom.HasValue)
            query = query.Where(q => q.LastEdit >= lastEditFrom.Value);
        if (userId.HasValue)
            query = query.Where(q => q.UserId == userId.Value);
        if (!string.IsNullOrEmpty(customerDni))
            query = query.Where(q => q.Customer != null && q.Customer.dni == customerDni);

        return await query.ToListAsync();
    }

    public async Task<IEnumerable<Quotation>> GetForCustomerReportAsync(
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? status = null,
        string? customerName = null,
        string? searchTerm = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Quotations
            .Include(q => q.Customer)
            .Include(q => q.WorkPlace)
            .AsQueryable();

        if (fromDate.HasValue)
            query = query.Where(q => q.CreationDate >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(q => q.CreationDate <= toDate.Value);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(q => q.Status == status);

        if (!string.IsNullOrEmpty(customerName))
            query = query.Where(q =>
                (q.Customer!.name + " " + q.Customer!.lastname)
                .ToLower()
                .Contains(customerName.ToLower()));

        if (!string.IsNullOrEmpty(searchTerm))
            query = query.Where(q =>
                (q.Customer!.name + " " + q.Customer!.lastname).ToLower().Contains(searchTerm.ToLower()) ||
                q.Customer!.dni.Contains(searchTerm) ||
                q.WorkPlace!.name.ToLower().Contains(searchTerm.ToLower()));

        return await query.ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Quotation>> GetByCustomerIdAsync(
        int customerId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Quotations
            .Include(q => q.Customer)
            .Include(q => q.WorkPlace)
            .Where(q => q.CustomerId == customerId)
            .ToListAsync(cancellationToken);
    }

}
