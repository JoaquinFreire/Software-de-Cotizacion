using AutoMapper;
using Domain.Entities;
using Application.DTOs.CoatingDTOs.UpdateCoating;

namespace Application.Mapping.CoatingProfile
{
    public class UpdateCoatingProfile : Profile
    {
        public UpdateCoatingProfile()
        {
            CreateMap<UpdateCoatingDTO, Coating>().ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));
        }
    }
}
