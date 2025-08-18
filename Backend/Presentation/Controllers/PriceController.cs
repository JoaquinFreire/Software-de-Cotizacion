using Application.DTOs.PriceDTOs.CreatePrice;
using Application.DTOs.PriceDTOs.UpdatePrice;
using Application.Services;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers;

[Route("api/prices")]
[ApiController]
[Authorize]
public class PriceController : ControllerBase
{
    private readonly PriceServices _services;
    private readonly IMediator _mediator;

    public PriceController(PriceServices services, IMediator mediator)
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
    public async Task<IActionResult> Create([FromBody] CreatePriceDTO dto)
    {
        var command = await _mediator.Send(new CreatePriceCommand { PriceDTO = dto});
        return Ok(command);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePriceDTO dto)
    {
        var command = await _mediator.Send(new UpdatePriceCommand { Id = id, Price = dto});
        return Ok(command);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _services.DeleteAsync(id);
        return Ok();
    }
}
