using Domain.Entities;
using Application.DTOs.GlassTypeDTOs.CreateGlassType;
using AutoMapper;

namespace Application.Mapping.GlassTypeProfile
{
    public class CreateGlassTypeProfile : Profile
    {
        public CreateGlassTypeProfile()
        {
            CreateMap<CreateGlassTypeDTO, GlassType>().ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));
        }
    }
}
