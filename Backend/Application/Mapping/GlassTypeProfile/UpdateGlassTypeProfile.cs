using AutoMapper;
using Domain.Entities;
using Application.DTOs.GlassTypeDTOs.UpdateGlassType;

namespace Application.Mapping.GlassTypeProfile
{
    public class UpdateGlassTypeProfile : Profile
    {
        public UpdateGlassTypeProfile()
        {
            CreateMap<UpdateGlassTypeDTO, GlassType>().ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));
        }
    }
}
