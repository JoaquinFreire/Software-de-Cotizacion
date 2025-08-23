using AutoMapper;
using MediatR;
using Application.Services;
using MediatR;
using AutoMapper;
using Domain.Entities;
namespace Application.DTOs.UserDTOs.CreateUser;

public class CreateUserHandler : IRequestHandler<CreateuserCommand, int>
{
    private readonly IMapper _mapper;
    {
        _mapper = mapper;
    }
    {
    }
}

