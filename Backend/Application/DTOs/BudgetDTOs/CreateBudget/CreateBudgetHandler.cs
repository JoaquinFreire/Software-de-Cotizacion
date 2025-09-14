using Domain.Entities;
using Domain.Services;
using AutoMapper;
using Application.Services;
using MediatR;
using Application.Validators.BudgetValidation;

namespace Application.DTOs.BudgetDTOs.CreateBudget
{
    public class CreateBudgetHandler : IRequestHandler<CreateBudgetCommand, string>
    {
        private readonly BudgetServices _budgetServices;
        private readonly BudgetCalculator _budgetCalculator;
        private readonly IMapper _mapper;
        private readonly IBudgetValidator _budgetValidator;
        private readonly IApplicationBudgetValidator _applicationBudgetValidator;

        public CreateBudgetHandler(IMapper mapper, BudgetServices budgetServices, IBudgetValidator budgetValidator, IApplicationBudgetValidator applicationBudgetValidator, BudgetCalculator budgetCalculator)
        {
            _mapper = mapper;
            _budgetServices = budgetServices;
            _budgetValidator = budgetValidator;
            _applicationBudgetValidator = applicationBudgetValidator;
            _budgetCalculator = budgetCalculator;
        }

        public async Task<string> Handle(CreateBudgetCommand request, CancellationToken cancellationToken)
        {
            if (request.BudgetDTO == null)
            {
                throw new ArgumentNullException(nameof(request.BudgetDTO), "El objeto BudgetDTO no puede ser nulo.");
            }

            // Validación de la Cotización (Capa de aplicación)
            _applicationBudgetValidator.Validate(request.BudgetDTO);

            var budget = _mapper.Map<Budget>(request.BudgetDTO);

            //Validación de Cotización(Capa de logica de negocio)
            _budgetValidator.Validate(budget);

            //Calculo de total de la cotización
            await _budgetCalculator.CalculateBudgetTotal(budget);

            await _budgetServices.CreateBudgetAsync(budget);
            return budget.id;
        }
    }
}
