using Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/material-types")]
[Authorize]
public class MaterialTypeController : ControllerBase
{
    private readonly IMaterialTypeRepository _repository;

    public MaterialTypeController(IMaterialTypeRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var materialTypes = await _repository.GetAllAsync();
        return Ok(materialTypes);
    }
}
