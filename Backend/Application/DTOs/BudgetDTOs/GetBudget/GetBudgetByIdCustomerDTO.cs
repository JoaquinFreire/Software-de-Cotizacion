using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.BudgetDTOs.GetBudget
{
    public class GetBudgetByIdCustomerDTO
    {
        public required string name { get; set; }
        public required string lastname { get; set; }
        public required string tel { get; set; }
        public required string mail { get; set; }
        public required string address { get; set; }
        public required string dni { get; set; }
        public GetBudgetByIdCustomerAgentDTO? agent { get; set; }
    }
}
