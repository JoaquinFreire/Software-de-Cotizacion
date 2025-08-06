using Application.DTOs.BudgetDTOs.GetBudget;
using AutoMapper;
using Domain.Repositories;
using MediatR;

public class GetBudgetByBudgetIdHandler : IRequestHandler<GetBudgetByBudgetIdQuery, GetBudgetByIdBudgetDTO>
{
    private readonly IBudgetRepository _budgetRepository;
    private readonly IMapper _mapper;

    public GetBudgetByBudgetIdHandler(IBudgetRepository budgetRepository, IMapper mapper)
    {
        _budgetRepository = budgetRepository;
        _mapper = mapper;
    }

    public async Task<GetBudgetByIdBudgetDTO> Handle(GetBudgetByBudgetIdQuery request, CancellationToken cancellationToken)
    {
        var budget = await _budgetRepository.GetByBudgetIdAsync(request.BudgetId);

        if (budget == null)
        {
            // Opcional: lanzar excepción o devolver null según cómo manejes errores
            throw new Exception($"No se encontró un presupuesto con el BudgetId: {request.BudgetId}");
        }

        return _mapper.Map<GetBudgetByIdBudgetDTO>(budget);
    }
}
