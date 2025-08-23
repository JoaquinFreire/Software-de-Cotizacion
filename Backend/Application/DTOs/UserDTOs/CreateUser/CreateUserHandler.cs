using Application.Services;
using MediatR;
using AutoMapper;
using Domain.Entities;

namespace Application.DTOs.UserDTOs.CreateUser
{
    public class CreateUserHandler : IRequestHandler<CreateUserCommand, Unit>
    {
        private readonly UserServices _services;
        private readonly IMapper _mapper;
        public CreateUserHandler(UserServices services, IMapper mapper)
        {
            _services = services;
            _mapper = mapper;
        }
        public async Task<Unit> Handle(CreateUserCommand request, CancellationToken cancellationToken)
        {
            var userEntity = _mapper.Map<User>(request.userDTO);
            await _services.AddAsync(userEntity);
            return Unit.Value;
        }
    }
}
