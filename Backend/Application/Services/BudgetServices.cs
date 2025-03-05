using Application.DTOs;
using Domain.Entities;
using Domain.Enums;
using Domain.Repositories;
using Domain.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

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

        public async Task<IEnumerable<Budget>> GetAllBudgetsAsync()
        {
            return await _budgetRepository.GetAllAsync();
        }

        public async Task CreateBudgetAsync(BudgetDTO budgetDto, List<Budget_ProductDTO> productDto, List<Budget_AccesoryDTO> accesoryDto)
        {
            if (!Enum.TryParse<BudgetStatus>(budgetDto.status, out var statusEnum))
            {
                throw new ArgumentException("Estado inválido"); // Evita errores si el string es incorrecto
            }
            var budget = new Budget
            {
                creationDate = budgetDto.creationDate,
                status = statusEnum,
                user = new User { name = budgetDto.user.name, lastname = budgetDto.user.lastName },
                customer = new Customer
                {
                    name = budgetDto.customer.name,
                    lastname = budgetDto.customer.lastname,
                    tel = budgetDto.customer.telephoneNumber,
                    mail = budgetDto.customer.email,
                    address = budgetDto.customer.address,
                    agent = new CustomerAgent
                    {
                        name = budgetDto.customer.agent.name,
                        lastname = budgetDto.customer.agent.lastname,
                        telephoneNumber = budgetDto.customer.agent.telephoneNumber,
                        email = budgetDto.customer.agent.email
                    }
                },
                workPlace = new WorkPlace
                {
                    name = budgetDto.workPlace.name,
                    address = budgetDto.workPlace.address,
                    workTypeAlt = new WorkType
                    {
                        type = budgetDto.workPlace.workType.type

                    }
                },
                Products = productDto.Select(p => new Budget_Product
                {
                    Name = p.Name,
                    Type = new ProductType
                    {
                        Name = p.Type.Name,
                        Category = new ProductCategory
                        {
                            Name = p.Type.Category.Name
                        }
                    },
                    Quantity = p.Quantity,
                    AlumMaterial = new Material
                    {
                        name = p.AlumMaterial.name,
                        type = new MaterialType
                        {
                            name = p.AlumMaterial.type.name
                        }
                    },
                    GlassMaterial = new Material
                    {
                        name = p.AlumMaterial.name,
                        type = new MaterialType
                        {
                            name = p.AlumMaterial.type.name
                        }
                    },
                    width = p.width,
                    height = p.height,
                    Accesory = accesoryDto.Select(a => new Budget_Accesory
                    {
                        Quantity = a.Quantity,
                        Name = a.Name,
                        Type = new MaterialType
                        {
                            name = a.Type.name
                        }
                    }).ToList()
                }).ToList()
            };
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
