using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.AlumTreatmentDTOs.GetAlumTreatment
{
    public class GetAlumTreatmentDTO
    {
        public required string name { get; set; }
        public int pricePercentage { get; set; }
    }
}
