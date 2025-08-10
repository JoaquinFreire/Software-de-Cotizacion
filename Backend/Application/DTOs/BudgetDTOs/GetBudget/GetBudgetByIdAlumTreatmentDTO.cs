using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.BudgetDTOs.GetBudget
{
    public class GetBudgetByIdAlumTreatmentDTO
    {
        public required string name { get; set; }
        public decimal price { get; set; }//Verificar
    }
}
