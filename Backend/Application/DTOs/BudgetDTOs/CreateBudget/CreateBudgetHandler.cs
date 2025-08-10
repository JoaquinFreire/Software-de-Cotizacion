using Domain.Entities;
using AutoMapper;
using Application.Services;
using MediatR;
using Application.Validators;

namespace Application.DTOs.BudgetDTOs.CreateBudget
{
    public class CreateBudgetHandler : IRequestHandler<CreateBudgetCommand, string>
    {
        private readonly BudgetServices _budgetServices;
        private readonly IMapper _mapper;
        private readonly IBudgetValidator _budgetValidator;
        private readonly IApplicationBudgetValidator _applicationBudgetValidator;
        //Precios de referencia
        //Calculo cotización

        public CreateBudgetHandler(IMapper mapper, BudgetServices budgetServices, IBudgetValidator budgetValidator, IApplicationBudgetValidator applicationBudgetValidator)
        {
            _mapper = mapper;
            _budgetServices = budgetServices;
            _budgetValidator = budgetValidator;
            _applicationBudgetValidator = applicationBudgetValidator;
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

            await _budgetServices.CreateBudgetAsync(budget);
            return budget.id;
        }
    }
}
