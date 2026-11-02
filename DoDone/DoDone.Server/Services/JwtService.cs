/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DoDone.Db.Models;

namespace DoDone.Server.Services;

public interface IJwtService
{
    string GenerateToken(User user, int? expiryMinutes = null);
    bool ValidateToken(string token, long userId);
    ClaimsPrincipal? GetPrincipalFromToken(string token);
    bool IsTokenExpired(string token);
}

public class JwtService : IJwtService
{
    private readonly IConfiguration _configuration;

    public JwtService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    private string GetJwtKey()
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var key = jwtSettings["Key"];
        
        // If key is empty or null, try environment variable
        if (string.IsNullOrEmpty(key))
        {
            key = Environment.GetEnvironmentVariable("JWT_KEY");
        }
        
        if (string.IsNullOrEmpty(key))
        {
            throw new InvalidOperationException("JWT Key not found in configuration or environment variables");
        }
        
        return key;
    }

    public string GenerateToken(User user, int? expiryMinutes = null)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(GetJwtKey()));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.UserName!),
            new Claim(ClaimTypes.Email, user.Email ?? ""),
            new Claim("FirstName", user.FirstName ?? ""),
            new Claim("LastName", user.LastName ?? ""),
            new Claim("TeamId", user.TeamId.ToString()),
            new Claim("IsAdmin", user.IsAdmin.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat, 
                DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), 
                ClaimValueTypes.Integer64)
        };

        // Use provided expiry minutes or fall back to configuration
        var tokenExpiryMinutes = expiryMinutes ?? int.Parse(jwtSettings["ExpiryMinutes"]!);

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTimeOffset.UtcNow.AddMinutes(tokenExpiryMinutes).DateTime,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public bool ValidateToken(string token, long userId)
    {
        try
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(GetJwtKey()));
            
            var tokenHandler = new JwtSecurityTokenHandler();
            
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSettings["Issuer"],
                ValidAudience = jwtSettings["Audience"],
                IssuerSigningKey = key,
                ClockSkew = TimeSpan.Zero // No tolerance for expiration time
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);
            
            // Additional validation: check if the token belongs to the specified user
            var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null || !long.TryParse(userIdClaim, out var tokenUserId) || tokenUserId != userId)
            {
                return false;
            }

            return true;
        }
        catch (SecurityTokenExpiredException)
        {
            // Token has expired
            return false;
        }
        catch (SecurityTokenInvalidSignatureException)
        {
            // Token signature is invalid
            return false;
        }
        catch (SecurityTokenException)
        {
            // Other token validation errors
            return false;
        }
        catch (Exception)
        {
            // Any other unexpected errors
            return false;
        }
    }

    public ClaimsPrincipal? GetPrincipalFromToken(string token)
    {
        try
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(GetJwtKey()));
            
            var tokenHandler = new JwtSecurityTokenHandler();
            
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSettings["Issuer"],
                ValidAudience = jwtSettings["Audience"],
                IssuerSigningKey = key,
                ClockSkew = TimeSpan.Zero
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);
            return principal;
        }
        catch
        {
            return null;
        }
    }

    public bool IsTokenExpired(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var jsonToken = tokenHandler.ReadJwtToken(token);
            
            return jsonToken.ValidTo < DateTimeOffset.UtcNow.DateTime;
        }
        catch
        {
            return true; // If we can't read the token, consider it expired
        }
    }
}
