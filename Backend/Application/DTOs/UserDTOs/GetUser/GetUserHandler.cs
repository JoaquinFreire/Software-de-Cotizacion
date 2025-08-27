using Application.Services;
using MediatR;
using Domain.Entities;
using AutoMapper;

namespace Application.DTOs.UserDTOs.GetUser
{
    public class GetUserHandler : IRequestHandler<GetUserQuery, GetUserDTO>
    {
        private readonly UserServices _services;
        private readonly IMapper _mapper;
        public GetUserHandler(UserServices services, IMapper mapper)
        {
            _services = services;
            _mapper = mapper;
        }
        public async Task<GetUserDTO> Handle(GetUserQuery request, CancellationToken cancellationToken)
        {
            var user = await _services.GetByIdAsync(request.id);
            if (user == null) throw new Exception("Usuario no encontrado");
            var userDTO = _mapper.Map<GetUserDTO>(user);
            return userDTO;
        }
    }
}
