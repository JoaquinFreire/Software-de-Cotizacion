using Domain.Entities;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public class QuotationServices
    {
        private readonly IQuotationRepository _repository;
        public QuotationServices(IQuotationRepository repository)
        {
            _repository = repository;
        }
        public Task<IEnumerable<Quotation>> GetAllAsync() { return _repository.GetAllAsync(); }
        public Task<Quotation?> GetByIdAsync(int id) { return _repository.GetByIdAsync(id); }
        public Task AddAsync(Quotation quotation) { return _repository.AddAsync(quotation); }
        public Task UpdateAsync(Quotation quotation) { return _repository.UpdateAsync(quotation); }
        public Task UpdateUserAsync(int id, int newUserId) { return _repository.UpdateUserAsync(id, newUserId); }
        public Task DeleteAsync(int id) { return _repository.DeleteAsync(id);}
        public Task<IEnumerable<Quotation>> GetByPeriodAsync(DateTime from, DateTime to) { return _repository.GetByPeriodAsync(from, to); }
        public IQueryable<Quotation> Query() { return _repository.Query(); }
        public Task<IEnumerable<Quotation>> AdvancedSearchAsync(
            DateTime? from = null,
            DateTime? to = null,
            string? status = null,
            decimal? approxTotalPrice = null,
            DateTime? lastEditFrom = null,
            int? userId = null,
            string? customerDni = null
        )
        { return _repository.AdvancedSearchAsync(from, to, status, approxTotalPrice, lastEditFrom, userId, customerDni); }

        public async Task<IEnumerable<Quotation>> GetForCustomerReportAsync(DateTime? fromDate = null,
        DateTime? toDate = null,
        string? status = null,
        string? customerName = null,
        string? searchTerm = null,
        CancellationToken cancellationToken = default) 
        { return await _repository.GetForCustomerReportAsync(fromDate, toDate, status, customerName, searchTerm, cancellationToken); }
        public async Task<IEnumerable<Quotation>> GetByCustomerIdAsync(int customerId, CancellationToken cancellationToken = default) 
        { return await _repository.GetByCustomerIdAsync(customerId, cancellationToken); }
    }
}
