using AutoMapper;
using Domain.Entities;
using Application.DTOs.BudgetDTOs.UpdateBudget;

namespace Application.Mapping
{
    public class UpdateBudgetProfile : Profile
    {
        public UpdateBudgetProfile()
        {
            //TODO: Terminar el mapeo de UpdateBudgetProfile
            CreateMap<Budget, UpdateBudgetDTO>();
            CreateMap<Customer, UpdateBudgetCustomerDTO>();
            CreateMap<CustomerAgent, UpdateBudgetCustomerAgentDTO>();
            CreateMap<WorkPlace, UpdateBudgetWorkPlaceDTO>();
            CreateMap<WorkType, UpdateBudgetWorkTypeDTO>();
            CreateMap<Budget_Product, UpdateBudgetProductDTO>();
            CreateMap<Opening_Type, UpdateBudgetOpeningTypeDTO>();
            CreateMap<AlumTreatment, UpdateBudgetAlumTreatmentDTO>();
            CreateMap<Complement, UpdateBudgetComplementDTO>();
            CreateMap<Accesory, UpdateBudgetAccesoriesDTO>();// Mapeo de accesorios(TODO: Fijarse que funcione bien con los cambios de complement/Accesory)
        }
    }
}
