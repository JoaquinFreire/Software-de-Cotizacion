using Application.DTOs;
using Application.DTOs.AlumTreatmentDTOs.CreateAlumTreatment;
using Application.DTOs.AlumTreatmentDTOs.GetAlumTreatment;
using Application.DTOs.AlumTreatmentDTOs.UpdateAlumTreatment;
using Application.Services;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers;

[Route("api/alum-treatments")]
[ApiController]
[Authorize]
public class AlumTreatmentController : ControllerBase
{
    private readonly AlumTreatmentServices _services;
    private readonly IMediator _mediator;

    public AlumTreatmentController(AlumTreatmentServices services, IMediator mediator)
    {
        _services = services;
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _services.GetAllAsync();
        if (result == null || !result.Any())
            return NotFound("No se encontraron tratamientos.");

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var query = new GetAlumTreatmentQuery(id);
        var result = await _mediator.Send(query);
        if (result is null) return NotFound($"Tratamiento con ID {id} no encontrado.");
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "coordinator,manager")]
    public async Task<IActionResult> Create([FromBody] CreateAlumTreatmentDTO alumTreatmentDTO)
    {
        var command = new CreateAlumTreatmentCommand { alumTreatmentDTO = alumTreatmentDTO };
        var result = await _mediator.Send(command);
        return Ok(new { Message = "Tratamiento creado correctamente: ", result });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateAlumTreatmentDTO dto)
    { 
        var result = await _mediator.Send(new UpdateAlumTreatmentCommand(id, dto));
        return result ? Ok(new {Message = "Tratamiento actualizado correctamente."}) : NotFound($"Tratamiento con ID {id} no encontrado.");
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _services.DeleteAsync(id);
        return Ok(new { Message = $"Tratamiento con id:{id}, eliminado correctamente." });

    }
}
