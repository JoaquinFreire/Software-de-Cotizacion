using Domain.Entities;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Domain.Repositories
{
    public interface IQuotationRepository
    {
        Task<IEnumerable<Quotation>> GetAllAsync();
        Task<Quotation?> GetByIdAsync(int id);
        Task AddAsync(Quotation quotation);
        Task UpdateAsync(Quotation quotation);
        Task DeleteAsync(int id);
        Task<IEnumerable<Quotation>> GetByPeriodAsync(DateTime from, DateTime to);
        IQueryable<Quotation> Query();
        Task<IEnumerable<Quotation>> AdvancedSearchAsync(
            DateTime? from = null,
            DateTime? to = null,
            string? status = null,
            decimal? approxTotalPrice = null,
            DateTime? lastEditFrom = null,
            int? userId = null,
            string? customerDni = null
        );
    }
}
