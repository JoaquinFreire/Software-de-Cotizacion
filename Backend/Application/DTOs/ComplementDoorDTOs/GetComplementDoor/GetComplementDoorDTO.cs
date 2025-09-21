namespace Application.DTOs.ComplementDoorDTOs.GetComplementDoor
{
    public class GetComplementDoorDTO
    {
        // añadir id para que el frontend pueda ejecutar PUT/DELETE correctamente
        public int id { get; set; }

        public required string name { get; set; }
        public required decimal price { get; set; }
        public required string Material { get; set; }
    }
}
