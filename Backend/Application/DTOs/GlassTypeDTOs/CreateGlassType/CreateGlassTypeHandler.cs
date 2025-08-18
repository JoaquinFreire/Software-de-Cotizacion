using Application.Services;
using AutoMapper;
using Domain.Entities;
using MediatR;

namespace Application.DTOs.GlassTypeDTOs.CreateGlassType
{
    public class CreateGlassTypeHandler : IRequestHandler<CreateGlassTypeCommand, Unit>
    {
        private readonly GlassTypeServices _services;
        private readonly IMapper _mapper;
        public CreateGlassTypeHandler(GlassTypeServices glassTypeService, IMapper mapper)
        {
            _services = glassTypeService;
            _mapper = mapper;
        }
        public async Task<Unit> Handle(CreateGlassTypeCommand request, CancellationToken cancellationToken)
        {
            var glassType = _mapper.Map<CreateGlassTypeDTO, GlassType>(request.GlassType);
            await _services.AddAsync(glassType);
            return Unit.Value;
        }
    }
}
