using AutoMapper;
using Domain.Entities;
using Application.DTOs.BudgetDTOs.CreateBudget;
using Application.DTOs.BudgetDTOs.UpdateBudget;

namespace Application.Mapping.BudgetProfile
{
    public class CreateBudgetVersionProfile : Profile
    {
        public CreateBudgetVersionProfile()
        {
            // Mapeo CreateBudgetDTO a Budget
            CreateMap<CreateBudgetDTO, Budget>()
                .ForMember(d => d.workPlace, o => o.MapFrom(s => s.workPlace))
                .ForMember(d => d.id, o => o.Ignore())
                .ForMember(d => d.version, o => o.Ignore())
                .ForMember(d => d.creationDate, o => o.Ignore())
                .ForMember(d => d.status, o => o.Ignore())
                .ForMember(d => d.ExpirationDate, o => o.Ignore())
                .ForMember(d => d.EndDate, o => o.Ignore())
                .ForMember(d => d.Total, o => o.Ignore());

            // Todos los demás mapeos son los mismos que en CreateBudgetProfile
            CreateMap<CreateBudgetUserDTO, User>()
                .ForMember(d => d.id, o => o.Ignore())
                .ForMember(d => d.legajo, o => o.Ignore())
                .ForMember(d => d.password_hash, o => o.Ignore())
                .ForMember(d => d.role_id, o => o.Ignore())
                .ForMember(d => d.role, o => o.Ignore());

            CreateMap<CreateBudgetCustomerDTO, Customer>();
            CreateMap<CreateBudgetCustomerAgentDTO, CustomerAgent>();
            CreateMap<CreateBudgetWorkPlaceDTO, WorkPlace>()
                .ForMember(d => d.workTypeId, o => o.Ignore());
            CreateMap<CreateBudgetWorkTypeDTO, WorkType>();
            CreateMap<CreateBudgetProductDTO, Budget_Product>()
                .ForMember(d => d.AlumTreatment, o => o.MapFrom(s => s.AlumTreatment));
            CreateMap<CreateBudgetOpeningTypeDTO, Opening_Type>()
                .ForMember(d => d.weight, o => o.Ignore())
                .ForMember(d => d.predefined_size, o => o.Ignore());
            CreateMap<CreateBudgetGlassTypeDTO, GlassType>();
            CreateMap<CreateBudgetComplementDTO, Complement>();
            CreateMap<CreateBudgetComplementDoorDTO, BudgetComplementDoor>();
            CreateMap<CreateBudgetComplementPartitionDTO, BudgetComplementPartition>();
            CreateMap<CreateBudgetComplementRailingDTO, BudgetComplementRailing>();
            CreateMap<CreateBudgetAlumTreatmentDTO, AlumTreatment>();
            CreateMap<CreateBudgetCoating, Coating>();
            CreateMap<CreateBudgetAccesoryDTO, BudgetAccesory>();
        }
    }
}
