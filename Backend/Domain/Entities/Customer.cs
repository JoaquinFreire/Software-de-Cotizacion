using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities;

    public class Customer
    {
        public int id { get; set; }
        public string name { get; set; }
        public string lastname { get; set; }
        public string telephoneNumber { get; set; }
        public string email { get; set; }
        public string address { get; set; }
        public string registration_date { get; set; }
        public CustomerAgent agent { get; set; }
    }

