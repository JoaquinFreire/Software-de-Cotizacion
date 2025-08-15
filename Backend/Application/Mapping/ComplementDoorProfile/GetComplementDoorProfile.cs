using AutoMapper;
using Domain.Entities;
using Application.DTOs.ComplementDoorDTOs.GetComplementDoor;

namespace Application.Mapping.ComplementDoorProfile
{
    public class GetComplementDoorProfile : Profile
    {
        public GetComplementDoorProfile()
        {
            CreateMap<ComplementDoor, GetComplementDoorDTO>();
        }
    }
}
