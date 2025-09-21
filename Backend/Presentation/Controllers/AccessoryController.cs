using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using Application.DTOs.AccessoryDTOs.CreateAccessory;
using Application.Services;
using Application.DTOs.AccessoryDTOs.UpdateAccessory;
using Application.DTOs.AccessoryDTOs.GetAccessory;

namespace Presentation.Controllers;


[Route("api/accessories")]
[ApiController]
[Authorize]
public class AccessoryController : ControllerBase
{
    private readonly IMediator _mediator;

    private readonly AccessoryServices _accessoryService;

    public AccessoryController(IMediator mediator, AccessoryServices accessoryService)
    {
        _mediator = mediator;
        _accessoryService = accessoryService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAccessoryDTO createAccessoryDTO)
    {
        var command = new CreateAccessoryCommand { createAccessoryDTO = createAccessoryDTO };
        var id = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetAccessoryById), new { id = id }, id);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateAccessoryDTO updateAccessoryDTO)
    {
        var updated = await _mediator.Send(new UpdateAccessoryCommand { id = id, updateAccessoryDTO = updateAccessoryDTO });
        if (updated) return Ok(new { Message = "Accesorio actualizado correctamente." });
        return NotFound($"No se encontró accesorio con id {id}");
    }

    [HttpGet]
    public async Task<IActionResult> GetAllAccessories()
    {
        var accessories = await _accessoryService.GetAllAsync();
        return Ok(accessories);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAccessoryById(int id)
    {
        var accessory = await _accessoryService.GetByIdAsync(id);
        if (accessory == null)
        {
            return NotFound();
        }
        return Ok(accessory);
    }

    // búsqueda por nombre (subcadena), análoga a otras entidades
    [AllowAnonymous]
    [HttpGet("search")]
    [Produces("application/json")]
    public async Task<IActionResult> Search([FromQuery] string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest("Debe proporcionar un nombre para buscar.");

        var result = await _mediator.Send(new GetAccessoryByNameQuery(name));
        if (result == null || !result.Any()) return NotFound($"No se encontró accesorio similar a: {name}");
        return Ok(result);
    }

    /*[HttpPut("{id}")]
    public async Task<IActionResult> UpdateAccessory(int id, [FromBody] CreateAccessoryDTO updateAccessoryDTO)
    {
        var existingAccessory = await _accessoryService.GetByIdAsync(id);
        if (existingAccessory == null)
        {
            return NotFound();
        }
        existingAccessory.name = updateAccessoryDTO.name;
        existingAccessory.price = updateAccessoryDTO.price;
        await _accessoryService.UpdateAsync(existingAccessory);
        return NoContent();
    }*/

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAccessory(int id)
    {
        var existingAccessory = await _accessoryService.GetByIdAsync(id);
        if (existingAccessory == null)
        {
            return NotFound();
        }
        await _accessoryService.DeleteAsync(id);
        return NoContent();
    }

}
