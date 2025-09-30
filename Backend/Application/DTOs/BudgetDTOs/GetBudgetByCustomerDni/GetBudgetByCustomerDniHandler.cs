using MediatR;
using AutoMapper;
using Domain.Repositories;

namespace Application.DTOs.BudgetDTOs.GetBudgetByCustomerDni
{
    public class GetBudgetByCustomerDniHandler : IRequestHandler<GetBudgetByCustomerDniQuery, List<GetBudgetByIdBudgetDTO>>
    {
        private readonly IBudgetRepository _budgetRepository;
        private readonly IMapper _mapper;
        public GetBudgetByCustomerDniHandler(IBudgetRepository budgetRepository, IMapper mapper)
        {
            _budgetRepository = budgetRepository;
            _mapper = mapper;
        }
        public async Task<List<GetBudgetByIdBudgetDTO>> Handle(GetBudgetByCustomerDniQuery request, CancellationToken cancellationToken)
        {
            var budgets = await _budgetRepository.GetBudgetsByCustomerDniAsync(request.dni);
            return _mapper.Map<List<GetBudgetByIdBudgetDTO>>(budgets);
        }
    }
}
