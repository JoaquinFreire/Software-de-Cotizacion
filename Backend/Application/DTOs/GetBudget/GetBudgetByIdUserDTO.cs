using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.GetBudget
{
    public class GetBudgetByIdUserDTO
    {
        public string name { get; set; }
        public string lastName { get; set; }
        public string mail { get; set; }
    }
}
