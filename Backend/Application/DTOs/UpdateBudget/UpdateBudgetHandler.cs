using MediatR;
using Application.Services;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;

namespace Application.DTOs.UpdateBudget
{
    public class UpdateBudgetHandler : IRequestHandler<UpdateBudgetCommand, Unit>
    {
        private readonly BudgetServices _budgetServices;
        private readonly IMapper _mapper;

        public UpdateBudgetHandler(BudgetServices budgetServices, IMapper mapper)
        {
            _budgetServices = budgetServices;
            _mapper = mapper;
        }

        public async Task<Unit> Handle(UpdateBudgetCommand request, CancellationToken cancellationToken)
        {
            var budgetEntity = _mapper.Map<Budget>(request.UpdatedBudget);
            await _budgetServices.UpdateBudgetAsync(request.BudgetId, budgetEntity);
            return Unit.Value;
        }
    }
}
