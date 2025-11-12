using Domain.Entities;
using Domain.Repositories;
using MediatR;

namespace Application.DTOs.BudgetDTOs.GetBudgetsByUserAndDate
{
    public class GetBudgetByDateAndUserHandler : IRequestHandler<GetBudgetByDateAndUserQuery, List<Budget>>
    {
        private readonly IBudgetRepository _budgetRepository;

        public GetBudgetByDateAndUserHandler(IBudgetRepository budgetRepository)
        {
            _budgetRepository = budgetRepository;
        }

        public async Task<List<Budget>> Handle(GetBudgetByDateAndUserQuery request, CancellationToken cancellationToken)
        {
            var allBudgets = await _budgetRepository.GetAllAsync();

            // Agregar logs para debug
            Console.WriteLine($"=== DEBUG GetBudgetsByDateAndUser ===");
            Console.WriteLine($"Buscando: {request.UserName} {request.UserLastName}");
            Console.WriteLine($"Desde: {request.FromDate} hasta: {request.ToDate}");
            Console.WriteLine($"Total budgets en BD: {allBudgets.Count}");

            var filteredBudgets = allBudgets.Where(b =>
            {
                // Validar fecha - usar creationDate directamente
                var isValidDate = b.creationDate >= request.FromDate && b.creationDate <= request.ToDate;

                // Validar usuario - acceder directamente a las propiedades
                var isValidUser = b.user != null &&
                                 b.user.name != null &&
                                 b.user.lastName != null &&
                                 b.user.name.Equals(request.UserName, StringComparison.OrdinalIgnoreCase) &&
                                 b.user.lastName.Equals(request.UserLastName, StringComparison.OrdinalIgnoreCase);

                // Log para cada budget
                Console.WriteLine($"Budget {b.budgetId}:");
                Console.WriteLine($"  Fecha: {b.creationDate}");
                Console.WriteLine($"  Quotator: {b.user?.name} {b.user?.lastName}");
                Console.WriteLine($"  Fecha válida: {isValidDate}");
                Console.WriteLine($"  Usuario válido: {isValidUser}");

                return isValidDate && isValidUser;
            }).ToList();

            Console.WriteLine($"Total coincidencias encontradas: {filteredBudgets.Count}");
            Console.WriteLine($"=== FIN DEBUG ===");

            return filteredBudgets;
        }
    }
}