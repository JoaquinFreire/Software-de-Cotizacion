using AutoMapper;
using Domain.Entities;
using Application.DTOs.ComplementPartitionDTOs.UpdateComplementPartition;

namespace Application.Mapping.ComplementPartitionProfile
{
    public class UpdateComplementPartitionProfile : Profile
    {
        public UpdateComplementPartitionProfile() : base("UpdateComplementPartitionProfile")
        {
            CreateMap<UpdateComplementPartitionDTO, ComplementPartition>().ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));
        }
    }
}
