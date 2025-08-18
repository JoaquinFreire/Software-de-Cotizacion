using MediatR;
using AutoMapper;
using Domain.Entities;
using Application.Services;

namespace Application.DTOs.PriceDTOs.CreatePrice
{
    public class CreatePriceHandler : IRequestHandler<CreatePriceCommand, Unit>
    {
        private readonly IMapper _mapper;
        private readonly PriceServices _services;
        public CreatePriceHandler(IMapper mapper, PriceServices services)
        {
            _mapper = mapper;
            _services = services;
        }
        public async Task<Unit> Handle(CreatePriceCommand request, CancellationToken cancellationToken)
        {
            var priceEntity = _mapper.Map<Price>(request.PriceDTO);
            await _services.AddAsync(priceEntity);
            return Unit.Value;
        }
    }
}
