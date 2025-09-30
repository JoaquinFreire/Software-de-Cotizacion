using MediatR;
using Domain.Repositories;

namespace Application.DTOs.TimeLineBudgetReportDTOs.CustomerList
{
    public class CustomerListHandler : IRequestHandler<CustomerListQuery, List<CustomerListDTO>>
    {
        private readonly IQuotationRepository _quotationRepository;
        private readonly IBudgetRepository _budgetRepository;

        public CustomerListHandler(
            IQuotationRepository quotationRepository,
            IBudgetRepository budgetRepository)
        {
            _quotationRepository = quotationRepository;
            _budgetRepository = budgetRepository;
        }

        public async Task<List<CustomerListDTO>> Handle(CustomerListQuery request, CancellationToken cancellationToken)
        {
            var quotations = await _quotationRepository.GetForCustomerReportAsync(
                request.FromDate,
                request.ToDate,
                request.StatusFilter,
                request.CustomerName,
                request.SearchTerm,
                cancellationToken);

            // Agrupar por cliente y calcular estadísticas
            var clientReports = quotations
                .GroupBy(q => q.CustomerId)
                .Select(g => new CustomerListDTO
                {
                    id = g.Key,
                    name = g.First().Customer?.name ?? "",
                    lastname = g.First().Customer?.lastname ?? "",
                    dni = g.First().Customer?.dni ?? "",
                    mail = g.First().Customer?.mail ?? "",
                    TotalQuotations = g.Count(),
                    AcceptedQuotations = g.Count(q => q.Status.ToLower() == "accepted"),
                    PendingQuotations = g.Count(q => q.Status.ToLower() == "pending"),
                    RejectedQuotations = g.Count(q => q.Status.ToLower() == "rejected"),
                    TotalAmount = g.Sum(q => q.TotalPrice),
                    LastQuotationDate = g.Max(q => q.CreationDate),
                    PredominantStatus = g.GroupBy(q => q.Status)
                        .OrderByDescending(g2 => g2.Count())
                        .First().Key
                })
                .OrderByDescending(c => c.AcceptedQuotations)
                .ThenByDescending(c => c.TotalQuotations)
                .ToList();

            return clientReports;
        }
    }
}
