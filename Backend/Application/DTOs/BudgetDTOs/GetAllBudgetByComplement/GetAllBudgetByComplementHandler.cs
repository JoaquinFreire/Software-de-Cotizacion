using MediatR;
using Application.DTOs.BudgetDTOs.GetBudget;
using Domain.Repositories;
using AutoMapper;

namespace Application.DTOs.BudgetDTOs.GetAllBudgetByComplement
{
    public class GetAllBudgetByComplementHandler : IRequestHandler<GetAllBudgetByComplementQuery, List<GetBudgetByIdBudgetDTO>>
    {
        private readonly IBudgetRepository _budgetRepository;
        private readonly IMapper _mapper;
        public GetAllBudgetByComplementHandler(IBudgetRepository budgetRepository, IMapper mapper)
        {
            _budgetRepository = budgetRepository;
            _mapper = mapper;
        }
        public async Task<List<GetBudgetByIdBudgetDTO>> Handle(GetAllBudgetByComplementQuery request, CancellationToken cancellationToken)
        {
            var allBudgets = await _budgetRepository.GetAllAsync();
            var budgetsWithComplements = allBudgets.Where(b => b.Complement != null && b.Complement.Count > 0).ToList();
            var filteredBudgets = budgetsWithComplements.Where(b => b.creationDate >= request.FromDate && b.creationDate <= request.ToDate).ToList();        
            return _mapper.Map<List<GetBudgetByIdBudgetDTO>>(budgetsWithComplements);
        }
    }
} 