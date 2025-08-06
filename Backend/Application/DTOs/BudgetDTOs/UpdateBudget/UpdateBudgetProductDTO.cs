using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.BudgetDTOs.UpdateBudget
{
    public class UpdateBudgetProductDTO
    {
        public UpdateBudgetOpeningTypeDTO OpeningType { get; set; }
        public int Quantity { get; set; }
        public UpdateBudgetAlumTreatmentDTO AlumTreatment { get; set; }
        public UpdateBudgetComplementDTO GlassComplement { get; set; }
        public double width { get; set; }
        public double height { get; set; }
        public decimal price { get; set; }
        public List<UpdateBudgetAccesoriesDTO> Accesory { get; set; }
    }
}
