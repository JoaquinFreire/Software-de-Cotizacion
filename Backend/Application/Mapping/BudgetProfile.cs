using AutoMapper;
using Application.DTOs;
using Domain.Entities;

public class BudgetProfile : Profile
{
    public BudgetProfile()
    {
        // Mapeo BudgetDTO a Budget
        CreateMap<BudgetDTO, Budget>();

        //Mapeo UserDTO a User
        CreateMap<BudgetUserDTO, User>()
            .ForMember(d => d.id, o => o.Ignore())
            .ForMember(d => d.Legajo, o => o.Ignore())
            .ForMember(d => d.password_hash, o => o.Ignore())
            .ForMember(d => d.role_id, o => o.Ignore())
            .ForMember(d => d.role, o => o.Ignore());

        //Mapeo CustomerDTO a Customer
        CreateMap<CustomerDTO, Customer>()
            .ForMember(d => d.agentId, o => o.Ignore())
            .ForMember(d => d.registration_date, o => o.Ignore());

        //Mapeo CustomerAgentDTO a CustomerAgent
        CreateMap<CustomerAgentDTO, CustomerAgent>();

        //Mapeo WorkPlaceDTO a WorkPlace
        CreateMap<WorkPlaceDTO, WorkPlace>()
            .ForMember(d => d.workTypeId, o => o.Ignore());

        //Mapeo WorkTypeDTO a WorkType
        CreateMap<WorkTypeDTO, WorkType>();

        // Mapeo Budget_ProductDTO a Budget_Product
        CreateMap<Budget_ProductDTO, Budget_Product>()
            .ForMember(d => d.AlumComplement, o => o.MapFrom(s => s.AlumComplement))
            .ForMember(d => d.GlassComplement, o => o.MapFrom(s => s.GlassComplement));

        CreateMap<Opening_TypeDTO, Opening_Type>()
            .ForMember(d => d.Weight, o => o.Ignore())
            .ForMember(d => d.Predefined_Size, o => o.Ignore());

        //Mapeo ComplementDTO a Complement
        CreateMap<ComplementDTO, Complement>();

        //Mapeo AlumTreatmentDTO a AlumTreatment
        CreateMap<AlumTreatmentDTO, AlumTreatment>();

        // Mapea Budget_AccesoryDTO → Budget_Accesory
        CreateMap<Budget_AccesoryDTO, Budget_Accesory>();
    }
}
