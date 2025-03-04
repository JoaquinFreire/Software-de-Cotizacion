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
    private readonly ICustomerRepository _customerRepository;
    private readonly IUserRepository _userRepository;

    public QuotationController(IQuotationRepository quotationRepository, CreateQuotation createQuotation, ICustomerRepository customerRepository, IUserRepository userRepository)
    {
        _quotationRepository = quotationRepository;
        _createQuotation = createQuotation;
        _customerRepository = customerRepository;
        _userRepository = userRepository;
    }

    [HttpGet]
    public async Task<IEnumerable<Quotation>> GetAll()
    {
        var quotations = await _quotationRepository.GetAllAsync();
        return quotations;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var quotation = await _quotationRepository.GetByIdAsync(id);
        if (quotation == null) return NotFound();
        return Ok(new
        {
            quotation.Id,
            quotation.CustomerId,
            quotation.UserId,
            quotation.WorkPlaceId,
            quotation.Status,
            quotation.TotalPrice,
            LastEdit = quotation.LastEdit.ToString("yyyy-MM-ddTHH:mm:ssZ"), // Formatear DateTime a string
            CreationDate = quotation.CreationDate.ToString("yyyy-MM-ddTHH:mm:ssZ"), // Formatear DateTime a string
            Customer = new
            {
                quotation.Customer.id,
                quotation.Customer.name,
                quotation.Customer.lastname,
                quotation.Customer.tel,
                quotation.Customer.mail,
                quotation.Customer.address,
                RegistrationDate = quotation.Customer.registration_date.ToString("yyyy-MM-ddTHH:mm:ssZ"), // Formatear DateTime a string
                quotation.Customer.agentId
            },
            WorkPlace = new
            {
                quotation.WorkPlace.id,
                quotation.WorkPlace.name,
                quotation.WorkPlace.address,
                quotation.WorkPlace.workTypeId
            }
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Quotation newQuotation)
    {
        if (newQuotation == null) return BadRequest("Datos inválidos.");

        // Verificar si el cliente existe
        var customer = await _customerRepository.GetByIdAsync(newQuotation.CustomerId);
        if (customer == null)
        {
            // Crear un cliente por defecto si no existe
            customer = new Customer
            {
                // Asigna valores predeterminados o los valores proporcionados en el cuerpo de la solicitud
                name = "Default Name",
                lastname = "Default LastName",
                tel = "0000000000",
                mail = "default@example.com",
                address = "Default Address"
            };
            await _customerRepository.AddAsync(customer);
            newQuotation.CustomerId = customer.id; // Asigna el ID del nuevo cliente a la cotización
        }

        // Verificar si el usuario existe
        var user = await _userRepository.GetByIdAsync(newQuotation.UserId);
        if (user == null) return BadRequest("Usuario no válido.");

        try
        {
            var createdQuotation = await _createQuotation.ExecuteAsync(
                newQuotation.CustomerId, 
                newQuotation.UserId, 
                newQuotation.WorkPlaceId, 
                newQuotation.TotalPrice
            );

            return CreatedAtAction(nameof(GetById), new { id = createdQuotation.Id }, createdQuotation);
        }
        catch (Exception ex)
        {
            // Agregar más detalles de depuración
            return StatusCode(500, $"Internal server error: {ex.Message}\n{ex.StackTrace}");
        }
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest request)
    {
        var quotation = await _quotationRepository.GetByIdAsync(id);
        if (quotation == null) return NotFound();

        quotation.Status = request.Status;
        await _quotationRepository.UpdateAsync(quotation);

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _quotationRepository.DeleteAsync(id);
        return NoContent();
    }
}

public class UpdateStatusRequest
{
    public string Status { get; set; }
}
