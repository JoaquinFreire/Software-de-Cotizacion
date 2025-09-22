namespace Application.DTOs.PriceDTOs.UpdatePrice
{
    public class UpdatePriceDTO
    {
        public required string name { get; set; }
        public decimal price { get; set; }
        public required string reference { get; set; }
    }
}
