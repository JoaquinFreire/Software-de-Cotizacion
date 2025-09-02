using Application.DTOs.OpeningConfigurationDTOs.GetOpeningConfiguration;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/opening-configurations")]
[Authorize]
public class OpeningConfigurationController : ControllerBase
{
    private readonly IMediator _mediator;

    public OpeningConfigurationController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _mediator.Send(new GetOpeningConfigurationQuery());
        return Ok(result);
    }
}
