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
            services.AddScoped<ICustomerRepository, CustomerRepository>();
            services.AddScoped<ICustomerAgentRepository, CustomerAgentRepository>();
            services.AddScoped<IQuotationRepository, QuotationRepository>();
            services.AddScoped<IUserRepository, UserRepository>();
            services.AddScoped<IWorkTypeRepository, WorkTypeRepository>(); // Asegúrate de registrar IWorkTypeRepository
            services.AddScoped<IWorkPlaceRepository, WorkPlaceRepository>(); // Asegúrate de registrar IWorkPlaceRepository

            return services;
        }
    }
}
