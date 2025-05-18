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
        public CreateBudgetUserDTO? user { get; set; } // TODO: Sacar los "?" por public required - Para Leo
        public CreateBudgetCustomerDTO? customer { get; set; }
        public CreateBudgetWorkPlaceDTO? workPlace { get; set; }
        public List<CreateBudgetProductDTO> Products { get; set; } = new List<CreateBudgetProductDTO>(); // Lista de productos
        public string Comment { get; set; } = string.Empty;
    }
}
