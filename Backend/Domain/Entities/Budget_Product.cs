using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Domain.Entities
{
    public class Budget_Product
    {
        [BsonElement("Product")]
        public Opening_Type? OpeningType { get; set; }
        [BsonElement("AluminiumTreatment")]
        public AlumTreatment? AlumTreatment { get; set; }  //Tiene que almacenar el tratamiento de aluminio
        [BsonElement("glassType")]
        public GlassType? GlassType { get; set; }  //Tiene que almacenar el tipo de vidrio
        [BsonElement("width")]
        public required double width { get; set; }
        [BsonElement("height")]
        public required double height { get; set; }
        [BsonElement("widthPanelQuantity")]
        public required int WidthPanelQuantity { get; set; } // Cantidad de paneles en ancho
        [BsonElement("heightPanelQuantity")]
        public required int HeightPanelQuantity { get; set; } // Cantidad de paneles en alto
        [BsonElement("panelWidth")]
        public required double PanelWidth { get; set; } // Ancho de cada panel
        [BsonElement("panelHeight")]
        public required double PanelHeight { get; set; } // Alto de cada panel
        [BsonElement("quantity")]
        public required int Quantity { get; set; }
        [BsonElement("price")]
        public decimal? price { get; set; } // Precio unitario del producto
        [BsonElement("Accesories")]
        public List<BudgetAccesory>? Accesory { get; set; } = new List<BudgetAccesory>();
    }
}