using AutoMapper;
using MediatR;
using Domain.Entities;
using Application.Services;

namespace Application.DTOs.UserInvitationDTOs.CreateUserInvitation
{
    public class CreateUserInvitationHandler : IRequestHandler<CreateUserInvitationCommand, string>
    {
        private readonly UserInvitationServices _services;
        private readonly IMailServices _mailServices;
        private readonly UserServices _userServices;
        private readonly IMapper _mapper;
        public CreateUserInvitationHandler(UserInvitationServices services, IMapper mapper, UserServices userServices, IMailServices mailServices)
        {
            _services = services;
            _userServices = userServices;
            _mapper = mapper;
            _mailServices = mailServices;
        }
        public async Task<string> Handle(CreateUserInvitationCommand request, CancellationToken cancellationToken)
        {
            // buscar usuario
            var user = await _userServices.GetByIdAsync(request.UserId);
            if (user == null) {
                throw new KeyNotFoundException($"User with ID {request.UserId} not found.");
            }
            // generar token
            var token = Guid.NewGuid().ToString();
            // crear invitación
            var invitation = new UserInvitation
            {
                user_id = request.UserId,
                token = token,
                expires_at = DateTime.UtcNow.AddHours(24),
                used = false
            };
            await _services.AddAsync(invitation);
            // enviar mail
            try
            {
                await _mailServices.SendInvitationMail(user.mail, token);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error enviando mail: " + ex.Message);
                throw; // dejar que la excepción suba, el controlador la manejará
            }
            return token;
        }
    }
}
