using Application.Services;
using Application.DTOs.CoatingDTOs.CreateCoating;
using Application.DTOs.CoatingDTOs.GetCoating;
using Application.DTOs.CoatingDTOs.UpdateCoating;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using Microsoft.AspNetCore.Authorization;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/coating")]
    public class CoatingController : ControllerBase
    {
        private readonly CoatingServices _services;
        private readonly IMediator _mediator;

        public CoatingController(CoatingServices coatingServices, IMediator mediator)
        {
            _services = coatingServices;
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var result = await _services.GetAllAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                // devolver detalle mínimo para facilitar debugging desde frontend
                // en producción preferir loggear y devolver un mensaje genérico
                return StatusCode(500, new { Message = "Error al obtener los revestimientos", Detail = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var coating = await _mediator.Send(new GetCoatingQuery(id));
            if (coating == null) return NotFound($"No se encontr� un revestimiento con el ID: {id}");
            return Ok(coating);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateCoatingDTO coating)
        {
            var command = new CreateCoatingCommand { Coating = coating };
            var coatingId = await _mediator.Send(command);
            return Ok(new { Message = "Revestimiento creado correctamente, Id: ", coatingId });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateCoatingDTO coating)
        {
            var result = await _mediator.Send(new UpdateCoatingCommand(id, coating));
            if (result.Equals(Unit.Value))
            {
                return Ok(new { Message = "Revestimiento actualizado correctamente." });
            }
            return NotFound($"No se encontr� un revestimiento con el ID: {id}");
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _services.DeleteAsync(id);
            return Ok(new { Message = "Revestimiento eliminado correctamente." });
        }

        // nuevo endpoint de búsqueda por nombre (no requiere auth si preferís)
        [AllowAnonymous]
        [HttpGet("search")]
        [Produces("application/json")]
        public async Task<IActionResult> Search([FromQuery] string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest("Debe proporcionar un nombre para buscar.");

            var result = await _mediator.Send(new GetCoatingByNameQuery(name));
            if (result == null || !result.Any()) return NotFound($"No se encontró revestimiento con nombre similar a: {name}");

            return Ok(result);
        }
    }
}
