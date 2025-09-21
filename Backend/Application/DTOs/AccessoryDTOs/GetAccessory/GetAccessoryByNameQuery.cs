using MediatR;
using System.Collections.Generic;

namespace Application.DTOs.AccessoryDTOs.GetAccessory
{
    public record GetAccessoryByNameQuery(string name) : IRequest<IEnumerable<GetAccessoryDTO>>;
}
