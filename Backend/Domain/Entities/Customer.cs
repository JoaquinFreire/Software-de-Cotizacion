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
        public string name { get; set; } = string.Empty;
        [BsonElement("lastName")]
        public string lastname { get; set; } = string.Empty;
        [BsonElement("telephoneNumber")]
        public string tel { get; set; } = string.Empty;
        [BsonElement("mail")]
        public string mail { get; set; } = string.Empty;
        [BsonElement("address")]
        public string address { get; set; } = string.Empty;
        [BsonElement("dni")]
        public string dni { get; set; } = string.Empty;
        [BsonIgnore]
        [Column(TypeName = "datetime")]
        public DateTime registration_date { get; set; } = DateTime.UtcNow; // Inicializar con la fecha actual

        // NUEVO: Relación muchos a muchos
        [BsonIgnore]
        public List<CustomerAgent> Agents { get; set; } = new();
    }
}

