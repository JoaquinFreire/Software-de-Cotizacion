using Application.UseCases;
using Domain.Entities;
using Domain.Repositories;
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
                Customer = quotation.Customer == null ? null : new
                {
                    quotation.Customer.id,
                    quotation.Customer.name,
                    quotation.Customer.lastname,
                    quotation.Customer.tel,
                    quotation.Customer.mail,
                    quotation.Customer.address,
                    RegistrationDate = quotation.Customer.registration_date.ToString("yyyy-MM-ddTHH:mm:ssZ"), // Formatear DateTime a string
                    quotation.Customer.agentId
                }
            },
            WorkPlace = new
            {
                quotation.WorkPlace?.id,
                quotation.WorkPlace?.name,
                quotation.WorkPlace?.address,
                quotation.WorkPlace?.workTypeId
            }
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] QuotationFullRequest request)
    {
        // LOG DEL REQUEST RECIBIDO
        Console.WriteLine("Request recibido en /api/quotations:");
        Console.WriteLine(System.Text.Json.JsonSerializer.Serialize(request));

        if (request == null || request.totalPrice <= 0) return BadRequest("Datos inválidos.");

        // 1. Cliente
        Customer customer = null;
        if (request.customer != null && !string.IsNullOrWhiteSpace(request.customer.dni))
        {
            customer = await _customerRepository.GetByDniAsync(request.customer.dni);
            if (customer == null)
            {
                customer = new Customer
                {
                    name = request.customer.name,
                    lastname = request.customer.lastname,
                    tel = request.customer.tel,
                    mail = request.customer.mail,
                    address = request.customer.address,
                    dni = request.customer.dni,
                    agentId = request.customer.agentId
                };
                await _customerRepository.AddAsync(customer);
            }
        }
        else
        {
            return BadRequest("Datos de cliente inválidos.");
        }

        // 2. WorkPlace
        WorkPlace workPlace = null;
        if (request.workPlace != null)
        {
            // Puedes buscar por nombre y dirección para evitar duplicados, o simplemente crear uno nuevo
            workPlace = new WorkPlace
            {
                name = request.workPlace.name,
                address = request.workPlace.address,
                workTypeId = int.TryParse(request.workPlace.workTypeId.ToString(), out var wtid) ? wtid : 1
            };
            await _workPlaceRepository.AddAsync(workPlace);
        }
        else
        {
            return BadRequest("Datos de espacio de trabajo inválidos.");
        }

        // 3. Crear la cotización
        var quotation = new Quotation
        {
            CustomerId = customer.id,
            UserId = int.TryParse(request.userId?.ToString(), out var uid) ? uid : 0,
            WorkPlaceId = workPlace.id,
            TotalPrice = request.totalPrice,
            Status = "pending",
            LastEdit = DateTime.UtcNow,
            CreationDate = DateTime.UtcNow
        };
        await _quotationRepository.AddAsync(quotation);

        // 4. (Opcional) Guardar aberturas y complementos relacionados si tienes tablas intermedias
        // Aquí deberías agregar la lógica para guardar en tablas intermedias si tu modelo lo requiere

        return CreatedAtAction(nameof(GetById), new { id = quotation.Id }, quotation);
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest request)
    {
        var quotation = await _quotationRepository.GetByIdAsync(id);
        if (quotation == null) return NotFound();

        quotation.Status = request.Status ?? quotation.Status;
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

public class QuotationFullRequest
{
    public Customer customer { get; set; }
    public WorkPlaceDto workPlace { get; set; }
    public List<OpeningDto> openings { get; set; }
    public List<ComplementDto> complements { get; set; }
    public string userId { get; set; }
    public decimal totalPrice { get; set; }
}

public class WorkPlaceDto
{
    public string name { get; set; }
    public string address { get; set; }
    public int workTypeId { get; set; }
}

public class OpeningDto
{
    public int typeId { get; set; }
    public double width { get; set; }
    public double height { get; set; }
    public int quantity { get; set; }
    public int treatmentId { get; set; }
    public int glassTypeId { get; set; }
    // Puedes agregar más campos si necesitas
}

public class ComplementDto
{
    public int id { get; set; }
    public int quantity { get; set; }
    public decimal price { get; set; }
    // Puedes agregar más campos si necesitas
}
