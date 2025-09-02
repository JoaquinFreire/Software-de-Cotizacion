using AutoMapper;
using Domain.Entities;
using Application.DTOs.OpeningConfigurationDTOs.GetOpeningConfiguration;

namespace Application.Mapping.OpeningConfigurationProfile
{
    public class GetOpeningConfigurationProfile : Profile
    {
        public GetOpeningConfigurationProfile()
        {
            CreateMap<Opening_Configuration, GetOpeningConfigurationDTO>();
        }
    }
}
