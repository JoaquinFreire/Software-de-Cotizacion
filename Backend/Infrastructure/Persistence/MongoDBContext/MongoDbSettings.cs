using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Persistence.MongoDBContext
{
    public class MongoDbSettings
    {
        //Variables para la preservación de datos de conexión. Se las inicializa como Empty para evitar la excepción NullReferenceException
        public string ConnectionString { get; set; } = string.Empty;
        public string DatabaseName { get; set; } = string.Empty;
        public string CollectionName { get; set; } = string.Empty;
        
        public MongoDbSettings() { }
    }
}
