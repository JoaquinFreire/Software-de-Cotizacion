using MediatR;
using System;

namespace Application.DTOs.QuotationDTOs;

public class GetQuotationsByPeriodAndLocationQuery : IRequest<List<QuotationWithWorkPlaceDTO>>
{
    public DateTime From { get; set; }
    public DateTime To { get; set; }
    public string Location { get; set; }
}
