using AutoMapper;
using Domain.Entities;
using Application.DTOs.AccessoryDTOs.CreateAccessory;

namespace Application.Mapping.AccessoryProfile
{
    public class CreateAccessoryProfile : Profile
    {
        public CreateAccessoryProfile()
        {
            CreateMap<CreateAccessoryDTO, Accesory>();
        }
    }
}