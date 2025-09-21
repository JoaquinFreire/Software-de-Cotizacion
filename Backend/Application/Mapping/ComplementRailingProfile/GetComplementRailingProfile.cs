using AutoMapper;
using Domain.Entities;
using Application.DTOs.ComplementRailingDTOs.GetComplementRailing;

namespace Application.Mapping.ComplementRailingProfile
{
    public class GetComplementRailingProfile : Profile
    {
        public GetComplementRailingProfile()
        {
            CreateMap<ComplementRailing, GetComplementRailingDTO>();
        }
    }
}
