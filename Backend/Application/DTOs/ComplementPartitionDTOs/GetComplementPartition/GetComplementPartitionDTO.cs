namespace Application.DTOs.ComplementPartitionDTOs.GetComplementPartition
{
    public class GetComplementPartitionDTO
    {
        // id necesario para frontend
        public int id { get; set; }

        public required string name { get; set; }
        public decimal price { get; set; }
    }
}
