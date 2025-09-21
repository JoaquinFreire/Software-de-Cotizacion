using MediatR;
using AutoMapper;
using Application.Services;
using Domain.Entities;
using System.Threading;
using System.Threading.Tasks;

namespace Application.DTOs.GlassTypeDTOs.CreateGlassType
{
    public class CreateGlassTypeHandler : IRequestHandler<CreateGlassTypeCommand, string>
    {
        private readonly IMapper _mapper;
        private readonly GlassTypeServices _services;

        public CreateGlassTypeHandler(IMapper mapper, GlassTypeServices services)
        {
            _mapper = mapper;
            _services = services;
        }

        public async Task<string> Handle(CreateGlassTypeCommand request, CancellationToken cancellationToken)
        {
            var entity = _mapper.Map<GlassType>(request.GlassType);
            await _services.AddAsync(entity);
            return entity.id.ToString();
        }
    }
}
