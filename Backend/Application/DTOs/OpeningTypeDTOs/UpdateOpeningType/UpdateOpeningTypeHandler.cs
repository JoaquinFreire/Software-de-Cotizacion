using Application.Services;
using AutoMapper;
using Domain.Entities;
using MediatR;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;

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
            // Obtener entidad existente (asociada al mismo DbContext) y mapear sobre ella
            var existing = await _services.GetByIdAsync(request.id);
            if (existing == null) throw new KeyNotFoundException("OpeningType not found");

            // Mapear DTO sobre la entidad existente — esto preserva image_url si DTO.image_url es null
            _mapper.Map(request.OpeningType, existing);
            existing.id = request.id;

            await _services.UpdateAsync(existing);
            return Unit.Value;
        }
    }
}
