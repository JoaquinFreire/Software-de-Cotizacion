using MediatR;

namespace Application.DTOs.PriceDTOs.UpdatePrice
{
    public class UpdatePriceCommand : IRequest<Unit>
    {
        public int Id { get; set; }
        public required UpdatePriceDTO Price { get; set; }
    }
}
