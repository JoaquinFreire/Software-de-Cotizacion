using Application.Services;
using Application.DTOs.ComplementDoorDTOs.CreateComplementDoor;
using Application.DTOs.ComplementDoorDTOs.GetComplementDoor;
using Application.DTOs.ComplementDoorDTOs.UpdateComplementDoor;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/door")]
    public class ComplementDoorController : ControllerBase
    {
        private readonly ComplementDoorServices _services;
        private readonly IMediator _mediator;

        public ComplementDoorController(ComplementDoorServices services, IMediator mediator)
        {
            _services = services;
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var doors = await _services.GetAllAsync();
            if (doors == null || !doors.Any())
            {
                return NotFound("No doors found.");
            }
            return Ok(doors);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _mediator.Send(new GetComplementDoorQuery(id));
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateComplementDoorDTO door)
        {
            var result = await _mediator.Send(new CreateComplementDoorCommand { ComplementDoor = door });
            return CreatedAtAction(nameof(GetById), new { id = result }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateComplementDoorDTO door)
        {
            var result = await _mediator.Send(new UpdateComplementDoorCommand { id = id, ComplementDoor = door });
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _services.DeleteAsync(id);
            return Ok(new { message = "Puerta eliminada correctamente" });
        }

        // búsqueda por texto (subcadena)
        [AllowAnonymous]
        [HttpGet("search")]
        [Produces("application/json")]
        public async Task<IActionResult> Search([FromQuery] string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest("Debe proporcionar un nombre para buscar.");

            var result = await _mediator.Send(new GetComplementDoorByNameQuery(name));
            if (result == null || !result.Any()) return NotFound($"No se encontró puerta complementaria similar a: {name}");
            return Ok(result);
        }
    }
}
