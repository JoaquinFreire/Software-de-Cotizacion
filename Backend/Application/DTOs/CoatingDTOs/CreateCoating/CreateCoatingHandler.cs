using MediatR;
using AutoMapper;
using Application.Services;
using Domain.Entities;

namespace Application.DTOs.CoatingDTOs.CreateCoating
{
    public class CreateCoatingHandler : IRequestHandler<CreateCoatingCommand, string>
    {
        private readonly IMapper _mapper;
        private readonly CoatingServices _coatingServices;
        public CreateCoatingHandler(IMapper mapper, CoatingServices coatingServices)
        {
            _mapper = mapper;
            _coatingServices = coatingServices;
        }
        public async Task<string> Handle(CreateCoatingCommand request, CancellationToken cancellationToken)
        {
            var coating = _mapper.Map<Coating>(request.Coating);
            await _coatingServices.AddAsync(coating);
            return coating.id.ToString();
        }
    }
}
