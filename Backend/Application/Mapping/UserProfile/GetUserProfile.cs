using AutoMapper;
using Domain.Entities;
using Application.DTOs.UserDTOs.GetUser;

namespace Application.Mapping.UserProfile
{
    public class GetUserProfile : Profile
    {
        public GetUserProfile()
        {
            CreateMap<User, GetUserDTO>()
            .ForMember(dest => dest.role, opt => opt.MapFrom(src => src.role.role_name));

        }
    }
}
