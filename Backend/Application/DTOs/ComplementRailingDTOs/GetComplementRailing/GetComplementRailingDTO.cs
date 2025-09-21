namespace Application.DTOs.ComplementRailingDTOs.GetComplementRailing
{
    public class GetComplementRailingDTO
    {
        // añadir id para que el frontend pueda ejecutar PUT/DELETE correctamente
        public int id { get; set; }

        public required string name { get; set; }
        public decimal price { get; set; }
    }
}
