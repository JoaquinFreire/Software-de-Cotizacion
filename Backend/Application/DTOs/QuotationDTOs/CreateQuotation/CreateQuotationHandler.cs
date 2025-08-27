using Domain.Entities;
using Application.Services;
using Application.DTOs.CustomerDTOs.CreateCustomer;
using Application.DTOs.CustomerDTOs.GetCustomer;
using MediatR;
using AutoMapper;

namespace Application.DTOs.QuotationDTOs.CreateQuotation
{
    public class CreateQuotationHandler : IRequestHandler<CreateQuotationCommand, Unit>
    {
        private readonly QuotationServices _services;
        private readonly IMediator _mediator;
        private readonly IMapper _mapper;
        public CreateQuotationHandler(QuotationServices services, IMapper mapper, IMediator mediator)
        {
            _services = services;
            _mapper = mapper;
            _mediator = mediator;
        }
        public async Task<Unit> Handle(CreateQuotationCommand request, CancellationToken cancellationToken)
        {
            var dto = request.quotationDTO;
            // 1. Cliente
            int customerId;
            GetCustomerDTO? existingCustomer = null;
            try
            {
                existingCustomer = await _mediator.Send(new GetCustomerQuery(request.customerDTO.dni));
                customerId = existingCustomer.id; // si existe, tomamos el ID
            }
            catch (Exception)
            {
                // Si no existe, se crea uno nuevo
                var customerEntity = _mapper.Map<Customer>(request.customerDTO);
                await _mediator.Send(new CreateCustomerCommand { createCustomerDTO = request.customerDTO });
                customerId = customerEntity.id;
            }

            //// 2. Agente (opcional) (TODO: Implementar cuando se realicen los cambios de Agente)
            //int? agentId = null;
            //if (request.customerDTO.agent != null)
            //{
            //    try
            //    {
            //        // Verificar si el agente ya existe en la base de datos
            //        var existingAgent = await _;
            //        agentId = existingAgent.Id;
            //    }
            //    catch (Exception)
            //    {
            //        var agentEntity = _mapper.Map<CustomerAgent>(request.customerDTO.agent);
            //        await _mediator.Send(new CreateCustomerAgentCommand { createAgentDTO = request.customerDTO.agent });
            //        agentId = agentEntity.Id;
            //    }
            //}

            //// 3. WorkPlace (TODO: Implementar cuando se realice un servicio de Workplace)
            //int workPlaceId;
            //try
            //{
            //    var existingWorkPlace = await _mediator.Send(new GetWorkPlaceQuery(request.workPlaceDTO.name, request.workPlaceDTO.address));
            //    workPlaceId = existingWorkPlace.Id;
            //}
            //catch (Exception)
            //{
            //    var workPlaceEntity = _mapper.Map<WorkPlace>(request.workPlaceDTO);
            //    await _mediator.Send(new CreateWorkPlaceCommand { createWorkPlaceDTO = request.workPlaceDTO });
            //    workPlaceId = workPlaceEntity.Id;
            //}
            // 4. Usuario
            var quotation = _mapper.Map<Quotation>(request.quotationDTO);
            await _services.AddAsync(quotation);
            return Unit.Value;
        }
    }
}
