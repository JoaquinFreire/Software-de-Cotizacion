using Application.DTOs.OperativeEfficiencyDashboard.Dashboard;
using Domain.Entities;
using Microsoft.Extensions.DependencyInjection;

namespace Application.Services
{
    public class DashboardDataService
    {
        private readonly IServiceProvider _serviceProvider;

        public DashboardDataService(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        public async Task<DashboardData> GetDashboardDataAsync()
        {
            Console.WriteLine("🔄 Iniciando carga unificada de datos...");

            // Crear scopes separados para evitar problemas de concurrencia
            using var scope1 = _serviceProvider.CreateScope();
            using var scope2 = _serviceProvider.CreateScope();
            using var scope3 = _serviceProvider.CreateScope();

            // Obtener servicios desde scopes separados
            var budgetServices = scope1.ServiceProvider.GetRequiredService<BudgetServices>();
            var userServices = scope2.ServiceProvider.GetRequiredService<UserServices>();
            var quotationServices = scope3.ServiceProvider.GetRequiredService<QuotationServices>();

            // Ejecutar las 3 consultas en paralelo
            var budgetsTask = budgetServices.GetAllBudgetsAsync();
            var usersTask = userServices.GetAllAsync();
            var quotationsTask = quotationServices.GetAllAsync();

            await Task.WhenAll(budgetsTask, usersTask, quotationsTask);

            var data = new DashboardData
            {
                AllBudgets = budgetsTask.Result?.ToList() ?? new List<Budget>(),
                AllUsers = usersTask.Result?.ToList() ?? new List<User>(),
                AllQuotations = quotationsTask.Result?.ToList() ?? new List<Quotation>()
            };

            Console.WriteLine($"✅ Datos cargados: {data.AllBudgets.Count} budgets, {data.AllUsers.Count} users, {data.AllQuotations.Count} quotations");

            return data;
        }
    }
}