using Domain.Entities;
using Domain.Repositories;
using AutoMapper;


namespace Application.Services
{
    public class BudgetServices
    {
        private readonly IBudgetRepository _budgetRepository;

        public BudgetServices(IBudgetRepository budgetRepository)
        {
            _budgetRepository = budgetRepository;
        }

        public async Task<Budget> GetBudgetByIdAsync(string id)
        {
            return await _budgetRepository.GetByIdAsync(id);
        }
        
        public async Task<List<Budget>> GetBudgetsByCustomerDniAsync(string customerDni)
        {
            return await _budgetRepository.GetBudgetsByCustomerDniAsync(customerDni);
        }

        public async Task<IEnumerable<Budget>> GetAllBudgetsAsync()
        {
            return await _budgetRepository.GetAllAsync();
        }

        public async Task CreateBudgetAsync(Budget budget)
        {
            await _budgetRepository.AddAsync(budget);
        }

        public async Task UpdateBudgetAsync(string id, Budget budget)
        {
            await _budgetRepository.UpdateAsync(id, budget);
        }

        public async Task DeleteBudgetAsync(string id)
        {
            await _budgetRepository.DeleteAsync(id);
        }
    }
}