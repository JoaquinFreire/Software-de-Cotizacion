using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Enums;

namespace Entities
{
    internal class Material
    {
        public int id { get; set; }
        public string name { get; set; }
        public MaterialType type { get; set; }
        public double price { get; set; }
        public MaterialUnit unit { get; set; }
    }
}
