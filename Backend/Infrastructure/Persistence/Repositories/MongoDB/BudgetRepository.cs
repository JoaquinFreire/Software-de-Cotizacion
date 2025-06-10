using MongoDB.Driver;
using Microsoft.Extensions.Options;
using Domain.Entities;
using Domain.Repositories;
using ZstdSharp.Unsafe;
using DotNetEnv;

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

        //Metodo para ver las todas las cotizaciones de un cliente
        public async Task<List<Budget>> GetBudgetsByCustomerAsync(Customer customer)
        {
            return await _collection.Find(b => b.customer != null && b.customer.id == customer.id).ToListAsync();
        }
    }
}
