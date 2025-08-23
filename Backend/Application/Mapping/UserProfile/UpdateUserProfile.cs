using AutoMapper;
using Domain.Entities;
using Application.DTOs.UserDTOs.UpdateUser;

namespace Application.Mapping.UserProfile
{
    public class UpdateUserProfile : Profile
    {
        public UpdateUserProfile()
        {
            CreateMap<UpdateUserDTO, User>().ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
        }
    }
}
