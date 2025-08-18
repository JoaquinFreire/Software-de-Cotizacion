using Domain.Entities;
using AutoMapper;
using MediatR;
using Application.Services;

namespace Application.DTOs.PriceDTOs.UpdatePrice
{
    public class UpdatePriceHandler : IRequestHandler<UpdatePriceCommand, Unit>
    {
        private readonly PriceServices _services;
        private readonly IMapper _mapper;
        public UpdatePriceHandler(PriceServices services, IMapper mapper)
        {
            _services = services;
            _mapper = mapper;
        }
        public async Task<Unit> Handle(UpdatePriceCommand request, CancellationToken cancellationToken)
        {
            var price = _mapper.Map<Price>(request.Price);
            price.id = request.Id;
            await _services.UpdateAsync(price);
            return Unit.Value;
        }
    }
}
