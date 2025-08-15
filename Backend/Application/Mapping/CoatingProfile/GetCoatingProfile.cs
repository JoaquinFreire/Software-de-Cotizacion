using Domain.Entities;
using Application.DTOs.CoatingDTOs.GetCoating;
using AutoMapper;

namespace Application.Mapping.CoatingProfile
{
    public class GetCoatingProfile : Profile
    {
        public GetCoatingProfile() {
        CreateMap<Coating, GetCoatingDTO>();
        }
    }
}
