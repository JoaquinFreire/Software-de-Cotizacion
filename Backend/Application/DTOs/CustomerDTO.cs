using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs
{
    public class CustomerDTO
    {
        public string name { get; set; }
        public string lastname { get; set; }
        public string telephoneNumber { get; set; }
        public string email { get; set; }
        public string address { get; set; }
        public CustomerAgentDTO agent { get; set; }

    }
}
