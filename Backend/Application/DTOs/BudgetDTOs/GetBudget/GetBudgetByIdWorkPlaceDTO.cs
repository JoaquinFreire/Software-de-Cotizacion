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
        public required string name { get; set; }
        public required string location { get; set; }
        public required string address { get; set; }
        public required GetBudgetByIdWorkTypeDTO WorkType { get; set; }
    }
}
