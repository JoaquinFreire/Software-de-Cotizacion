using Domain.Entities;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.BudgetDTOs.GetBudget
{
    public class GetBudgetByIdWorkPlaceDTO
    {
        public string? name { get; set; }
        public string? address { get; set; }
        public GetBudgetByIdWorkTypeDTO? WorkType { get; set; }
    }
}
