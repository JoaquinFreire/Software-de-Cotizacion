using AutoMapper;
using Domain.Entities;
using Application.DTOs.ComplementDoorDTOs.CreateComplementDoor;

namespace Application.Mapping.ComplementDoorProfile
{
    public class CreateComplementeDoorProfile : Profile
    {
        public CreateComplementeDoorProfile()
        {
            CreateMap<CreateComplementDoorDTO, ComplementDoor>();
        }
    }
}
