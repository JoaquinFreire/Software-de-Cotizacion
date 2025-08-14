using AutoMapper;
using Domain.Entities;
using Application.DTOs.AlumTreatmentDTOs.GetAlumTreatment;

namespace Application.Mapping.AlumTreatmentProfile
{
    public class GetAlumTreatmentProfile : Profile
    {
        public GetAlumTreatmentProfile()
        {
            CreateMap<AlumTreatment, GetAlumTreatmentDTO>();
        }
    }
}
