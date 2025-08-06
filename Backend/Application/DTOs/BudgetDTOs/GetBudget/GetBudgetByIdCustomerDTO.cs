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
        public string name { get; set; }
        public string lastname { get; set; }
        public string tel { get; set; }
        public string mail { get; set; }
        public string address { get; set; }
        public string dni { get; set; }
        public GetBudgetByIdCustomerAgentDTO agent { get; set; }
    }
}
