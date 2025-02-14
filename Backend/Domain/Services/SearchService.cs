using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Interfaces;
using Entities;
using System.Linq.Expressions;

namespace Services
{
    public class SearchService<T> where T : class
    {
        private readonly IRepository<T> _repository;

        public SearchService(IRepository<T> repository)
        {
            _repository = repository;
        }
        public async Task<T?> SearchByIdAsync(Guid id)
        {
            return await _repository.GetByIdAsync(id);
        }
        public async Task<IEnumerable<T>>SearchByPropertyAsync(Expression<Func<T, bool>> predicate)
        {
            return await _repository.FindAsync(predicate);
        }
    }
}