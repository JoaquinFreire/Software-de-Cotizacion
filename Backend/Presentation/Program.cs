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
using AutoMapper;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

var configuration = builder.Configuration;

builder.Services.Configure<MongoDbSettings>(
builder.Configuration.GetSection("MongoDbSettings"));

builder.Services.AddScoped<UserServices>();

builder.Services.AddAutoMapper(typeof(BudgetProfile));

//Mongo
builder.Services.AddInfrastructure(builder.Configuration);
// Registrar el repositorio de MongoDB
builder.Services.AddScoped<IBudgetRepository, BudgetRepository>();
// Registrar el servicio de aplicación
builder.Services.AddScoped<BudgetServices>();

// Configura Entity Framework con MySQL usando Pomelo
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

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

// Agrega soporte para controladores en la API
builder.Services.AddControllers();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

var jwtKey = configuration["Jwt:Key"];  // 🔹 Cambia esto por una clave segura

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = "anodal",
            ValidAudience = "unc",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
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