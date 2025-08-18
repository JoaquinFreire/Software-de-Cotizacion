using MediatR;

namespace Application.DTOs.PriceDTOs.CreatePrice
{
    public class CreatePriceCommand : IRequest<Unit>
    {
        public required CreatePriceDTO PriceDTO { get; set; }
    }
}
