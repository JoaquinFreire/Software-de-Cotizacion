using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Entities
{
    public class Quotation
    {
        public int Id { get; set; }  // ID auto-generado
        [Column("id_customer")]
        public int CustomerId { get; set; }

        [Column("id_user")]
        public int UserId { get; set; }

        [Column("id_workplace")]
        public int WorkPlaceId { get; set; }

        [Column("status")]
        public string Status { get; set; } = "pending";

        [Column("total_price")]
        public decimal TotalPrice { get; set; }

        [Column("last_edit", TypeName = "datetime")]
        public DateTime LastEdit { get; set; } = DateTime.UtcNow;

        [Column("creation_date", TypeName = "datetime")]
        public DateTime CreationDate { get; set; } = DateTime.UtcNow; // Agrega esta línea

        // Relación con entidades 
        public User? User { get; set; }

        // Relación con Workplace
        public WorkPlace? WorkPlace { get; set; }
        public Customer? Customer { get; set; }

    }
}
