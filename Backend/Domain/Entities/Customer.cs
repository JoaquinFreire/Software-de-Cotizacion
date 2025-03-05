using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations.Schema;
using MongoDB.Bson.Serialization.Attributes;

namespace Domain.Entities
{
    public class Customer
    {
        [BsonIgnore]
        public int id { get; set; }
        [BsonElement("name")]
        public string name { get; set; }
        [BsonElement("lastname")]
        public string lastname { get; set; }
        [BsonElement("telephoneNumber")]
        public string tel { get; set; }
        [BsonElement("email")]
        public string mail { get; set; }
        [BsonElement("address")]
        public string address { get; set; }
        [BsonElement("agent")]
        public CustomerAgent? agent { get; set; }

        [Column(TypeName = "datetime")]
        [BsonIgnore]
        public DateTime registration_date { get; set; } = DateTime.UtcNow; // Inicializar con la fecha actual

        // Clave foránea para CustomerAgent
        [Column("id_agent")]
        [BsonIgnore]
        public int? agentId { get; set; }
    }
}

