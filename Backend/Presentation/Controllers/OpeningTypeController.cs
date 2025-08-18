using Application.Services;
using Application.DTOs.OpeningTypeDTOs.CreateOpeningType;
using Application.DTOs.OpeningTypeDTOs.UpdateOpeningType;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers;

[Route("api/opening-types")]
[ApiController]
[Authorize]
public class OpeningTypeController : ControllerBase
{
    private readonly OpeningTypeServices _services;
    private IMediator _mediator;

    public OpeningTypeController(OpeningTypeServices services, IMediator mediator)
    {
        _services = services;
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _services.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _services.GetByIdAsync(id);
        return result is not null ? Ok(result) : NotFound();
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOpeningTypeDTO dto)
    {
        var command = _mediator.Send(new CreateOpeningTypeCommand { OpeningType = dto });
        return Ok(await command);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateOpeningTypeDTO dto)
    {
        var command = _mediator.Send(new UpdateOpeningTypeCommand { id = id, OpeningType = dto });
        return Ok(await command);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _services.DeleteAsync(id);
        return Ok();
    }
}
