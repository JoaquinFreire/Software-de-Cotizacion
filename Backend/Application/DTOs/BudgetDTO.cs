using Domain.Entities;
using Domain.Enums;
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
        public string id { get; set; } = string.Empty;
        public DateTime? creationDate { get; set; } = DateTime.UtcNow;
        public BudgetStatus? status { get; set; } = BudgetStatus.Pending;
        public BudgetUserDTO? user { get; set; }
        public CustomerDTO? customer { get; set; }
        public WorkPlaceDTO? workPlace { get; set; }
        public List<Budget_ProductDTO> Products { get; set; } = new List<Budget_ProductDTO>(); // Lista de productos
        public DateTime? ExpirationDate { get; set; }
        public DateTime? EndDate { get; set; } = null;
        public string Comment { get; set; } = string.Empty;
        public double DollarReference { get; set; }
        public double LabourReference { get; set; }
        public double Total { get; set; }
    }
}
