using AutoMapper;
using Domain.Entities;
using Application.DTOs.AlumTreatmentDTOs.CreateAlumTreatment;

namespace Application.Mapping.AlumTreatmentProfile
{
    public class CreateAlumTreatmentProfile : Profile
    {
        public CreateAlumTreatmentProfile()
        {
            CreateMap<CreateAlumTreatmentDTO, AlumTreatment>();
        }
    }
}
