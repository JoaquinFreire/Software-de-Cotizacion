using AutoMapper;
using Domain.Entities;
using Application.Services;
using MediatR;

namespace Application.DTOs.UserDTOs.UpdateUserStatus
{
    public class UpdateUserStatusHandler : IRequestHandler<UpdateUserStatusCommand, Unit>
    {
        private readonly UserServices _services;
        private readonly IMapper _mapper;
        public UpdateUserStatusHandler(UserServices services, IMapper mapper)
        {
            _services = services;
            _mapper = mapper;
        }
        public async Task<Unit> Handle(UpdateUserStatusCommand request, CancellationToken cancellationToken)
        {
            var user = await _services.GetByIdAsync(request.Id);
            //Instancia de validación
            if(user.status == 1){
                user.status = 0;
                } else{
                    user.status = 1;
                }
            await _services.UpdateAsync(user);
            return Unit.Value;
        }
    }
}
