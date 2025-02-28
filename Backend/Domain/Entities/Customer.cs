using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations.Schema;


namespace Domain.Entities;

public class Customer
{
    public int id { get; set; }
    public string name { get; set; }
    public string lastname { get; set; }
    public string tel { get; set; }
    public string mail { get; set; }
    public string address { get; set; }
    public string registration_date { get; set; }

    // Clave foránea para CustomerAgent
    [Column("id_agent")]
    public int? agentId { get; set; }
    public CustomerAgent? agent { get; set; }
}

