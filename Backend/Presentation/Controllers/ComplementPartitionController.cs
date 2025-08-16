using Domain.Entities;
using Domain.Repositories;
using Microsoft.AspNetCore.Mvc;
using Application.DTOs.ComplementPartitionDTOs.CreateComplementPartition;
using Application.DTOs.ComplementPartitionDTOs.GetComplementPartition;
using Application.DTOs.ComplementPartitionDTOs.UpdateComplementPartition;
using Application.Services;
using MediatR;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/partition")]
    public class ComplementPartitionController : ControllerBase
    {
        private readonly IComplementPartitionRepository _repository;
        private readonly ComplementPartitionServices _services;
        private readonly IMediator _mediator;

        public ComplementPartitionController(IComplementPartitionRepository repository, ComplementPartitionServices services, IMediator mediator)
        {
            _repository = repository;
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
    }
}
