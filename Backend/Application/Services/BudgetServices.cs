using Application.DTOs;
using Domain.Entities;
using Domain.Enums;
using Domain.Repositories;
using AutoMapper;


namespace Application.Services
{
    public class BudgetServices
    {
        private readonly IBudgetRepository _budgetRepository;
        private readonly IMapper _mapper;

        public BudgetServices(IBudgetRepository budgetRepository, IMapper mapper)
        {
            _budgetRepository = budgetRepository;
            _mapper = mapper;
        }

        public async Task<Budget> GetBudgetByIdAsync(string id)
        {
            return await _budgetRepository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<Budget>> GetAllBudgetsAsync()
        {
            return await _budgetRepository.GetAllAsync();
        }

        public async Task CreateBudgetAsync(BudgetDTO budgetDto)
        {
            var budget = _mapper.Map<Budget>(budgetDto);
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