using Domain.Entities;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs
{
    public class Budget_ProductDTO
    {
        public string? Name { get; set; }
        public ProductTypeDTO? Type { get; set; }
        public int? Quantity { get; set; }
        public MaterialDTO? AlumMaterial { get; set; }
        public MaterialDTO? GlassMaterial { get; set; }
        public double? width { get; set; }
        public double? height { get; set; }
        public List<Budget_AccesoryDTO> Accesory { get; set; } = new List<Budget_AccesoryDTO>();
    }
}
