using AutoMapper;
using Domain.Entities;
using Application.DTOs.OpeningTypeDTOs.UpdateOpeningType;

namespace Application.Mapping.OpeningTypeProfile
{
    public class UpdateOpeningTypeProfile : Profile
    {
        public UpdateOpeningTypeProfile()
        {
            CreateMap<UpdateOpeningTypeDTO, Opening_Type>().ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));
        }
    }
}
