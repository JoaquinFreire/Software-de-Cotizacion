using Application.Services;
using Domain.Exceptions;
using Domain.Repositories;

namespace Application.Validators
{
    public class IdentityValidation
    {
        private readonly UserServices _userServices;
        private readonly CustomerServices _customerServices;
        private readonly CustomerAgentServices _customerAgentServices;

        public IdentityValidation(UserServices userServices, CustomerServices customerServices, CustomerAgentServices customerAgentServices)
        {
            _userServices = userServices;
            _customerServices = customerServices;
            _customerAgentServices = customerAgentServices;
        }

        public async Task ValidateUniqueDniAsync(string dni, string entityType)
        {
            if (entityType == "Customer")
            {
                var existing = await _customerServices.GetByDniAsync(dni);
                if (existing != null)
                    throw new BusinessException("El DNI ya está registrado como cliente.");
            }
            else if (entityType == "Agent")
            {
               var existing = await _customerAgentServices.GetByDniAsync(dni);
                if (existing != null)
                    throw new BusinessException("El dni ya está registrado como agente.");
            }
            else if (entityType == "User")
            {
                var existing = await _userServices.GetByDniAsync(dni);
                if (existing != null)
                    throw new BusinessException("El DNI ya está registrado como usuario.");
            }
        }

    }
}
