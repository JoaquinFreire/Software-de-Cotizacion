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
        public string name { get; set; }
        [BsonElement("lastName")]
        [Required]
        public string lastname { get; set; }
        [BsonElement("telephoneNumber")]
        public string telephoneNumber { get; set; }
        [BsonElement("email")]
        public string email { get; set; }
    }
}

