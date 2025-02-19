using Infrastructure;
using Infrastructure.Persistence.MongoDBContext;
using Microsoft.Extensions.Options;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;
using Domain.UseCases;
using Swashbuckle.AspNetCore.SwaggerGen;
// using Infrastructure.Persistence; // AsegÃºrate de que esta referencia sea correcta

var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration;

// Configurar Entity Framework con MySQL (usando Pomelo)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// Configurar logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// Inyectar dependencias
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<LoginUser>();

// Agregar controladores y Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Agrega la configuración de Mongo
builder.Services.Configure<MongoDbSettings>(configuration.GetSection("MongoDbSettings"));
builder.Services.AddSingleton(sp => sp.GetRequiredService<IOptions<MongoDbSettings>>().Value);

// Registramos los servicios de infraestructura
builder.Services.AddInfrastructure(configuration);

var app = builder.Build();

// Configurar middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseAuthorization();

// Definir endpoint adicional
var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast")
.WithOpenApi();

app.MapControllers();

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
