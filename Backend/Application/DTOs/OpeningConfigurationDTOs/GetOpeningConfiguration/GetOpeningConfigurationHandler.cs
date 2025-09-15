using AutoMapper;
using MediatR;
using Domain.Repositories;

namespace Application.DTOs.OpeningConfigurationDTOs.GetOpeningConfiguration
{
    public class GetOpeningConfigurationHandler : IRequestHandler<GetOpeningConfigurationQuery, IEnumerable<GetOpeningConfigurationDTO>>
    {
        private readonly IOpeningConfigurationRepository _repository;
        private readonly IOpeningTypeRepository _openingTypeRepository;
        private readonly IMapper _mapper;

        public GetOpeningConfigurationHandler(IOpeningConfigurationRepository repository, IOpeningTypeRepository openingTypeRepository, IMapper mapper)
        {
            _repository = repository;
            _openingTypeRepository = openingTypeRepository;
            _mapper = mapper;
        }

        public async Task<IEnumerable<GetOpeningConfigurationDTO>> Handle(GetOpeningConfigurationQuery request, CancellationToken cancellationToken)
        {
            var configs = await _repository.GetAllAsync();
            var types = await _openingTypeRepository.GetAllAsync();
            var typeDict = types.ToDictionary(t => t.id, t => t.name);

            var dtos = configs.Select(config =>
            {
                var dto = _mapper.Map<GetOpeningConfigurationDTO>(config);
                dto.opening_type_name = typeDict.ContainsKey(config.opening_type_id) ? typeDict[config.opening_type_id] : null;
                return dto;
            }).ToList();

            return dtos;
        }
    }
}
