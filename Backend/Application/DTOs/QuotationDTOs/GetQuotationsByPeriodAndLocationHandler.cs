namespace Application.DTOs.QuotationDTOs;

using MediatR;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;

public class GetQuotationsByPeriodAndLocationHandler : IRequestHandler<GetQuotationsByPeriodAndLocationQuery, List<QuotationWithWorkPlaceDTO>>
{
    private readonly IQuotationRepository _quotationRepository;

    public GetQuotationsByPeriodAndLocationHandler(IQuotationRepository quotationRepository)
    {
        _quotationRepository = quotationRepository;
    }

    public async Task<List<QuotationWithWorkPlaceDTO>> Handle(GetQuotationsByPeriodAndLocationQuery request, CancellationToken cancellationToken)
    {
        var query = _quotationRepository.Query()
            .Include(q => q.WorkPlace)
                .ThenInclude(wp => wp.WorkType) // Incluye el tipo de obra
            .Include(q => q.Customer)
            .Where(q => q.CreationDate >= request.From && q.CreationDate <= request.To);

        if (!string.IsNullOrEmpty(request.Location))
        {
            query = query.Where(q => q.WorkPlace != null && q.WorkPlace.location.StartsWith(request.Location));
        }

        var quotations = await query.ToListAsync(cancellationToken);

        return quotations.Select(q => new QuotationWithWorkPlaceDTO
        {
            Id = q.Id,
            CreationDate = q.CreationDate,
            LastEdit = q.LastEdit,
            TotalPrice = q.TotalPrice,
            Status = q.Status,
            WorkPlaceId = q.WorkPlaceId,
            WorkPlace = q.WorkPlace == null ? null : new WorkPlaceDTO
            {
                Id = q.WorkPlace.id,
                Name = q.WorkPlace.name,
                Location = q.WorkPlace.location,
                Address = q.WorkPlace.address,
                WorkTypeId = q.WorkPlace.workTypeId,
            },
            Customer = q.Customer == null ? null : new CustomerDTO
            {
                Id = q.Customer.id,
                Name = q.Customer.name,
                Lastname = q.Customer.lastname,
                Tel = q.Customer.tel,
                Mail = q.Customer.mail,
                Address = q.Customer.address
            }
        }).ToList();
    }
}
