using Application.DTOs.GlassTypeDTOs.CreateGlassType;
using Application.DTOs.GlassTypeDTOs.UpdateGlassType;
using Application.Services;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers;

[ApiController]
[Authorize]
[Route("api/glass-types")]
public class GlassTypeController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly GlassTypeServices _services;

    public GlassTypeController(IMediator mediator, GlassTypeServices services)
    {
        _mediator = mediator;
        _services = services;
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
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateGlassTypeDTO dto)
    {
        var result = await _mediator.Send(new CreateGlassTypeCommand { GlassType = dto });
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateGlassTypeDTO dto)
    {
        var result = await _mediator.Send(new UpdateGlassTypeCommand { id = id, glassType = dto });
        return Ok(result);
    }
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _services.DeleteAsync(id);
        return Ok();

    }
}
