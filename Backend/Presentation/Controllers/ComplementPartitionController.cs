using Microsoft.AspNetCore.Mvc;
using Application.DTOs.ComplementPartitionDTOs.CreateComplementPartition;
using Application.DTOs.ComplementPartitionDTOs.GetComplementPartition;
using Application.DTOs.ComplementPartitionDTOs.UpdateComplementPartition;
using Application.Services;
using MediatR;
using Microsoft.AspNetCore.Authorization;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/partition")]
    public class ComplementPartitionController : ControllerBase
    {
        private readonly ComplementPartitionServices _services;
        private readonly IMediator _mediator;

        public ComplementPartitionController(ComplementPartitionServices services, IMediator mediator)
        {
            _services = services;
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var items = await _services.GetAllAsync();
            return Ok(items);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _mediator.Send(new GetComplementPartitionQuery(id));
            if (result == null) return NotFound($"Partition with ID {id} not found.");
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateComplementPartitionDTO partition)
        {
            var result = await _mediator.Send(new CreateComplementPartitionCommand { createComplementPartitionDTO = partition });
            return CreatedAtAction(nameof(GetById), new { id = result }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateComplementPartitionDTO partition)
        {
            var result = await _mediator.Send(new UpdateComplementPartitionCommand { Id = id, updateComplementPartitionDTO = partition });
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _services.DeleteAsync(id);
            return NoContent();
        }

        [AllowAnonymous]
        [HttpGet("search")]
        [Produces("application/json")]
        public async Task<IActionResult> Search([FromQuery] string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest("Debe proporcionar un nombre para buscar.");
            var result = await _mediator.Send(new GetComplementPartitionByNameQuery(name));
            if (result == null || !result.Any()) return NotFound($"No se encontró partición complementaria similar a: {name}");
            return Ok(result);
        }
    }
}
