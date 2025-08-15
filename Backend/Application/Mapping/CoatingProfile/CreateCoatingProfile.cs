using Application.DTOs.CoatingDTOs.CreateCoating;
using AutoMapper;
using Domain.Entities;

namespace Application.Mapping.CoatingProfile
{
    public class CreateCoatingProfile : Profile
    {
        public CreateCoatingProfile() {
        CreateMap<CreateCoatingDTO, Coating>();
        }
    }
}
