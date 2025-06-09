using Application.UseCases;
using Domain.Entities;
using Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

[ApiController]
[Route("api/test")]
public class TestController : ControllerBase
{
    public TestController()
    {
        Console.WriteLine("TestController creado");
    }
    [HttpGet]
    public IActionResult Get() => Ok("¡Funciona!");
}