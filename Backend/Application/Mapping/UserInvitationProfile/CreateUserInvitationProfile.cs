using AutoMapper;
using Domain.Entities;
using Application.DTOs.UserInvitationDTOs.CreateUserInvitation;

namespace Application.Mapping.UserInvitationProfile
{
    public class CreateUserInvitationProfile : Profile
    {
        public CreateUserInvitationProfile()
        {
            CreateMap<UserInvitation, CreateUserInvitationDTO>().ReverseMap();
        }
    }
}
