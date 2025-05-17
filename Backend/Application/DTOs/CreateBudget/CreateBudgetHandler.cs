using Domain.Entities;
using AutoMapper;
using Application.Services;
using MediatR;

namespace Application.DTOs.CreateBudget
{
    public class CreateBudgetHandler : IRequestHandler<CreateBudgetCommand, string>
    {
        private readonly BudgetServices _budgetServices;
        private readonly IMapper _mapper;
        //Precios de referencia
        //Calculo cotización

        public CreateBudgetHandler(IMapper mapper, BudgetServices budgetServices)
        {
            _mapper = mapper;
            _budgetServices = budgetServices;
        }

        public async Task<string> Handle(CreateBudgetCommand request, CancellationToken cancellationToken)
        {
            var budget = _mapper.Map<Budget>(request.BudgetDTO);
            
            await _budgetServices.CreateBudgetAsync(budget);
            return budget.id;
        }
    }
}
