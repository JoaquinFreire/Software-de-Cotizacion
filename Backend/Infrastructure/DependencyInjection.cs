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
            //Lee la información del appsettings.json y lo almacena en el objeto MongoDbSettings
            var mongoDbSettings = configuration.GetSection("MongoDbSettings").Get<MongoDbSettings>();
            //Agregamos la configuración de mongo como servicio singleton
            services.AddSingleton(mongoDbSettings);

            services.AddSingleton<IBudgetRepository, BudgetRepository>();

            return services;
        }
    }
}
