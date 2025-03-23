using Domain.Entities;
using Domain.Repositories;
using Domain.UseCases;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

[ApiController]
[Route("api/quotations")]
[Authorize]
public class QuotationController : ControllerBase
{
    private readonly IQuotationRepository _quotationRepository;
    private readonly CreateQuotation _createQuotation;
    private readonly ICustomerRepository _customerRepository;
    private readonly IUserRepository _userRepository;
    private readonly IWorkPlaceRepository _workPlaceRepository; // Cambiado a IWorkPlaceRepository

    public QuotationController(IQuotationRepository quotationRepository, CreateQuotation createQuotation, ICustomerRepository customerRepository, IUserRepository userRepository, IWorkPlaceRepository workPlaceRepository) // Cambiado a IWorkPlaceRepository
    {
        _quotationRepository = quotationRepository;
        _createQuotation = createQuotation;
        _customerRepository = customerRepository;
        _userRepository = userRepository;
        _workPlaceRepository = workPlaceRepository; // Asignado
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
        if (newQuotation == null || newQuotation.TotalPrice <= 0) return BadRequest("Datos inválidos.");

        // Verificar si el cliente existe
        var customer = await _customerRepository.GetByIdAsync(newQuotation.CustomerId);
        if (customer == null)
        {
            // Crear un cliente por defecto si no existe
            customer = new Customer
            {
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

        // Verificar si el WorkPlace existe en la base de datos
        var workPlace = await _workPlaceRepository.GetByIdAsync(newQuotation.WorkPlaceId);
        if (workPlace == null)
        {
            // Si no existe, crearlo primero
            workPlace = new WorkPlace
            {
                name = newQuotation.WorkPlace?.name ?? "Unnamed Workplace",
                address = newQuotation.WorkPlace?.address ?? "No Address",
                workTypeId = newQuotation.WorkPlace?.workTypeId ?? 1 // Asigna un workTypeId válido
            };
            await _workPlaceRepository.AddAsync(workPlace);
            newQuotation.WorkPlaceId = workPlace.id; // Asigna el nuevo ID al quotation
        }

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
            Console.WriteLine("Error creating quotation: " + ex.Message);
            Console.WriteLine("Stack Trace: " + ex.StackTrace);
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
    public string? Status { get; set; }
}
