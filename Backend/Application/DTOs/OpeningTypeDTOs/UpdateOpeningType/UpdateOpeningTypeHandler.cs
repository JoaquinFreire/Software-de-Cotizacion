using Application.Services;
using AutoMapper;
using Domain.Entities;
using MediatR;

namespace Application.DTOs.OpeningTypeDTOs.UpdateOpeningType
{
    public class UpdateOpeningTypeHandler : IRequestHandler<UpdateOpeningTypeCommand, Unit>
    {
        private readonly OpeningTypeServices _services;
        private readonly IMapper _mapper;
        public UpdateOpeningTypeHandler(OpeningTypeServices services, IMapper mapper)
        {
            _services = services;
            _mapper = mapper;
        }
        public async Task<Unit> Handle(UpdateOpeningTypeCommand request, CancellationToken cancellationToken)
        {
            var openingType = _mapper.Map<Opening_Type>(request.OpeningType);
            openingType.id = request.id;
            await _services.UpdateAsync(openingType);
            return Unit.Value;
        }
    }
}
