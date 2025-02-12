using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entities
{
    internal class MaterialType
    {
        public int id { get; set; }
        public string name { get; set; }
        public MaterialCategory category { get; set; }
    }
}
