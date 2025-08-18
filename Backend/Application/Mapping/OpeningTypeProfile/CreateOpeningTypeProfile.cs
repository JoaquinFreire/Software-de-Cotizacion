using AutoMapper;
using Domain.Entities;
using Application.DTOs.OpeningTypeDTOs.CreateOpeningType;

namespace Application.Mapping.OpeningTypeProfile
{
    public class CreateOpeningTypeProfile : Profile
    {
        public CreateOpeningTypeProfile()
        {
            CreateMap<CreateOpeningTypeDTO, Opening_Type>();
        }
    }
}
