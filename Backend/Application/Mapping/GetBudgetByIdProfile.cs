using Application.DTOs.GetBudget;
using AutoMapper;
using Domain.Entities;

namespace Application.Mapping
{
    public class GetBudgetByIdProfile : Profile
    {
        public GetBudgetByIdProfile()
        {
            // Mapeo entidad → DTO
            CreateMap<Budget, GetBudgetByIdDTO>();
            CreateMap<User, GetBudgetByIdUserDTO>();
            CreateMap<Customer, GetBudgetByIdCustomerDTO>();
            CreateMap<WorkPlace, GetBudgetByIdWorkPlaceDTO>();
            CreateMap<WorkType, GetBudgetByIdWorkTypeDTO>();
            CreateMap<Budget_Product, GetBudgetByIdProductDTO>();
            CreateMap<Opening_Type, GetBudgetByIdOpeningTypeDTO>();
            CreateMap<AlumTreatment, GetBudgetByIdAlumTreatmentDTO>();
            CreateMap<Complement, GetBudgetByIdComplementDTO>();
            CreateMap<Accesory, GetBudgetByIdAccesoryDTO>();
            CreateMap<CustomerAgent, GetBudgetByIdCustomerAgentDTO>();

        }
    }
}
