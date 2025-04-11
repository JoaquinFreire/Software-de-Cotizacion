using Domain.Entities;
using Domain.Repositories;
using System.Threading.Tasks;

namespace Application.UseCases
{
    public class CreateCustomer
    {
        private readonly ICustomerRepository _customerRepository;

        public CreateCustomer(ICustomerRepository customerRepository)
        {
            _customerRepository = customerRepository;
        }

        public async Task<Customer> ExecuteAsync(string name, string lastName, string phone, string email, string address)
        {
            var newCustomer = new Customer
            {
                name = name,
                lastname = lastName,
                tel = phone,
                mail = email,
                address = address
            };

            await _customerRepository.AddAsync(newCustomer);
            return newCustomer;
        }
    }
}
