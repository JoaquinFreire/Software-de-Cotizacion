using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using Application.DTOs.AccessoryDTOs.CreateAccessory;
using Application.Services;

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
    public async Task<IActionResult> CreateAccessory([FromBody] CreateAccessoryDTO createAccessoryDTO)
    {
        var command = new CreateAccessoryCommand { createAccessoryDTO = createAccessoryDTO };
        await _mediator.Send(command);
        return Ok();
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
