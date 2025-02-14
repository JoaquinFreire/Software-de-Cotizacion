using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Entities;

namespace Interfaces
{
    public interface IUserRepository
    {
        void CreateUser(User user);
        public interface DeleteUser { }
        public interface UpdateUser { }
    }
}
