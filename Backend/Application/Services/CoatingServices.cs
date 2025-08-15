using Domain.Entities;
using Domain.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Services
{
    public class CoatingServices
    {
        private readonly ICoatingRepository _coatingRepository;

        public CoatingServices(ICoatingRepository coatingRepository)
        {
            _coatingRepository = coatingRepository;
        }
        public async Task<IEnumerable<Coating>> GetAllAsync() { return await _coatingRepository.GetAllAsync(); }
        public async Task<Coating?> GetByIdAsync(int id) { return await _coatingRepository.GetByIdAsync(id); }
        public Task AddAsync(Coating coating) { return _coatingRepository.AddAsync(coating); }
        public Task UpdateAsync(Coating coating) { return _coatingRepository.UpdateAsync(coating); }
        public Task DeleteAsync(int id) { return _coatingRepository.DeleteAsync(id); }
    }
}
