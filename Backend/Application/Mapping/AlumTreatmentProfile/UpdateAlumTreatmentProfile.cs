using AutoMapper;
using Domain.Entities;
using Application.DTOs.AlumTreatmentDTOs.UpdateAlumTreatment;

namespace Application.Mapping.AlumTreatmentProfile
{
    public class UpdateAlumTreatmentProfile : Profile
    {
        public UpdateAlumTreatmentProfile()
        {
            CreateMap<UpdateAlumTreatmentDTO, AlumTreatment>().ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));
        }
    }
}
