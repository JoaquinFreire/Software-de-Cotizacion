using Infrastructure.Persistence.MongoDBContext;
using MongoDB.Driver;
using Microsoft.Extensions.Options;
using Domain.Entities;
using Domain.Repositories;
using ZstdSharp.Unsafe;
using System.Linq.Expressions;

namespace Infrastructure.Persistence.Repositories
{
    public class BudgetRepository : IBudgetRepository
    {
        private readonly IMongoCollection<Budget> _collection;

        //Constructor que realiza la conexión con Mongo y se conecta a la base de datos y a la colección especificada
        public BudgetRepository(MongoDbSettings settings)
        {
            var client = new MongoClient(settings.ConnectionString);
            var database = client.GetDatabase(settings.DatabaseName);
            _collection = database.GetCollection<Budget>(settings.CollectionName);

        }

        public async Task<Budget> GetByIdAsync(string id)
        {
            return await _collection.Find(Builders<Budget>.Filter.Eq("_id", id)).FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<Budget>> FindAsync(Expression<Func<Budget, bool>> predicate)
        {
            return await _collection.Find(predicate).ToListAsync();
        }

        //Metodo para ver todas las cotizaciones
        public async Task<IEnumerable<Budget>> GetAllAsync()
        {
            return await _collection.Find(_ => true).ToListAsync();
        }

        //Metodo para agregar cotizaciones
        public async Task AddAsync(Budget entity)
        {
            await _collection.InsertOneAsync(entity);
        }

        //Metodo para actualizar cotizaciones por medio del id
        public async Task UpdateAsync(string id, Budget entity)
        {
            await _collection.ReplaceOneAsync(Builders<Budget>.Filter.Eq("_id", id), entity);
        }

        //Metodo para eliminar cotizaciones por medio del id
        public async Task DeleteAsync(string id)
        {
            await _collection.DeleteOneAsync(Builders<Budget>.Filter.Eq("_id", id));
        }
        /*public async Task DeleteAsync(string id)
        {
            await _collection.DeleteOneAsync(b => b.id == id);
        }*/

        //Metodo para ver las todas las cotizaciones de un cliente
        public async Task<List<Budget>> GetBudgetsByCustomerAsync(Customer customer)
        {
            return await _collection.Find(b => b.customer.id == customer.id).ToListAsync();
        }

        //Metodo para buscar cotizaciones por id
        async Task<Budget> IBudgetRepository.GetByIdAsync(string id)
        {
            return await _collection.Find(b => b.id == id).FirstOrDefaultAsync();
        }

    }
}
