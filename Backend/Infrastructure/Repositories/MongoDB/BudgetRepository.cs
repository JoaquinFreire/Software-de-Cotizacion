using Application.Interfaces;
using Domain.Entities;
using MongoDB.Driver;
using Infrastructure.Persistence.MongoDB;
using Infrastructure.Persistence.MongoDBContext;

namespace Infrastructure.Repositories.MongoDB
{
    public class BudgetRepository : MongoRepository<Budget>, IBudgetRepository
    {
        public BudgetRepository(MongoDbContext context) : base(context.Documentos.Database, "Documentos") { }
    }
}
