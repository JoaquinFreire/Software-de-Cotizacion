using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Domain.Enums;

namespace Application.DTOs.CreateBudget
{
    public class CreateBudgetDTO
    {
        public required string budgetId { get; set; }
        public required CreateBudgetUserDTO user { get; set; } // TODO: Sacar los "?" por public required - Para Leo
        public required CreateBudgetCustomerDTO customer { get; set; }
        public required CreateBudgetWorkPlaceDTO workPlace { get; set; }
        public required List<CreateBudgetProductDTO> Products { get; set; } = new List<CreateBudgetProductDTO>(); // Lista de productos
        public string Comment { get; set; } = string.Empty;
    }
}
