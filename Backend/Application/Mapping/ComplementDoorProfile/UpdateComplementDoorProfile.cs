using AutoMapper;
using Application.DTOs.ComplementDoorDTOs.UpdateComplementDoor;
using Domain.Entities;

namespace Application.Mapping.ComplementDoorProfile
{
    public class UpdateComplementDoorProfile : Profile
    {
        public UpdateComplementDoorProfile()
        {
            CreateMap<UpdateComplementDoorDTO, ComplementDoor>().ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));
        }
    }
}
