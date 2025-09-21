using AutoMapper;
using Domain.Entities;
using Application.DTOs.AccessoryDTOs.UpdateAccessory;

namespace Application.Mapping.AccessoryProfile
{
    public class UpdateAccessoryProfile : Profile
    {
        public UpdateAccessoryProfile()
        {
            CreateMap<UpdateAccessoryDTO, Accesory>()
                .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));
        }
    }
}
