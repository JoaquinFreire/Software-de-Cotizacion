using Application.DTOs.BudgetDTOs.CreateBudget;
using Application.DTOs.CustomerDTOs.CreateCustomer;
using Application.Mapping.CustomerProfile;
using Application.Services;
using Application.UseCases;
using Application.Validators;
using Application.Validators.BudgetValidation;
using Application.Validators.CustomerAgentValidation;
using Application.Validators.CustomerValidation;
using Application.Validators.UserValidator;
using Domain.Repositories; //TODO: En lo posible eliminar esta dependencia, porque no corresponde a la capa de presentación
using DotNetEnv;
using Infrastructure.Persistence.MongoDBContext;
using Infrastructure.Persistence.Repositories;
using Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
Env.Load("../.env"); // Carga las variables de entorno desde el archivo .env

Console.WriteLine("Arrancando backend...");
var builder = WebApplication.CreateBuilder(args);

var mysqlConnectionString = Environment.GetEnvironmentVariable("MYSQL_CONNECTION_STRING");
var jwtSecretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY");
var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER");
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE");

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

//REGISTRO DE SERVICIOS DE APLICACIÓN
builder.Services.AddScoped<AlumTreatmentServices>(); // Registrar el servicio de aplicación para tratamientos de aluminio
builder.Services.AddScoped<BudgetServices>(); // Registrar el servicio de aplicación para cotizaciones
builder.Services.AddScoped<CoatingServices>(); // Registrar el servicio de aplicación para revestimientos
builder.Services.AddScoped<ComplementDoorServices>(); // Registrar el servicio de aplicación para puertas
builder.Services.AddScoped<ComplementPartitionServices>(); // Registrar el servicio de aplicación para tabiques
builder.Services.AddScoped<ComplementRailingServices>(); // Registrar el servicio de aplicación para barandas
builder.Services.AddScoped<CustomerServices>(); // Registrar el servicio de aplicación para clientes
builder.Services.AddScoped<CustomerAgentServices>(); // Registrar el servicio de aplicación para agentes de clientes
builder.Services.AddScoped<GlassTypeServices>(); // Registrar el servicio de aplicación para tipos de vidrio
builder.Services.AddScoped<OpeningTypeServices>(); // Registrar el servicio de aplicación para tipos de aberturas
builder.Services.AddScoped<PriceServices>(); // Registrar el servicio de aplicación para precios
builder.Services.AddScoped<QuotationServices>(); // Registrar el servicio de aplicación para cotizaciones
builder.Services.AddScoped<UserServices>(); // Registrar el servicio de aplicación para usuarios
builder.Services.AddScoped<UserInvitationServices>(); // Registrar el servicio de aplicación para invitaciones de usuario
builder.Services.AddScoped<WorkTypeServices>(); // Registrar el servicio de aplicación para tipos de trabajo
builder.Services.AddScoped<AccessoryServices>(); // Registrar el servicio de aplicación para accesorios

//REGISTRO DE MAPEO DE ENTIDADES DE DOMINIO
builder.Services.AddAutoMapper(typeof(CreateBudgetProfile));//Mapeo de cotizaciones
builder.Services.AddAutoMapper(typeof(CreateCustomerProfile));//Mapeo de clientes

//REGISTRO DE VALIDACIONES

// -DNI Unico-
builder.Services.AddTransient<IdentityValidation>();

// -Cotizaciones-
//Capa de logica de negocio
builder.Services.AddTransient<IBudgetValidator, BudgetValidator>();
//Capa de aplicación
builder.Services.AddTransient<IApplicationBudgetValidator, ApplicationBudgetValidator>();

// -Clientes-
//Capa de logica de negocio
builder.Services.AddTransient<ICustomerValidator, CustomerValidator>();

// -Agentes de Clientes-
//Capa de logica de negocio
builder.Services.AddTransient<ICustomerAgentValidator, CustomerAgentValidator>();

// -Usuarios-
//Capa de logica de negocio
builder.Services.AddTransient<IUserValidator, UserValidator>();

// Configura MediatR para manejar comandos y consultas
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(CreateBudgetCommand).Assembly);
    cfg.RegisterServicesFromAssembly(typeof(CreateCustomerCommand).Assembly);
});

//Mongo
// Registrar MongoDB en la infraestructura
// Registrar el repositorio de MongoDB
builder.Services.AddScoped<IBudgetRepository, BudgetRepository>();
builder.Services.AddScoped<BudgetServices>();

// REGISTRO DE ENTITY FRAMEWORK USANDO POMELO
// Configura Entity Framework con MySQL usando Pomelo y la conexión de entorno
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(mysqlConnectionString, ServerVersion.AutoDetect(mysqlConnectionString)));

// Configura logging (limpia los proveedores existentes y agrega logging en consola)
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// Inyección de dependencias para los servicios del dominio TODO: Verificar si es necesario usar la capa de dominio aca
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserInvitationRepository, UserInvitationRepository>();
builder.Services.AddScoped<IMailServices, SendGridMailService>();
builder.Services.AddScoped<LoginUser>();

builder.Services.AddScoped<IQuotationRepository, QuotationRepository>();
builder.Services.AddScoped<CreateQuotation>();

builder.Services.AddScoped<ICustomerRepository, CustomerRepository>();
builder.Services.AddScoped<ICustomerAgentRepository, CustomerAgentRepository>();

builder.Services.AddScoped<IWorkTypeRepository, WorkTypeRepository>(); // Asegúrate de registrar IWorkTypeRepository
builder.Services.AddScoped<IWorkPlaceRepository, WorkPlaceRepository>(); // Asegúrate de registrar IWorkPlaceRepository
//builder.Services.AddScoped<IComplementRepository, ComplementRepository>();
//builder.Services.AddScoped<IComplementTypeRepository, ComplementTypeRepository>();
builder.Services.AddScoped<IOpeningTypeRepository, OpeningTypeRepository>();
builder.Services.AddScoped<IAlumTreatmentRepository, AlumTreatmentRepository>();    
builder.Services.AddScoped<IPriceRepository, PriceRepository>();
builder.Services.AddScoped<IGlassTypeRepository, GlassTypeRepository>();
builder.Services.AddScoped<IUserInvitationRepository, UserInvitationRepository>();
builder.Services.AddScoped<IComplementDoorRepository, ComplementDoorRepository>();
builder.Services.AddScoped<IComplementPartitionRepository, ComplementPartitionRepository>();
builder.Services.AddScoped<IComplementRailingRepository, ComplementRailingRepository>();
builder.Services.AddScoped<ICoatingRepository, CoatingRepository>();
builder.Services.AddScoped<IOpeningConfigurationRepository, OpeningConfigurationRepository>();
builder.Services.AddScoped<IAccesoryRepository, AccesoriesRepository>();

// Agrega soporte para controladores en la API
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve; // <-- AGREGA ESTA LÍNEA
    });

//REGISTRO DE AUTENTICACIÓN MEDIANTE JASON WEB TOKEN (JWT)
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

//REGISTRO DE SWAGGER
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