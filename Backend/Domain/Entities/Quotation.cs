using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Entities
{
    public class Quotation
    {
        public int Id { get; set; }  // ID auto-generado

        [Column("id_customer")]
        public int CustomerId { get; set; }  // Clave foránea hacia Customer

        [Column("id_user")]
        public int UserId { get; set; }  // Clave foránea hacia User

        [Column("id_workplace")]
        public int WorkPlaceId { get; set; }  // Clave foránea hacia WorkPlace

        [Column("status")]
        public string Status { get; set; } = "pending";  // Estado de la cotización

        [Column("total_price")]
        public decimal TotalPrice { get; set; }  // Precio total de la cotización

        [Column("last_edit", TypeName = "datetime")]
        public DateTime LastEdit { get; set; } = DateTime.UtcNow;  // Última edición

        [Column("creation_date", TypeName = "datetime")]
        public DateTime CreationDate { get; set; } = DateTime.UtcNow;  // Fecha de creación

        // Relación con User
        public User? User { get; set; }

        // Relación con WorkPlace
        public WorkPlace? WorkPlace { get; set; }

        // Relación con Customer
        public Customer? Customer { get; set; }
    }
}
