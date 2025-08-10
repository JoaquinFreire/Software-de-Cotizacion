using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.BudgetDTOs.GetBudget
{
    public class GetBudgetByIdComplementDTO
    {
        public List<GetBudgetByIdComplementDoorDTO>? ComplementDoor { get; set; }
        public List<GetBudgetByIdComplementPartitionDTO>? ComplementPartition { get; set; }
        public List<GetBudgetByIdComplementRailingDTO>? ComplementRailing { get; set; }
        public decimal price { get; set; } // Precio total de los complementos
    }
}
