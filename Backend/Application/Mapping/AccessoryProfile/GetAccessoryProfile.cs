using AutoMapper;
using Domain.Entities;
using Application.DTOs.AccessoryDTOs.GetAccessory;

namespace Application.Mapping.AccessoryProfile
{
    public class GetAccessoryProfile : Profile
    {
        public GetAccessoryProfile()
        {
            CreateMap<Accesory, GetAccessoryDTO>();
        }
    }
}
