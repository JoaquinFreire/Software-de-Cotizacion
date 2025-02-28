using Domain.Entities;
using Domain.Repositories;
using Domain.UseCases;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

[ApiController]
[Route("api/quotations")]
public class QuotationController : ControllerBase
{
    private readonly IQuotationRepository _quotationRepository;
    private readonly CreateQuotation _createQuotation;

    public QuotationController(IQuotationRepository quotationRepository, CreateQuotation createQuotation)
    {
        _quotationRepository = quotationRepository;
        _createQuotation = createQuotation;
    }

    [HttpGet]
public async Task<IEnumerable<Quotation>> GetAll()
{
    var quotations = await _quotationRepository.GetAllAsync();

    foreach (var q in quotations)
    {
        Console.WriteLine($"Quotation ID: {q.Id}, LastEdit: {q.LastEdit}");
    }

    return quotations;
}

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var quotation = await _quotationRepository.GetByIdAsync(id);
        if (quotation == null) return NotFound();
        return Ok(quotation);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Quotation newQuotation)
    {
        if (newQuotation == null) return BadRequest("Datos inválidos.");

        var createdQuotation = await _createQuotation.ExecuteAsync(
            newQuotation.CustomerId, 
            newQuotation.UserId, 
            newQuotation.WorkPlaceId, 
            newQuotation.TotalPrice
        );

        return CreatedAtAction(nameof(GetById), new { id = createdQuotation.Id }, createdQuotation);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _quotationRepository.DeleteAsync(id);
        return NoContent();
    }
}
