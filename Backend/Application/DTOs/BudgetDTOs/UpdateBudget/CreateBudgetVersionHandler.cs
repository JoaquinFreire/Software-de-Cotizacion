using Application.DTOs.BudgetDTOs.CreateBudget;
using Application.DTOs.QuotationDTOs.UpdateQuotation;
using Application.Services;
using Application.Validators.BudgetValidation;
using AutoMapper;
using Domain.Entities;
using Domain.Enums;
using Domain.Services;
using Domain.Repositories;
using MediatR;
using MongoDB.Bson;

namespace Application.DTOs.BudgetDTOs.UpdateBudget
{
    public class CreateBudgetVersionHandler : IRequestHandler<CreateBudgetVersionCommand, string>
    {
        private readonly BudgetServices _budgetServices;
        private readonly IQuotationRepository _quotationRepository;
        private readonly IBudgetRepository _budgetRepository;
        private readonly BudgetCalculator _budgetCalculator;
        private readonly IMapper _mapper;
        private readonly IBudgetValidator _budgetValidator;
        private readonly IApplicationBudgetValidator _applicationBudgetValidator;
        private readonly IMediator _mediator;

        public CreateBudgetVersionHandler(IMapper mapper, BudgetServices budgetServices,
            IBudgetValidator budgetValidator, IApplicationBudgetValidator applicationBudgetValidator,
            BudgetCalculator budgetCalculator, IMediator mediator, IBudgetRepository budgetRepository, IQuotationRepository quotationRepository)
        {
            _mapper = mapper;
            _budgetServices = budgetServices;
            _budgetRepository = budgetRepository;
            _budgetValidator = budgetValidator;
            _applicationBudgetValidator = applicationBudgetValidator;
            _budgetCalculator = budgetCalculator;
            _mediator = mediator;
            _quotationRepository = quotationRepository;
        }

        public async Task<string> Handle(CreateBudgetVersionCommand request, CancellationToken cancellationToken)
        {
            Console.WriteLine("=== INICIANDO CreateBudgetVersionHandler ===");

            try
            {
                if (request.VersionDTO == null)
                {
                    throw new ArgumentNullException(nameof(request.VersionDTO), "El objeto VersionDTO no puede ser nulo.");
                }

                if (request.VersionDTO.BudgetData == null)
                {
                    throw new ArgumentNullException(nameof(request.VersionDTO.BudgetData), "El objeto BudgetData no puede ser nulo.");
                }

                // 1. Buscar la última versión de la cotización original
                Console.WriteLine($"Buscando versiones para BudgetId: {request.VersionDTO.OriginalBudgetId}");
                var allVersions = await _budgetRepository.GetBudgetsByBudgetIdAsync(request.VersionDTO.OriginalBudgetId);
                var originalBudget = allVersions?.OrderByDescending(b => b.version).FirstOrDefault();

                if (originalBudget == null)
                {
                    throw new KeyNotFoundException($"No se encontró la cotización con BudgetId: {request.VersionDTO.OriginalBudgetId}");
                }

                Console.WriteLine($"OriginalBudget encontrado - Version: {originalBudget.version}, ID: {originalBudget.id}");

                // 2. Mapear el DTO a Budget
                var budget = _mapper.Map<Budget>(request.VersionDTO.BudgetData);

                // 3. Aplicar propiedades de versión
                ApplyVersionProperties(budget, originalBudget);

                // 4. Validación de la Cotización (Capa de aplicación)
                Console.WriteLine("Iniciando validación ApplicationBudgetValidator...");
                _applicationBudgetValidator.Validate(request.VersionDTO.BudgetData);
                Console.WriteLine("ApplicationBudgetValidator completado");

                // 5. Validación de Cotización (Capa de logica de negocio)
                Console.WriteLine("Iniciando validación BudgetValidator...");
                _budgetValidator.Validate(budget);
                Console.WriteLine("BudgetValidator completado");

                // 6. CALCULAR TOTAL ANTES DE ACTUALIZAR SQL
                Console.WriteLine("Iniciando cálculo del total...");
                await _budgetCalculator.CalculateBudgetTotal(budget);
                Console.WriteLine($"Cálculo completado - Total: {budget.Total}");

                // 7. ACTUALIZAR SQL CON EL NUEVO TOTAL Y CAMBIAR ESTADO A PENDING
                if (int.TryParse(originalBudget.budgetId, out int sqlQuotationId))
                {
                    Console.WriteLine($"Parse exitoso, SQL QuotationId: {sqlQuotationId}");

                    // ACTUALIZACIÓN MEJORADA: Pasar el nuevo total y cambiar estado
                    await UpdateQuotationForNewVersion(sqlQuotationId, budget.Total);
                    Console.WriteLine("Actualización SQL completada");
                }

                // 8. Guardar nueva versión en MongoDB
                Console.WriteLine("Guardando nueva versión en la base de datos...");
                await _budgetServices.CreateBudgetAsync(budget);
                Console.WriteLine("Nueva versión guardada exitosamente");

                Console.WriteLine($"=== CreateBudgetVersionHandler COMPLETADO - Nuevo ID: {budget.id} ===");
                return budget.id;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ ERROR en CreateBudgetVersionHandler: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                    Console.WriteLine($"Inner stack trace: {ex.InnerException.StackTrace}");
                }
                throw;
            }
        }

        private void ApplyVersionProperties(Budget newVersion, Budget original)
        {
            Console.WriteLine("Aplicando propiedades de versión...");

            // Sobrescribir propiedades específicas para la versión
            newVersion.id = ObjectId.GenerateNewId().ToString();
            newVersion.budgetId = original.budgetId; // Mantener mismo BudgetId
            newVersion.version = original.version + 1; // Incrementar versión
            newVersion.creationDate = DateTime.UtcNow;
            newVersion.status = BudgetStatus.Pending;
            newVersion.ExpirationDate = DateTime.UtcNow.AddDays(60);
            newVersion.EndDate = null;

            // Manejar el comentario
            var versionComment = !string.IsNullOrEmpty(newVersion.Comment)
                ? newVersion.Comment
                : $"Nueva versión (V{original.version + 1}) creada el {DateTime.UtcNow:yyyy-MM-dd HH:mm}";

            newVersion.Comment = $"V{original.version + 1}: {versionComment}\n\n--- VERSIÓN ANTERIOR (V{original.version}) ---\n{original.Comment}";

            newVersion.Total = 0; // Se recalculará después

            Console.WriteLine($"Nueva versión: V{newVersion.version}, ID: {newVersion.id}");
        }
        private async Task UpdateQuotationForNewVersion(int quotationId, decimal newTotalPrice)
        {
            try
            {
                // 1. Actualizar precio total usando el Command existente
                var updatePriceCommand = new UpdateQuotationForNewVersionCommand(quotationId, newTotalPrice);
                var priceUpdated = await _mediator.Send(updatePriceCommand);

                if (!priceUpdated)
                {
                    Console.WriteLine($"⚠️ No se pudo actualizar el precio de la cotización SQL ID: {quotationId}");
                }

                // 2. CAMBIAR EL ESTADO A "PENDING" - Esto es lo que te faltaba
                await _quotationRepository.ChangeQuotationStatus(quotationId, "pending");

                Console.WriteLine($"✅ Cotización SQL actualizada - ID: {quotationId}, Total: {newTotalPrice}, Estado: pending");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ ERROR actualizando cotización SQL: {ex.Message}");
                throw;
            }
        }
    }
}