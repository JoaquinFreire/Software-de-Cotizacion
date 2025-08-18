using AutoMapper;
using Application.DTOs.ComplementRailingDTOs.CreateComplementRailing;
using Domain.Entities;
using Application.DTOs.AlumTreatmentDTOs.CreateAlumTreatment;

namespace Application.Mapping.ComplementRailingProfile
{
    public class CreateComplementRailingProfile : Profile
    {
        public CreateComplementRailingProfile() {
        CreateMap<CreateComplementRailingDTO, ComplementRailing>();
        }
    }
}
