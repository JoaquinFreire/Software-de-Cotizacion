using System;

namespace Domain.Entities;

public class UserInvitation
{
    public int id { get; set; }
    public int user_id { get; set; }
    public string token { get; set; } = string.Empty;
    public DateTime expires_at { get; set; }
    public bool used { get; set; } = false;

    // Navegación (opcional)
    public User user { get; set; }
}