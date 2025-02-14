using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MongoDB.Driver;

namespace Infrastructure.Persistence.MongoDBContext
{
    internal class MongoDBContext
    {
        private readonly IMongoDatabase _database;

        public MongoDBContext(IMongoDatabase database)
        {
            var client = new MongoClient("mongodb://localhost:27017");
            _database = client.GetDatabase("Anodal");
        }

        public IMongoCollection<Budget> Documentos => _database.GetCollection<Documento>("Documentos");
    }
}
