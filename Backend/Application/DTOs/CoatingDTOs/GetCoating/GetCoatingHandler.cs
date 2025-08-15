using Application.Services;
using AutoMapper;
using MediatR;

namespace Application.DTOs.CoatingDTOs.GetCoating
{
    public class GetCoatingHandler : IRequestHandler<GetCoatingQuery, GetCoatingDTO>
    {
        private readonly IMapper _mapper;
        private readonly CoatingServices _services;
        public GetCoatingHandler(IMapper mapper, CoatingServices services)
        {
            _mapper = mapper;
            _services = services;
        }
        public async Task<GetCoatingDTO> Handle(GetCoatingQuery request, CancellationToken cancellationToken)
        {
            var coating = await _services.GetByIdAsync(request.Id).ContinueWith(task =>
            {
                if (task.Result == null)
                {
                    throw new Exception($"No se encontró un revestimiento con el ID: {request.Id}");
                }
                return task.Result;
            });
            return _mapper.Map<GetCoatingDTO>(coating);
        }
    }    
}
