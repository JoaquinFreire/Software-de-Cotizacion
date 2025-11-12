using MediatR;
using Domain.Entities;

namespace Application.DTOs.BudgetDTOs.GetBudgetsByUserAndDate
{
    public class GetBudgetByDateAndUserQuery : IRequest<List<Budget>>
    {
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public string UserName { get; set; }
        public string UserLastName { get; set; }
    }
}