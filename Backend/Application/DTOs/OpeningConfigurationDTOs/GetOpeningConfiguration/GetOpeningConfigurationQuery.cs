using MediatR;
using System.Collections.Generic;

namespace Application.DTOs.OpeningConfigurationDTOs.GetOpeningConfiguration
{
    public record GetOpeningConfigurationQuery : IRequest<IEnumerable<GetOpeningConfigurationDTO>>;
}
