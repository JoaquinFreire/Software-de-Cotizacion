using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.CustomerDTOs.CreateCustomer
{
    public class CreateCustomerDTO
    {
        //TODO: Verificar si esta bien para SQL
        public required string name { get; set; }
        public required string lastname { get; set; }
        public required string tel { get; set; }
        public required string mail { get; set; }
        public required string address { get; set; }
        public required string dni { get; set; }
        public CreateCustomerAgentDTO? agent { get; set; }
    }
}
