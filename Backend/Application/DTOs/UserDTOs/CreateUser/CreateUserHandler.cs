using AutoMapper;
using MediatR;
using Application.Services;
using Domain.Entities;
namespace Application.DTOs.UserDTOs.CreateUser;

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
        var user = _mapper.Map<User>(request.user);
        await _services.AddAsync(user);
        return Unit.Value;
    }
}

