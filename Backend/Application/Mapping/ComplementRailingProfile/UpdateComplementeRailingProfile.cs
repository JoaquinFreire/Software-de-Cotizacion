using AutoMapper;
using Domain.Entities;
using Application.DTOs.ComplementRailingDTOs.UpdateComplementRailing;

namespace Application.Mapping.ComplementRailingProfile
{
    public class UpdateComplementeRailingProfile : Profile
    {
        public UpdateComplementeRailingProfile() 
        {
            CreateMap<UpdateComplementRailingDTO, ComplementRailing>().ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));
        }
    }
}
