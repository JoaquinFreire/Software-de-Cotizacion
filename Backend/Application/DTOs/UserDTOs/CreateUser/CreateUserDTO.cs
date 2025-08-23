namespace Application.DTOs.UserDTOs.CreateUser;
public class CreateUserDTO
{
    public required string name { get; set; }
    public required string lastName { get; set; }
    public string? legajo { get; set; }
    public string? password_hash { get; set; }
    public required int role_id { get; set; }
    public required string mail { get; set; }
}
