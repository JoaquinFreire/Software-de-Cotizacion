using MediatR;
using AutoMapper;
using Application.Services;
using Application.DTOs.ComplementRailingDTOs.CreateComplementRailing;
using Domain.Entities;

namespace Application.DTOs.ComplementRailingDTOs.CreateComplementRailing
{
    public class CreateComplementHandler : IRequestHandler<CreateComplementRailingCommand, Unit>
    {
        private readonly ComplementRailingServices _services;
        private readonly IMapper _mapper;
        public CreateComplementHandler(ComplementRailingServices services, IMapper mapper)
        {
            _services = services;
            _mapper = mapper;
        }
        public async Task<Unit> Handle(CreateComplementRailingCommand request, CancellationToken cancellationToken)
        {
            var complementRailing = _mapper.Map<CreateComplementRailingDTO, ComplementRailing>(request.Railing);
            await _services.AddAsync(complementRailing);
            return Unit.Value;
        }
    }
}
