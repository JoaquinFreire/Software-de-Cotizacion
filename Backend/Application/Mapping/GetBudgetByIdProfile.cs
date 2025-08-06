using Application.DTOs.BudgetDTOs.GetBudget;
using AutoMapper;
using Domain.Entities;

namespace Application.Mapping
{
    public class GetBudgetByIdProfile : Profile
    {
        public GetBudgetByIdProfile()
        {
            // Mapeo entidad → DTO
            CreateMap<Budget, GetBudgetByIdBudgetDTO>();
            CreateMap<User, GetBudgetByIdUserDTO>();
            CreateMap<Customer, GetBudgetByIdCustomerDTO>();
            CreateMap<CustomerAgent, GetBudgetByIdCustomerAgentDTO>();
            CreateMap<WorkPlace, GetBudgetByIdWorkPlaceDTO>();
            CreateMap<WorkType, GetBudgetByIdWorkTypeDTO>();
            CreateMap<Budget_Product, GetBudgetByIdProductDTO>();
            CreateMap<GlassType, GetBudgetByIdGlassTypeDTO>();
            CreateMap<Opening_Type, GetBudgetByIdOpeningTypeDTO>();
            CreateMap<AlumTreatment, GetBudgetByIdAlumTreatmentDTO>();
            CreateMap<Complement, GetBudgetByIdComplementDTO>();
            CreateMap<BudgetComplementDoor, GetBudgetByIdComplementDoorDTO>();
            CreateMap<Coating, GetBudgetByIdCoatingDTO>();
            CreateMap<BudgetComplementPartition, GetBudgetByIdComplementPartitionDTO>();
            CreateMap<BudgetComplementRailing, GetBudgetByIdComplementRailingDTO>();
            CreateMap<BudgetAccesory, GetBudgetByIdAccesoryDTO>();
            

        }
    }
}
