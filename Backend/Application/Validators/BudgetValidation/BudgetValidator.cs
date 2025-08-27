using Domain.Entities;
using Domain.Validators;

namespace Application.Validators.BudgetValidation
{
    public class BudgetValidator : IBudgetValidator
    {
        public void Validate(Budget budget)
        {
            BudgetRules.ValidateUser(budget);
            BudgetRules.ValidateCustomer(budget);
            BudgetRules.ValidateWorkPlace(budget);
            BudgetRules.ValidateAllDate(budget);
            BudgetRules.ValidateMinimumProducts(budget.Products);

            foreach (var product in budget.Products)
            {
                BudgetRules.ValidatePositiveQuantity(product);
                BudgetRules.ValidateSizeLimits(product);
                BudgetRules.ValidateMaxQuantity(product);
            }

            //TODO: Descomentar cuando se implemente la validación de precios
            //BudgetRules.ValidateDollarReference(budget);
            //BudgetRules.ValidateLabourReference(budget);
            //BudgetRules.ValidateTotal(budget);
        }
    }
}
