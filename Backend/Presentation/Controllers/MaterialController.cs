/* using Domain.Entities;
using Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers;

// Presentation/Controllers/MaterialController.cs
[ApiController]
[Route("api/materials")]
[Authorize]
public class MaterialController : ControllerBase
{
    private readonly IMaterialRepository _repository;
    private readonly IMaterialRepository _materialRepository;
    public MaterialController(IMaterialRepository repository, IMaterialRepository materialRepository) 
    {
        _repository = repository;
        _materialRepository = materialRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var materials = await _repository.GetAllAsync();
        return Ok(materials);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var material = await _repository.GetByIdAsync(id);
        if (material == null) return NotFound();
        return Ok(material);
    }

    // PUT: api/materials/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Material material)
    {
        if (material == null || id != material.id)
        {
            return BadRequest("Invalid data.");
        }

        var existingMaterial = await _materialRepository.GetByIdAsync(id);
        if (existingMaterial == null)
        {
            return NotFound();
        }

        await _materialRepository.UpdateAsync(material);
        return NoContent();
    }

    // DELETE: api/materials/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var material = await _materialRepository.GetByIdAsync(id);
        if (material == null)
        {
            return NotFound();
        }

        await _materialRepository.DeleteAsync(id);
        return NoContent();
    }
}
 */