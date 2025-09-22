using Domain.Entities;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Data.Common;
using System.Globalization;
using System.Data;

namespace Infrastructure.Persistence.Repositories;
public class AccesoriesRepository : IAccesoryRepository
{
    private readonly AppDbContext _context;
    public AccesoriesRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(Accesory accessory)
    {
        _context.Accesories.Add(accessory);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var conn = _context.Database.GetDbConnection();
        var openedHere = false;
        try
        {
            if (conn.State != ConnectionState.Open)
            {
                await conn.OpenAsync();
                openedHere = true;
            }

            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "DELETE FROM accessories WHERE id = @id";
            var p = cmd.CreateParameter();
            p.ParameterName = "@id";
            p.Value = id;
            cmd.Parameters.Add(p);
            await cmd.ExecuteNonQueryAsync();
        }
        finally
        {
            if (openedHere)
            {
                try { await conn.CloseAsync(); } catch { /* ignore close errors */ }
            }
        }
    }

    public async Task<IEnumerable<Accesory>> GetAllAsync()
    {
        var list = new List<Accesory>();
        var conn = _context.Database.GetDbConnection();
        var openedHere = false;
        try
        {
            if (conn.State != ConnectionState.Open)
            {
                await conn.OpenAsync();
                openedHere = true;
            }

            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT id, name, price FROM accessories";
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var rawId = reader["id"];
                var rawName = reader["name"];
                var rawPrice = reader["price"];
                var acc = new Accesory
                {
                    id = rawId is int i ? i : Convert.ToInt32(rawId),
                    name = rawName?.ToString() ?? string.Empty,
                    price = ParseDecimalSafe(rawPrice)
                };
                list.Add(acc);
            }
        }
        finally
        {
            if (openedHere)
            {
                try { await conn.CloseAsync(); } catch { /* ignore */ }
            }
        }
        return list;
    }

    public async Task<Accesory?> GetByIdAsync(int id)
    {
        var conn = _context.Database.GetDbConnection();
        var openedHere = false;
        try
        {
            if (conn.State != ConnectionState.Open)
            {
                await conn.OpenAsync();
                openedHere = true;
            }

            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT id, name, price FROM accessories WHERE id = @id LIMIT 1";
            var p = cmd.CreateParameter();
            p.ParameterName = "@id";
            p.Value = id;
            cmd.Parameters.Add(p);
            await using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                var acc = new Accesory
                {
                    id = reader["id"] is int i ? i : Convert.ToInt32(reader["id"]),
                    name = reader["name"]?.ToString() ?? string.Empty,
                    price = ParseDecimalSafe(reader["price"])
                };
                return acc;
            }
        }
        finally
        {
            if (openedHere)
            {
                try { await conn.CloseAsync(); } catch { /* ignore */ }
            }
        }
        return null;
    }

    public async Task<Accesory?> GetByNameAsync(string name)
    {
        return _context.Accesories.Find(name);
    }

    public async Task<IEnumerable<Accesory>> SearchByNameAsync(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return Enumerable.Empty<Accesory>();
        var list = new List<Accesory>();
        var conn = _context.Database.GetDbConnection();
        var openedHere = false;
        try
        {
            if (conn.State != ConnectionState.Open)
            {
                await conn.OpenAsync();
                openedHere = true;
            }

            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT id, name, price FROM accessories WHERE LOWER(name) LIKE @p";
            var p = cmd.CreateParameter();
            p.ParameterName = "@p";
            p.Value = $"%{text.ToLowerInvariant()}%";
            cmd.Parameters.Add(p);
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var acc = new Accesory
                {
                    id = reader["id"] is int i ? i : Convert.ToInt32(reader["id"]),
                    name = reader["name"]?.ToString() ?? string.Empty,
                    price = ParseDecimalSafe(reader["price"])
                };
                list.Add(acc);
            }
        }
        finally
        {
            if (openedHere)
            {
                try { await conn.CloseAsync(); } catch { /* ignore */ }
            }
        }
        return list;
    }

    public async Task UpdateAsync(Accesory accessory)
    {
        _context.Accesories.Update(accessory);
        await _context.SaveChangesAsync();
    }

    // Helper: parsear de forma segura distintos tipos devueltos por DB
    private static decimal ParseDecimalSafe(object? raw)
    {
        if (raw == null || raw == DBNull.Value) return 0m;
        if (raw is decimal d) return d;
        if (raw is double db) return Convert.ToDecimal(db);
        if (raw is float f) return Convert.ToDecimal(f);
        if (raw is long l) return Convert.ToDecimal(l);
        if (raw is int i) return Convert.ToDecimal(i);
        var s = raw.ToString();
        if (string.IsNullOrWhiteSpace(s)) return 0m;
        // intentar parse con InvariantCulture y también con coma como separador
        if (decimal.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var res)) return res;
        var alt = s.Replace(',', '.');
        if (decimal.TryParse(alt, NumberStyles.Any, CultureInfo.InvariantCulture, out res)) return res;
        // fallback 0
        return 0m;
    }
}
