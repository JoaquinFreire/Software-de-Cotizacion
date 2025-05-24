using Domain.Entities;
using Domain.Repositories;
using System;
using System.Threading.Tasks;

namespace Application.UseCases
{
    public class CreateQuotation
    {
        private readonly IQuotationRepository _quotationRepository;

        public CreateQuotation(IQuotationRepository quotationRepository)
        {
            _quotationRepository = quotationRepository;
        }

        public async Task<Quotation> ExecuteAsync(int customerId, int userId, int workPlaceId, decimal totalPrice)
        {
            var newQuotation = new Quotation
            {
                CustomerId = customerId,
                UserId = userId,
                WorkPlaceId = workPlaceId,
                TotalPrice = totalPrice,
                Status = "pending",
                LastEdit = DateTime.UtcNow,
                CreationDate = DateTime.UtcNow
            };

            try
            {
                await _quotationRepository.AddAsync(newQuotation);
                return newQuotation;
            }
            catch (Exception ex)
            {
                // Agrega más detalles de depuración
                Console.WriteLine("Error creating quotation in use case: " + ex.Message);
                Console.WriteLine("Stack Trace: " + ex.StackTrace);
                throw;
            }
        }
    }
}
