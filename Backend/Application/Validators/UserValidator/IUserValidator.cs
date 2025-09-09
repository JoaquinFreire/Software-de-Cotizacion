using Domain.Entities;


namespace Application.Validators.UserValidator
{
    public interface IUserValidator
    {
        Task Validate(User user);
    }
}
