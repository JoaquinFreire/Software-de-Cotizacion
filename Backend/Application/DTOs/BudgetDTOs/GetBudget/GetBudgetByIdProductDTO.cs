using Domain.Entities;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.BudgetDTOs.GetBudget
{
    public class GetBudgetByIdProductDTO
    {
        public GetBudgetByIdOpeningTypeDTO? OpeningType { get; set; }
        public int? Quantity { get; set; }
        public GetBudgetByIdAlumTreatmentDTO? AlumTreatment { get; set; }  //Tiene que almacenar el tratamiento de aluminio
        public GetBudgetByIdGlassTypeDTO GlassType { get; set; }  //Tiene que almacenar el tipo de vidrio
        public double? width { get; set; }
        public double? height { get; set; }
        public double? price { get; set; } // Precio unitario del producto
        public List<GetBudgetByIdAccesoryDTO> Accesory { get; set; }
    }
}
