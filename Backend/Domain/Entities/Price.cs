using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class Price
    {
        public int id { get; set; }
        public required string name { get; set; }
        public required decimal price { get; set; }
        public required string reference { get; set; }
    }
}
