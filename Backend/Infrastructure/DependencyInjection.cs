using Domain.Repositories;
using Infrastructure.Persistence.Repositories;
using Infrastructure.Persistence.MongoDBContext;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            // 🛠 Configuración alternativa para evitar error de conversión
            var mongoDbSettings = configuration.GetSection("MongoDbSettings").Get<MongoDbSettings>();
            services.AddSingleton(mongoDbSettings);

            // Registro del repositorio
            services.AddSingleton<IBudgetRepository, BudgetRepository>();

            return services;
        }
    }
}
