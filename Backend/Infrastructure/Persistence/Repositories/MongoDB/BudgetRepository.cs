using Infrastructure.Persistence.MongoDBContext;
using MongoDB.Driver;
using Microsoft.Extensions.Options;
using Entities;
using Domain.Repositories;

namespace Infrastructure.Persistence.Repositories
{
    public class BudgetRepository : IBudgetRepository
    {
        private readonly IMongoCollection<Budget> _collection;

        public BudgetRepository(IOptions<MongoDbSettings> settings)
        {
            var mongosettings = settings.Value;
            var client = new MongoClient(mongosettings.ConnectionString);
            var database = client.GetDatabase(mongosettings.DatabaseName);
            _collection = database.GetCollection<Budget>(mongosettings.CollectionName);
        }

        public async Task<List<Budget>> GetAllAsync()
        {
            return await _collection.Find(_ => true).ToListAsync();
        }

        public async Task<Budget> GetByIdAsync(string id)
        {
            return await _collection.Find(b => b.Id == id).FirstOrDefaultAsync();
        }

        public async Task AddAsync(Budget entity)
        {
            await _collection.InsertOneAsync(entity);
        }

        public async Task UpdateAsync(string id, Budget entity)
        {
            await _collection.ReplaceOneAsync(b => b.Id == id, entity);
        }

        public async Task DeleteAsync(string id)
        {
            await _collection.DeleteOneAsync(b => b.Id == id);
        }

        public async Task<List<Budget>> GetBudgetsByCustomerAsync(Customer customer)
        {
            return await _collection.Find(b => b.Customer.id == customer.id).ToListAsync();
        }
    }
}
