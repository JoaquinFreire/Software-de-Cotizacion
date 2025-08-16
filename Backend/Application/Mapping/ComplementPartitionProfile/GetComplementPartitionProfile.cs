using AutoMapper;
using Domain.Entities;
using Application.DTOs.ComplementPartitionDTOs.GetComplementPartition;

namespace Application.Mapping.ComplementPartitionProfile
{
    public class GetComplementPartitionProfile : Profile
    {
        public GetComplementPartitionProfile()
        {
            CreateMap<ComplementPartition, GetComplementPartitionDTO>();
        }
    }
}
