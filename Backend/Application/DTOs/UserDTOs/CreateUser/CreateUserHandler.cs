using AutoMapper;
using MediatR;
using Application.Services;
using Domain.Entities;
namespace Application.DTOs.UserDTOs.CreateUser;

public class CreateUserHandler : IRequestHandler<CreateuserCommand, int>
{
    private readonly UserServices _userServices;
    private readonly IMapper _mapper;

    public CreateUserHandler(UserServices userServices, IMapper mapper)
    {
        _userServices = userServices;
        _mapper = mapper;
    }

    public async Task<int> Handle(CreateuserCommand request, CancellationToken cancellationToken)
    {
        var user = _mapper.Map<User>(request.User);

        await _userServices.AddAsync(user);
        return user.id; 
    }
}

