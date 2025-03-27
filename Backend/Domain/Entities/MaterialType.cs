/* using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Entities
{
    public class MaterialType
    {
      // Aca puede tirar error por los bsonElement - TODO atención
        [BsonIgnore]
        public int id { get; set; }
        [BsonElement("name")]
        public string? name { get; set; }
        public int category_id { get; set; }
        [BsonIgnore]
        public MaterialCategory? category { get; set; } // Relación
    }
}
 */