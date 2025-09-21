using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.AlumTreatmentDTOs.GetAlumTreatment
{
    public class GetAlumTreatmentDTO
    {
        // nuevo: exponer el id para que el frontend pueda hacer PUT/DELETE
        public int id { get; set; }

        public required string name { get; set; }
        public int pricePercentage { get; set; }
    }
}
