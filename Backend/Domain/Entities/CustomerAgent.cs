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
        public string name { get; set; } = string.Empty;
        [BsonElement("telephoneNumber")]
        public string tel { get; set; } = string.Empty;
        [BsonElement("mail")]
        public string mail { get; set; } = string.Empty;
        [BsonElement("lastName")]
        [Required]
        public string lastname { get; set; } = string.Empty;
    }
}

