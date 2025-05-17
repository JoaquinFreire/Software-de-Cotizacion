using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.CreateBudget
{
    public class CreateBudgetProductDTO
    {
        public CreateBudgetOpeningTypeDTO? OpeningType { get; set; }
        public int? Quantity { get; set; }
        public CreateBudgetAlumTreatmentDTO? AlumTreatment { get; set; }
        public CreateBudgetComplementDTO? GlassComplement { get; set; }
        public double? width { get; set; }
        public double? height { get; set; }
        public List<CreateBudgetAccesoryDTO> Accesory { get; set; } = new List<CreateBudgetAccesoryDTO>();
    }
}
