using Domain.Entities;
using Domain.Enums;
using Domain.Repositories;
using DotNetEnv;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using ZstdSharp.Unsafe;

namespace Infrastructure.Persistence.Repositories
{
    public class BudgetRepository : IBudgetRepository
    {
        private readonly IMongoCollection<Budget> _collection;

        //Constructor que realiza la conexión con Mongo y se conecta a la base de datos y a la colección especificada
        public BudgetRepository()
        {
            // Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "default-issuer";
            string connectionString = Env.GetString("MONGO_CONNECTION_STRING");
            string databaseName = Env.GetString("MONGO_DATABASE_NAME");
            string collectionName = Env.GetString("MONGO_COLLECTION_NAME");

            // var mongosettings = settings.Value; // Se obtienen las configuraciones de MongoDB
            var client = new MongoClient(connectionString); // Se crea un cliente de MongoDB
            var database = client.GetDatabase(databaseName); // Se conecta a la base de datos
            _collection = database.GetCollection<Budget>(collectionName); // Se conecta a la colección
        }

        //Metodo para ver todas las cotizaciones
        public async Task<List<Budget>> GetAllAsync()
        {
            return await _collection.Find(_ => true).ToListAsync();
        }

        // Método para buscar cotizaciones por id de MongoDB
        public async Task<Budget> GetByIdAsync(string id)
        {
            var filter = Builders<Budget>.Filter.Eq(b => b.id, id);
            return await _collection.Find(filter).FirstOrDefaultAsync();
        }

        //Metodo para buscar cotizaciones por BudgetId
        public async Task<Budget> GetByBudgetIdAsync(string budgetId)
        {
            var filter = Builders<Budget>.Filter.Eq(b => b.budgetId, budgetId);
            return await _collection.Find(filter).FirstOrDefaultAsync();
        }

        //Metodo para ver las cotizaciones por BudgetId
        public async Task<List<Budget>> GetBudgetsByBudgetIdAsync(string budgetId)
        {
            var filter = Builders<Budget>.Filter.Eq(b => b.budgetId, budgetId);
            return await _collection.Find(filter).ToListAsync();
        }

        //Metodo para agregar cotizaciones
        public async Task AddAsync(Budget entity)
        {
            await _collection.InsertOneAsync(entity);
        }

        //Metodo para actualizar cotizaciones por medio del id
        public async Task UpdateAsync(string id, Budget entity)
        {
            await _collection.ReplaceOneAsync(b => b.id == id, entity);
        }

        //Metodo para eliminar cotizaciones por medio del id
        public async Task DeleteAsync(string id)
        {
            await _collection.DeleteOneAsync(b => b.id == id);
        }
        public async Task<List<Budget>> GetBudgetsByCustomerDniAsync(string customerDni)
        {
            var filter = Builders<Budget>.Filter.Eq("customer.dni", customerDni);
            return await _collection.Find(filter).ToListAsync();
        }
        //Metodo para ver las todas las cotizaciones de un cliente
        public async Task<List<Budget>> GetBudgetsByCustomerAsync(Customer customer)
        {
            var filter = Builders<Budget>.Filter.Eq("customer.dni", customer.dni);
            return await _collection.Find(filter).ToListAsync();
        }

        //Metodo para cambiar el estado de una cotización
        public async Task ChangeBudgetStatus(string budgetId, BudgetStatus newStatus, string? rejectionComment = null)
        {
            var filter = Builders<Budget>.Filter.Eq(b => b.budgetId, budgetId);
            var budgets = await _collection.Find(filter).ToListAsync();

            foreach (var budget in budgets)
            {
                var update = Builders<Budget>.Update
                    .Set(b => b.status, newStatus)
                    .Set(b => b.EndDate, DateTime.UtcNow);

                // Si es rechazado y hay comentario, agregarlo AL INICIO del comentario existente
                if (newStatus == BudgetStatus.Rejected && !string.IsNullOrEmpty(rejectionComment))
                {
                    var motivoRechazo = $"--- MOTIVO DE RECHAZO ---\n{rejectionComment}\nFecha: {DateTime.UtcNow:yyyy-MM-dd HH:mm}\n\n";
                    var nuevoComentario = motivoRechazo + (string.IsNullOrEmpty(budget.Comment) ? "" : budget.Comment);
                    update = update.Set(b => b.Comment, nuevoComentario);
                }

                await _collection.UpdateOneAsync(
                    Builders<Budget>.Filter.Eq(b => b.id, budget.id),
                    update
                );
            }
        }

        public async Task<object> DebugMongoConnection()
        {
            try
            {
                // Contar todos los documentos
                var totalCount = await _collection.CountDocumentsAsync(FilterDefinition<Budget>.Empty);

                // Obtener algunos documentos de muestra
                var sampleBudgets = await _collection.Find(_ => true)
                    .Limit(5)
                    .ToListAsync();

                // Verificar la estructura de customer en los documentos
                var customerFields = sampleBudgets.Select(b => new
                {
                    BudgetId = b.budgetId,
                    HasCustomer = b.customer != null,
                    CustomerDni = b.customer?.dni,
                    CustomerFields = b.customer == null ? null : new
                    {
                        Fields = string.Join(", ", b.customer.GetType().GetProperties().Select(p => p.Name))
                    }
                }).ToList();

                return new
                {
                    TotalDocuments = totalCount,
                    SampleBudgets = customerFields,
                    ConnectionStatus = "OK"
                };
            }
            catch (Exception ex)
            {
                return new { Error = ex.Message, ConnectionStatus = "FAILED" };
            }
        }
    }
}
