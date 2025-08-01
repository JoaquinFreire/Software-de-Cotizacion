using Application.DTOs.CreateBudget;
using Application.Services;
using Application.UseCases;
using Application.UseCases.Budget;
using Application.Validators;
using AutoMapper;
using Domain.Repositories;
using DotNetEnv;
using Infrastructure;
// Ensure the namespace containing MongoDbSettings is included
using Infrastructure.Persistence.MongoDBContext;
using Infrastructure.Persistence.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using QuestPDF.Infrastructure;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.IO;
using System.Text;
using System.Text.Json.Serialization;
Env.Load("../.env"); // Carga las variables de entorno desde el archivo .env

Console.WriteLine("Arrancando backend...");
var builder = WebApplication.CreateBuilder(args);

//Inscripción a QuestPDF
QuestPDF.Settings.License = LicenseType.Community;

var mysqlConnectionString = Environment.GetEnvironmentVariable("MYSQL_CONNECTION_STRING");
var jwtSecretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY");
var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER");
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE");

/* var configuration = builder.Configuration; */


// Cargar variables de entorno
var mongoConnectionString = Environment.GetEnvironmentVariable("MONGO_CONNECTION_STRING");
var mongoDatabaseName = Environment.GetEnvironmentVariable("MONGO_DATABASE_NAME");
var mongoCollectionName = Environment.GetEnvironmentVariable("MONGO_COLLECTION_NAME");
// Configuración de MongoDB con las variables de entorno
builder.Services.Configure<MongoDbSettings>(options =>
{
    options.ConnectionString = mongoConnectionString ?? throw new InvalidOperationException("MONGO_CONNECTION_STRING is not set in the environment variables.");
    options.DatabaseName = mongoDatabaseName ?? throw new InvalidOperationException("MONGO_DATABASE_NAME is not set in the environment variables."); 
    options.CollectionName = mongoCollectionName ?? throw new InvalidOperationException("MONGO_COLLECTION_NAME is not set in the environment variables.");
});

builder.Services.AddScoped<UserServices>(); // Registrar el servicio de aplicación


builder.Services.AddScoped<UserServices>();

builder.Services.AddAutoMapper(typeof(CreateBudgetProfile));

//VALIDACIONES DE BUDGET
//Capa de logica de negocio
builder.Services.AddTransient<IBudgetValidator, BudgetValidator>();
//Capa de aplicación
builder.Services.AddTransient<IApplicationBudgetValidator, ApplicationBudgetValidator>();



// Configura MediatR para manejar comandos y consultas
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(CreateBudgetCommand).Assembly);
});

//Mongo
// Registrar MongoDB en la infraestructura
// Registrar el repositorio de MongoDB
builder.Services.AddScoped<IBudgetRepository, BudgetRepository>();
builder.Services.AddScoped<BudgetServices>();

// Configura Entity Framework con MySQL usando Pomelo y la conexión de entorno
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(mysqlConnectionString, ServerVersion.AutoDetect(mysqlConnectionString)));

// Configura logging (limpia los proveedores existentes y agrega logging en consola)
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// Inyección de dependencias para los servicios del dominio
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<LoginUser>();

builder.Services.AddScoped<IQuotationRepository, QuotationRepository>();
builder.Services.AddScoped<CreateQuotation>();

builder.Services.AddScoped<ICustomerRepository, CustomerRepository>();
builder.Services.AddScoped<ICustomerAgentRepository, CustomerAgentRepository>();
builder.Services.AddScoped<CreateCustomer>();

builder.Services.AddScoped<IWorkTypeRepository, WorkTypeRepository>(); // Asegúrate de registrar IWorkTypeRepository
builder.Services.AddScoped<IWorkPlaceRepository, WorkPlaceRepository>(); // Asegúrate de registrar IWorkPlaceRepository

//builder.Services.AddScoped<IComplementRepository, ComplementRepository>();
//builder.Services.AddScoped<IComplementTypeRepository, ComplementTypeRepository>();

builder.Services.AddScoped<IOpeningTypeRepository, OpeningTypeRepository>();
/* builder.Services.AddScoped<CreateOpeningType>();
builder.Services.AddScoped<DeleteOpeningType>();
builder.Services.AddScoped<UpdateOpeningType>();
builder.Services.AddScoped<GetAllOpeningTypes>();
builder.Services.AddScoped<GetOpeningTypeById>(); */

builder.Services.AddScoped<IAlumTreatmentRepository, AlumTreatmentRepository>();    

builder.Services.AddScoped<IPriceRepository, PriceRepository>();

builder.Services.AddScoped<IGlassTypeRepository, GlassTypeRepository>();
builder.Services.AddScoped<IUserInvitationRepository, UserInvitationRepository>();
builder.Services.AddScoped<IComplementDoorRepository, ComplementDoorRepository>();
builder.Services.AddScoped<IComplementPartitionRepository, ComplementPartitionRepository>();
builder.Services.AddScoped<IComplementRailingRepository, ComplementRailingRepository>();
builder.Services.AddScoped<ICoatingRepository, CoatingRepository>();
// Agrega soporte para controladores en la API
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// Configuración de autenticación con JWT usando variables de entorno
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey ?? throw new InvalidOperationException("JWT_SECRET_KEY is not set in the environment variables.")))
        };
    });

// Configura Swagger para la documentación de la API
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    // Elimina el endpoint del clima y otros valores generados por defecto
    options.CustomOperationIds(apiDesc => apiDesc.ActionDescriptor.RouteValues["action"]);
});
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000", "https://joaquinfreire.github.io",
            "https://joaquinfreire.github.io/Software-de-Cotizacion", "https://software-de-cotizacion-1.onrender.com")
                  // Permitir el frontend
                  .AllowAnyMethod()  // Permitir cualquier método HTTP (GET, POST, etc.)
                  .AllowAnyHeader(); // Permitir cualquier encabezado
        });
});

var app = builder.Build();

// Configuración de middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();  // Habilita la generación del JSON de Swagger
    app.UseSwaggerUI(); // Habilita la interfaz web de Swagger
}

app.UseHttpsRedirection(); // Redirige automáticamente HTTP a HTTPS
app.UseRouting(); // Habilita el enrutamiento de las solicitudes
app.UseCors("AllowFrontend");
app.UseAuthentication(); // 🔹
app.UseAuthorization(); // Habilita la autorización en la API
// Mapea los controladores definidos en la aplicación
app.MapControllers();
Console.WriteLine("Backend listo para recibir solicitudes.");
try
{
    app.Run();
}
catch (Exception ex)
{
    Console.WriteLine("ERROR FATAL: " + ex.ToString());
    throw;
}