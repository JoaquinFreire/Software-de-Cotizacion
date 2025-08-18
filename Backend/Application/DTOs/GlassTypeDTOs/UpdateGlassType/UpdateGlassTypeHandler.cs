using AutoMapper;
using MediatR;
using Application.Services;
using Domain.Entities;

namespace Application.DTOs.GlassTypeDTOs.UpdateGlassType
{
    public class UpdateGlassTypeHandler : IRequestHandler<UpdateGlassTypeCommand, Unit>
    {
        private readonly GlassTypeServices _services;
        private readonly IMapper _mapper;
        public UpdateGlassTypeHandler(GlassTypeServices glassTypeService, IMapper mapper)
        {
            _services = glassTypeService;
            _mapper = mapper;
        }
        public async Task<Unit> Handle(UpdateGlassTypeCommand request, CancellationToken cancellationToken)
        {
            var glassType = await _services.GetByIdAsync(request.id);
            if (glassType == null)
            {
                throw new KeyNotFoundException($"Glass type with ID {request.id} not found.");
            }
            _mapper.Map(request.glassType, glassType);
            await _services.UpdateAsync(glassType);
            return Unit.Value;
        }
    }
}
