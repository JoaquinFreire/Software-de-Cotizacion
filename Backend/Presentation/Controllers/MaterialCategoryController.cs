using Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/material-categories")]
[Authorize]
public class MaterialCategoryController : ControllerBase
{
    private readonly IMaterialCategoryRepository _repository;

    public MaterialCategoryController(IMaterialCategoryRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var materialCategories = await _repository.GetAllAsync();
        return Ok(materialCategories);
    }
}
