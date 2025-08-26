using AutoMapper;
using Domain.Entities;
using Application.DTOs.UserDTOs.UpdateUserStatus;

namespace Application.Mapping.UserProfile
{
    public class UpdateUserStatusProfile : Profile
    {
        public UpdateUserStatusProfile()
        {
            CreateMap<UpdateUserStatusDTO, User>().ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
        }
    }
}
