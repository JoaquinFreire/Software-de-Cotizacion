using AutoMapper;
using Domain.Entities;
using Application.DTOs.GlassTypeDTOs.GetGlassType;

namespace Application.Mapping.GlassTypeProfile
{
    public class GetGlassTypeProfile : Profile
    {
        public GetGlassTypeProfile()
        {
            CreateMap<GlassType, GetGlassTypeDTO>();
        }
    }
}
