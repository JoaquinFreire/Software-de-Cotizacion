using AutoMapper;
using MediatR;
using Application.DTOs.ComplementRailingDTOs.CreateComplementRailing;
using Application.DTOs.ComplementRailingDTOs.UpdateComplementRailing;
using Application.DTOs.ComplementRailingDTOs.GetComplementRailing;
using Application.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/railing")]
    public class ComplementRailingController : ControllerBase
    {
        private readonly ComplementRailingServices _services;
        private readonly IMapper _mapper;
        private readonly IMediator _mediator;

        public ComplementRailingController(ComplementRailingServices services, IMapper mapper, IMediator mediator)
        {
            _services = services;
            _mapper = mapper;
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
            var item = await _services.GetByIdAsync(id);
            if (item == null) return NotFound();
            return Ok(item);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateComplementRailingDTO railing)
        {
            var result = await _mediator.Send(new CreateComplementRailingCommand { Railing = railing });
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateComplementRailingDTO railing)
        {
            var result = await _mediator.Send(new UpdateComplementRailingCommand { Id = id, Railing = railing });
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
            var result = await _mediator.Send(new GetComplementRailingByNameQuery(name));
            if (result == null || !result.Any()) return NotFound($"No se encontró baranda complementaria similar a: {name}");
            return Ok(result);
        }
    }
}
