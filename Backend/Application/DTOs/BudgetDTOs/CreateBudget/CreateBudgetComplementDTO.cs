using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.BudgetDTOs.CreateBudget
{
    public class CreateBudgetComplementDTO
    {
        public List<CreateBudgetComplementDoorDTO>? ComplementDoor { get; set; } = new List<CreateBudgetComplementDoorDTO>();
        public List<CreateBudgetComplementRailingDTO>? ComplementRailing { get; set; } = new List<CreateBudgetComplementRailingDTO>();
        public List<CreateBudgetComplementPartitionDTO> ComplementPartition { get; set; } = new List<CreateBudgetComplementPartitionDTO>();
        public decimal price { get; set; } // Precio total de los complementos
    }
}
