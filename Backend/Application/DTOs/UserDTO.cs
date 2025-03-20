using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs
{
    public class UserDTO
    {
        public int id { get; set; }
        public string? name { get; set; }
        public string? lastName { get; set; }
        public string? legajo { get; set; }
        public string? role { get; set; }
    }
}
