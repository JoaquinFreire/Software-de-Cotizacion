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
        private readonly IBudgetRepository _budgetRepository;
        private readonly BudgetCalculator _budgetCalculator;
        private readonly IMapper _mapper;
        private readonly IBudgetValidator _budgetValidator;
        private readonly IApplicationBudgetValidator _applicationBudgetValidator;
        private readonly IMediator _mediator;

        public CreateBudgetVersionHandler(IMapper mapper, BudgetServices budgetServices,
            IBudgetValidator budgetValidator, IApplicationBudgetValidator applicationBudgetValidator,
            BudgetCalculator budgetCalculator, IMediator mediator, IBudgetRepository budgetRepository)
        {
            _mapper = mapper;
            _budgetServices = budgetServices;
            _budgetRepository = budgetRepository;
            _budgetValidator = budgetValidator;
            _applicationBudgetValidator = applicationBudgetValidator;
            _budgetCalculator = budgetCalculator;
            _mediator = mediator;
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

                // 2. Actualizar SQL
                if (int.TryParse(originalBudget.budgetId, out int sqlQuotationId))
                {
                    Console.WriteLine($"Parse exitoso, SQL QuotationId: {sqlQuotationId}");
                    await _mediator.Send(new UpdateQuotationForNewVersionCommand(sqlQuotationId));
                    Console.WriteLine("Actualización SQL completada");
                }

                // 3. Validación de la Cotización (Capa de aplicación)
                Console.WriteLine("Iniciando validación ApplicationBudgetValidator...");
                _applicationBudgetValidator.Validate(request.VersionDTO.BudgetData);
                Console.WriteLine("ApplicationBudgetValidator completado");

                // 4. Mapear el DTO a Budget con DEBUG DETALLADO
                Console.WriteLine("=== INICIANDO MAPEO DETALLADO ===");
                Console.WriteLine($"BudgetData recibido: {request.VersionDTO.BudgetData != null}");
                Console.WriteLine($"Products count: {request.VersionDTO.BudgetData.Products?.Count}");
                Console.WriteLine($"Complements count: {request.VersionDTO.BudgetData.complement?.Count}");

                // Debug de cada producto antes del mapeo
                if (request.VersionDTO.BudgetData.Products != null)
                {
                    for (int i = 0; i < request.VersionDTO.BudgetData.Products.Count; i++)
                    {
                        var product = request.VersionDTO.BudgetData.Products[i];
                        Console.WriteLine($"Producto {i + 1}:");
                        Console.WriteLine($"  - OpeningType: {product.OpeningType?.name ?? "NULL"}");
                        Console.WriteLine($"  - AlumTreatment: {product.AlumTreatment?.name ?? "NULL"}");
                        Console.WriteLine($"  - GlassType: {product.GlassType?.name ?? "NULL"}");
                        Console.WriteLine($"  - Accesory count: {product.Accesory?.Count ?? 0}");
                    }
                }

                var budget = _mapper.Map<Budget>(request.VersionDTO.BudgetData);
                Console.WriteLine("Mapeo completado");

                if (budget == null)
                {
                    throw new InvalidOperationException("El mapeo del BudgetData a Budget resultó en null.");
                }

                // Debug después del mapeo
                Console.WriteLine("=== DESPUÉS DEL MAPEO ===");
                Console.WriteLine($"Budget mapeado: {budget != null}");
                Console.WriteLine($"Products count después del mapeo: {budget.Products?.Count}");

                if (budget.Products != null)
                {
                    for (int i = 0; i < budget.Products.Count; i++)
                    {
                        var product = budget.Products[i];
                        Console.WriteLine($"Producto mapeado {i + 1}:");
                        Console.WriteLine($"  - OpeningType: {product.OpeningType?.name ?? "NULL"}");
                        Console.WriteLine($"  - AlumTreatment: {product.AlumTreatment?.name ?? "NULL"}");
                        Console.WriteLine($"  - GlassType: {product.GlassType?.name ?? "NULL"}");
                        Console.WriteLine($"  - Accesory count: {product.Accesory?.Count ?? 0}");

                        // Verificar propiedades críticas
                        if (product.OpeningType == null)
                        {
                            Console.WriteLine($"  ⚠️ ERROR: OpeningType es NULL en producto {i + 1}");
                        }
                        if (product.AlumTreatment == null)
                        {
                            Console.WriteLine($"  ⚠️ ERROR: AlumTreatment es NULL en producto {i + 1}");
                        }
                        if (product.GlassType == null)
                        {
                            Console.WriteLine($"  ⚠️ ERROR: GlassType es NULL en producto {i + 1}");
                        }
                    }
                }
                Console.WriteLine("=== FIN DEBUG MAPEO ===");

                // 5. Aplicar propiedades específicas de la versión
                ApplyVersionProperties(budget, originalBudget);

                // 6. Validación de Cotización (Capa de logica de negocio)
                Console.WriteLine("Iniciando validación BudgetValidator...");
                _budgetValidator.Validate(budget);
                Console.WriteLine("BudgetValidator completado");

                // 7. Calculo de total de la cotización
                Console.WriteLine("Iniciando cálculo del total...");
                await _budgetCalculator.CalculateBudgetTotal(budget);
                Console.WriteLine($"Cálculo completado - Total: {budget.Total}");

                // 8. Guardar nueva versión
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
    }
}