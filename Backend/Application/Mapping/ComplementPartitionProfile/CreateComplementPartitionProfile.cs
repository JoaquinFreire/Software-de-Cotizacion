using Application.DTOs.ComplementPartitionDTOs.CreateComplementPartition;
using Domain.Entities;
using AutoMapper;

namespace Application.Mapping.ComplementPartitionProfile
{
    public class CreateComplementPartitionProfile : Profile
    {
        public CreateComplementPartitionProfile()
        {
            CreateMap<CreateComplementPartitionDTO, ComplementPartition>();
        }
    }
}
