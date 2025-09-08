using AutoMapper;
using MediatR;
using Application.Services;
using Application.Validators.UserValidator;
using Domain.Entities;

namespace Application.DTOs.UserDTOs.CreateUser;

public class CreateUserHandler : IRequestHandler<CreateUserCommand, Unit>
{
    private readonly UserServices _services;
    private readonly IMapper _mapper;
    private readonly IUserValidator _validator;
    public CreateUserHandler(UserServices services, IMapper mapper, IUserValidator validator)
    {
        _services = services;
        _mapper = mapper;
        _validator = validator;
    }
    public async Task<Unit> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        var user = _mapper.Map<User>(request.user);
        await _validator.Validate(user);
        await _services.AddAsync(user);
        return Unit.Value;
    }
}

