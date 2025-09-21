using MediatR;
using AutoMapper;
using Application.Services;
using System.Threading;
using System.Threading.Tasks;

namespace Application.DTOs.GlassTypeDTOs.UpdateGlassType
{
    public class UpdateGlassTypeHandler : IRequestHandler<UpdateGlassTypeCommand, bool>
    {
        private readonly GlassTypeServices _services;
        private readonly IMapper _mapper;

        public UpdateGlassTypeHandler(GlassTypeServices services, IMapper mapper)
        {
            _services = services;
            _mapper = mapper;
        }

        public async Task<bool> Handle(UpdateGlassTypeCommand request, CancellationToken cancellationToken)
        {
            var existing = await _services.GetByIdAsync(request.id);
            if (existing == null) throw new KeyNotFoundException($"GlassType with ID {request.id} not found.");

            _mapper.Map(request.glassType, existing);
            await _services.UpdateAsync(existing);
            return true;
        }
    }
}
