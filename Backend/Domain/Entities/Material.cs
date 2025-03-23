using Domain.Enums;

namespace Domain.Entities;
public class Material
{
    public int id { get; set; }
    public string? name { get; set; }
    public double price { get; set; }
    public int type_id { get; set; }    
    public MaterialType? type { get; set; }
    public MaterialUnit unit { get; set; }  // Relación
}
