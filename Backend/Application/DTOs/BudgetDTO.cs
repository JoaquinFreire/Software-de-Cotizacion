using Domain.Entities;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs
{
    public class BudgetDTO
    {
        public DateTime? creationDate { get; set; }
        public string? status { get; set; }
        public UserDTO? user { get; set; }
        public CustomerDTO? customer { get; set; }
        public WorkPlaceDTO? workPlace { get; set; }
        [BsonElement("productos")]
        public List<Budget_ProductDTO> Products { get; set; } = new List<Budget_ProductDTO>(); // Lista de productos
    }
}
