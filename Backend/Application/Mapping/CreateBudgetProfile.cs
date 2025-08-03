using AutoMapper;
using Application.DTOs.CreateBudget;
using Domain.Entities;

public class CreateBudgetProfile : Profile
{
    public CreateBudgetProfile()
    {
        // Mapeo BudgetDTO a Budget
        CreateMap<CreateBudgetDTO, Budget>()
            .ForMember(d => d.workPlace, o => o.MapFrom(s => s.workPlace));

        //Mapeo UserDTO a User
        CreateMap<CreateBudgetUserDTO, User>()
            .ForMember(d => d.id, o => o.Ignore())
            .ForMember(d => d.legajo, o => o.Ignore())
            .ForMember(d => d.password_hash, o => o.Ignore())
            .ForMember(d => d.role_id, o => o.Ignore())
            .ForMember(d => d.role, o => o.Ignore());

        //Mapeo CustomerDTO a Customer
        CreateMap<CreateBudgetCustomerDTO, Customer>()
            .ForMember(d => d.agentId, o => o.Ignore())
            .ForMember(d => d.registration_date, o => o.Ignore());

        //Mapeo CustomerAgentDTO a CustomerAgent
        CreateMap<CreateBudgetCustomerAgentDTO, CustomerAgent>();

        //Mapeo WorkPlaceDTO a WorkPlace
        CreateMap<CreateBudgetWorkPlaceDTO, WorkPlace>()
            .ForMember(d => d.workTypeId, o => o.Ignore());

        //Mapeo WorkTypeDTO a WorkType
        CreateMap<CreateBudgetWorkTypeDTO, WorkType>();

        // Mapeo Budget_ProductDTO a Budget_Product
        CreateMap<CreateBudgetProductDTO, Budget_Product>()
            .ForMember(d => d.AlumTreatment, o => o.MapFrom(s => s.AlumTreatment));

        CreateMap<CreateBudgetOpeningTypeDTO, Opening_Type>()
            .ForMember(d => d.weight, o => o.Ignore())
            .ForMember(d => d.predefined_size, o => o.Ignore());

        CreateMap<CreateBudgetGlassTypeDTO, GlassType>();

        //Mapeo ComplementDTO a Complement
        CreateMap<CreateBudgetComplementDTO, Complement>();

        //Mapeo ComplementDoorDTO a BudgetComplementDoor
        CreateMap<CreateBudgetComplementDoorDTO, BudgetComplementDoor>();

        //Mapeo ComplementPartitionDTO a BudgetComplementPartition
        CreateMap<CreateBudgetComplementPartitionDTO, BudgetComplementPartition>();

        //Mapeo ComplementRailingDTO a BudgetComplementRailing
        CreateMap<CreateBudgetComplementRailingDTO, BudgetComplementRailing>();

        //Mapeo AlumTreatmentDTO a AlumTreatment
        CreateMap<CreateBudgetAlumTreatmentDTO, AlumTreatment>();

        //Mapeo CoatingDTO a Coating
        CreateMap<CreateBudgetCoating, Coating>();

        // Mapea Budget_AccesoryDTO → BudgetAccesory
        CreateMap<CreateBudgetAccesoryDTO, BudgetAccesory>();

    }
}
