using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using MongoDB.Bson.Serialization.Attributes;

namespace Domain.Entities
{
    public class CustomerAgent
    {
        [BsonIgnore]
        public int id { get; set; }
        [BsonElement("name")]
        public required string name { get; set; }
        [BsonElement("lastName")]
        [Required]
        public required string lastname { get; set; }
        [BsonElement("telephoneNumber")]
        public required string tel { get; set; }
        [BsonElement("mail")]
        public required string mail { get; set; }
        // NUEVO: Relación muchos a muchos
        [BsonIgnore]
        public List<Customer> Customers { get; set; } = new();

    }
}

