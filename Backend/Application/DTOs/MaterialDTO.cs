using Domain.Entities;
using Domain.Enums;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace Application.DTOs
{
    public class MaterialDTO
    {
        public string name { get; set; }
        public MaterialTypeDTO type { get; set; }
        [BsonIgnore][JsonIgnore]
        public double price { get; set; }
    }
}
