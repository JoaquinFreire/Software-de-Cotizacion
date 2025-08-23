using AutoMapper;
using MediatR;
using Application.Services;
using Domain.Entities;

namespace Application.DTOs.UserDTOs.UpdateUser
{
    public class UpdateUserHandler : IRequestHandler<UpdateUserCommand, Unit>
    {
        private readonly UserServices _services;
        private readonly IMapper _mapper;
        public UpdateUserHandler(UserServices services, IMapper mapper)
        {
            _services = services;
            _mapper = mapper;
        }
        public async Task<Unit> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
        {
            var user = await _services.GetByIdAsync(request.id);
            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID {request.id} not found.");
            }
            _mapper.Map(request.userDTO, user);
            await _services.UpdateAsync(user);
            return Unit.Value;
        }
    }
}
