using Application.Services;
using AutoMapper;
using MediatR;
using Domain.Entities;

namespace Application.DTOs.OpeningTypeDTOs.CreateOpeningType
{
    public class CreateOpeningTypeHandler : IRequestHandler<CreateOpeningTypeCommand, Unit>
    {
        private readonly OpeningTypeServices _services;
        private readonly IMapper _mapper;
        public CreateOpeningTypeHandler(OpeningTypeServices services, IMapper mapper)
        {
            _services = services;
            _mapper = mapper;
        }
        public async Task<Unit> Handle(CreateOpeningTypeCommand request, CancellationToken cancellationToken)
        {
            var openingType = _mapper.Map<Opening_Type>(request.OpeningType);
            await _services.AddAsync(openingType);
            return Unit.Value;
        }
    }
}
