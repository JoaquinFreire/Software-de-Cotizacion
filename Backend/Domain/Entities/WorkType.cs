using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations.Schema;
using MongoDB.Bson.Serialization.Attributes;

namespace Domain.Entities
{
    [Table("worktype")]  // Asegúrate de que la tabla se llame "worktype"
    public class WorkType
    {
        [BsonIgnore]
        public int id { get; set; }
        [BsonElement("type")]
        public string? type { get; set; }
    }
}
