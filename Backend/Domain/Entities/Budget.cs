using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using Enums;

namespace Entities
{
    public class Budget
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)] // <- Indica que es un objeto llave
        public string Id { get; set; }

        [BsonElement("creation_date")] // <- Nombre con el que se va a subir a Mongo
        public DateOnly CreationDate { get; set; }

        [BsonElement("status")]
        public BudgetStatus Status { get; set; }

        [BsonElement("last_edit")]
        public DateOnly LastEdit { get; set; }

        [BsonElement("employee")]
        public User Employee { get; set; }

        [BsonElement("customer")]
        public Customer Customer { get; set; }

        [BsonElement("workspace")]
        public WorkSpace Workspace { get; set; }
    }
}
