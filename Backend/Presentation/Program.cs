using Infrastructure;
using Infrastructure.Persistence.MongoDBContext;
using Microsoft.Extensions.Options;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;
using Domain.UseCases;  
using Swashbuckle.AspNetCore.SwaggerGen;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Application.Services;
using Infrastructure.Persistence.Repositories;
using DotNetEnv;
Env.Load("../.env"); // Carga las variables de entorno desde el archivo .env


var builder = WebApplication.CreateBuilder(args);

// Cargar variables de entorno
var mongoConnectionString = Environment.GetEnvironmentVariable("MONGO_CONNECTION_STRING");
var mongoDatabaseName = Environment.GetEnvironmentVariable("MONGO_DATABASE_NAME");
var mongoCollectionName = Environment.GetEnvironmentVariable("MONGO_COLLECTION_NAME");

var mysqlConnectionString = Environment.GetEnvironmentVariable("MYSQL_CONNECTION_STRING");
var jwtSecretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY");
var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER");
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE");

/* var configuration = builder.Configuration; */

// Configuración de MongoDB con las variables de entorno
builder.Services.Configure<MongoDbSettings>(options =>
{
    options.ConnectionString = mongoConnectionString ?? throw new InvalidOperationException("MONGO_CONNECTION_STRING is not set in the environment variables.");
    options.DatabaseName = mongoDatabaseName ?? throw new InvalidOperationException("MONGO_DATABASE_NAME is not set in the environment variables."); 
    options.CollectionName = mongoCollectionName ?? throw new InvalidOperationException("MONGO_COLLECTION_NAME is not set in the environment variables.");
});

builder.Services.AddScoped<UserServices>(); // Registrar el servicio de aplicación



//Mongo
// Registrar MongoDB en la infraestructura
builder.Services.AddInfrastructure(builder.Configuration);
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

builder.Services.AddScoped<IMaterialRepository, MaterialRepository>();
builder.Services.AddScoped<IMaterialTypeRepository, MaterialTypeRepository>();
builder.Services.AddScoped<IMaterialCategoryRepository, MaterialCategoryRepository>();

// Agrega soporte para controladores en la API
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// Configuración de autenticación con JWT usando variables de entorno
Console.WriteLine($"JWT_SECRET_KEY: {jwtSecretKey}");
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
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey))
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
            policy.WithOrigins("http://localhost:3000") // Permitir el frontend
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

app.Run(); // Ejecuta la aplicación