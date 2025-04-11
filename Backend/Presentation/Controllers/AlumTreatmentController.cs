using Application.DTOs;
using Application.UseCases.AlumTreatment;
using Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers;

[Route("api/alum-treatments")]
[ApiController]
[Authorize]
public class AlumTreatmentController : ControllerBase
{
    private readonly IAlumTreatmentRepository _repository;

    public AlumTreatmentController(IAlumTreatmentRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var useCase = new GetAllAlumTreatments(_repository);
        var result = await useCase.ExecuteAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var useCase = new GetAlumTreatmentById(_repository);
        var result = await useCase.ExecuteAsync(id);
        return result is not null ? Ok(result) : NotFound();
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AlumTreatmentDTO dto)
    {
        var useCase = new CreateAlumTreatment(_repository);
        await useCase.ExecuteAsync(dto);
        return CreatedAtAction(nameof(GetAll), null);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] AlumTreatmentDTO dto)
    {
        var useCase = new UpdateAlumTreatment(_repository);
        var success = await useCase.Execute(id, dto);
        return success ? NoContent() : NotFound();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var useCase = new DeleteAlumTreatment(_repository);
        await useCase.ExecuteAsync(id);
        return NoContent();
    }
}
