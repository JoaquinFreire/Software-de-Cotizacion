using AutoMapper;
using Domain.Entities;
using Application.DTOs.UserDTOs.CreateUser;
namespace Application.Mapping.UserProfile;

public class CreateUserProfile : Profile
{
    public CreateUserProfile()
    {
        CreateMap<CreateUserDTO, User>();            
    }
}
