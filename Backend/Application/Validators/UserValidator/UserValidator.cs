using Domain.Validators;
using Domain.Entities;

namespace Application.Validators.UserValidator
{
    public class UserValidator : IUserValidator
    {
        private readonly IdentityValidation _identityValidation;
        public UserValidator(IdentityValidation identityValidation)
        {
            _identityValidation = identityValidation;
        }
        public async Task Validate(User user)
        {
            //TODO: Validar que la selección de roles sea correcta
            await _identityValidation.ValidateUniqueDniAsync(user.legajo, "User");
            GeneralRules.ValidateDni(user.legajo);
            GeneralRules.ValidateNameAndLastName(user.name, user.lastName);
            GeneralRules.ValidateEmail(user.mail);
        }
    }
}
