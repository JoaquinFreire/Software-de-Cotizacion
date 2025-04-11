using Application.DTOs;
using Application.UseCases.Price;
using Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers;

[Route("api/prices")]
[ApiController]
[Authorize]
public class PriceController : ControllerBase
{
    private readonly IPriceRepository _repository;

    public PriceController(IPriceRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var useCase = new GetAllPrices(_repository);
        var result = await useCase.Execute();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var useCase = new GetPriceById(_repository);
        var result = await useCase.Execute(id);
        return result is not null ? Ok(result) : NotFound();
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PriceDTO dto)
    {
        var useCase = new CreatePrice(_repository);
        await useCase.Execute(dto);
        return CreatedAtAction(nameof(GetAll), null);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] PriceDTO dto)
    {
        var useCase = new UpdatePrice(_repository);
        var success = await useCase.Execute(id, dto);
        return success ? NoContent() : NotFound();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var useCase = new DeletePrice(_repository);
        var success = await useCase.Execute(id);
        return success ? NoContent() : NotFound();
    }
}
