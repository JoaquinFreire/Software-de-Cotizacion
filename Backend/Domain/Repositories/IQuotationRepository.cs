using Domain.Entities;
using System.Collections.Generic;
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
    }
}
