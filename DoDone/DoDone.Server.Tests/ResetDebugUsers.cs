/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db;
using DoDone.Db.Models;
using DoDone.Db.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using Xunit.Abstractions;

namespace DoDone.Server.Tests;

/// <summary>
/// This is a "fake" unit test designed to reset passwords for existing test users.
/// It's not a real unit test - it's a utility to fix corrupted password hashes
/// from users created before proper password hashing was implemented.
/// 
/// This test will:
/// 1. Connect to the actual database
/// 2. Iterate through all users except ID 2 (which has a working password)
/// 3. Set their passwords to "Test123$" using the correct password hasher
/// 4. Save the changes to the database
/// 
/// WARNING: This modifies the actual database! Run this carefully.
/// </summary>
public class ResetDebugUsers
{
    private readonly ITestOutputHelper _output;

    public ResetDebugUsers(ITestOutputHelper output)
    {
        _output = output;
    }



    /// <summary>
    /// "Test" to reset all user passwords except user ID 2.
    /// This is actually a database utility disguised as a test.
    /// Remove the Skip attribute when you're ready to run this.
    /// </summary>
    [Fact(Skip = "RESETS INDIVIDUAL USER PASSWORD - DO NOT RUN!!!!")]
    // [Fact]
    public async Task ResetUserPassword()
    {
        var services = CreateServiceProvider();
        using var scope = services.CreateScope();
        
        var dbContext = scope.ServiceProvider.GetRequiredService<DoDoneDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();
        
        _output.WriteLine("Starting password reset for test user...");
        
        long userId = 6;
        
        // Use a fresh, untracked query to get the user
        var user = await dbContext.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
        {
            _output.WriteLine($"User ID {userId} not found.");
            return;
        }
        
        const string newPassword = "Test123$";
        
        try
        {
            _output.WriteLine($"Updating password for user ID {user.Id} ({user.UserName})...");
            
            // Hash the password correctly using the user instance
            var hashedPassword = passwordHasher.HashPassword(user, newPassword);
            
            // Update only the password hash directly in the database
            await dbContext.Users
                .Where(u => u.Id == userId)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(u => u.PasswordHash, hashedPassword));
            
            _output.WriteLine($"✓ Successfully updated user ID {user.Id}");
        }
        catch (Exception ex)
        {
            _output.WriteLine($"✗ Failed to update user ID {user.Id}: {ex.Message}");
            throw;
        }
    }





    /// <summary>
    /// "Test" to reset all user passwords except user ID 2.
    /// This is actually a database utility disguised as a test.
    /// Remove the Skip attribute when you're ready to run this.
    /// </summary>
    [Fact(Skip = "RESETS ALL USER PASSWORDS - DO NOT RUN!!!!")]
    // [Fact]
    public async Task ResetAllUserPasswords()
    {
        var services = CreateServiceProvider();
        using var scope = services.CreateScope();
        
        var dbContext = scope.ServiceProvider.GetRequiredService<DoDoneDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();
        
        _output.WriteLine("Starting password reset for test users...");
        
        // Get all active users using AsNoTracking to avoid EF tracking issues
        var allUsers = await dbContext.Users
            .AsNoTracking()
            .Where(u => u.IsActive)
            .ToListAsync();
        
        // Filter for load test users
        var usersToUpdate = allUsers.Where(u => 
            u.Email.Contains("loadtest") || u.UserName.StartsWith("loadtest_user_")
        ).ToList();
        
        _output.WriteLine($"Found {usersToUpdate.Count} load test users to update");
        
        if (!usersToUpdate.Any())
        {
            _output.WriteLine("No load test users to update.");
            return;
        }

        const string newPassword = "LoadTest123!";
        var updatedCount = 0;
        
        foreach (var user in usersToUpdate)
        {
            try
            {
                _output.WriteLine($"Updating password for user ID {user.Id} ({user.UserName})...");
                
                // Hash the password correctly using the user instance
                var hashedPassword = passwordHasher.HashPassword(user, newPassword);
                
                // Update only the password hash directly in the database
                var rowsAffected = await dbContext.Users
                    .Where(u => u.Id == user.Id)
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(u => u.PasswordHash, hashedPassword));
                
                if (rowsAffected > 0)
                {
                    updatedCount++;
                    _output.WriteLine($"✓ Successfully updated user ID {user.Id}");
                }
                else
                {
                    _output.WriteLine($"⚠ No rows affected for user ID {user.Id}");
                }
            }
            catch (Exception ex)
            {
                _output.WriteLine($"✗ Failed to update user ID {user.Id}: {ex.Message}");
            }
        }
        
        _output.WriteLine($"Password reset complete! Updated {updatedCount} users.");
        _output.WriteLine($"All updated users now have password: {newPassword}");
    }

    /// <summary>
    /// Dry run test - shows what users would be affected without actually changing them.
    /// This is safe to run anytime.
    /// </summary>
    [Fact(Skip = "debug info")]
    public async Task DryRunShowUsersToUpdate()
    {
        var services = CreateServiceProvider();
        using var scope = services.CreateScope();
        
        var userRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();
        
        _output.WriteLine("DRY RUN - Showing users that would have their passwords reset...");
        
        var allUsers = await userRepository.GetAllActiveAsync();
        var usersToUpdate = allUsers.Where(u => u.Id != 2).ToList();
        
        _output.WriteLine($"Total active users: {allUsers.Count}");
        _output.WriteLine($"Users to update: {usersToUpdate.Count}");
        _output.WriteLine("Users that would be updated:");
        
        foreach (var user in usersToUpdate)
        {
            _output.WriteLine($"  - ID {user.Id}: {user.UserName} ({user.Email})");
        }
        
        _output.WriteLine($"User ID 2 will be SKIPPED (password already working)");
        
        var userTwo = allUsers.FirstOrDefault(u => u.Id == 2);
        if (userTwo != null)
        {
            _output.WriteLine($"  - ID 2: {userTwo.UserName} ({userTwo.Email}) - SKIPPED");
        }
        else
        {
            _output.WriteLine("  - User ID 2 not found in active users");
        }
    }

    /// <summary>
    /// Creates a service provider with the necessary dependencies to access the database
    /// </summary>
    private ServiceProvider CreateServiceProvider()
    {
        var services = new ServiceCollection();
        
        // Build configuration (this will read from appsettings.json)
        var configuration = new ConfigurationBuilder()
            .SetBasePath(AppContext.BaseDirectory)
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .Build();
            
        // Add logging
        services.AddLogging(builder =>
        {
            builder.AddConsole();
            builder.SetMinimumLevel(LogLevel.Warning);
        });
        
        // Add DbContext with the same configuration as the main app
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        services.AddDbContext<DoDoneDbContext>(options =>
            options.UseNpgsql(connectionString, npgsqlOptions =>
            {
                npgsqlOptions.CommandTimeout(30);
                npgsqlOptions.EnableRetryOnFailure(maxRetryCount: 3, maxRetryDelay: TimeSpan.FromSeconds(2), errorCodesToAdd: null);
            }));
        
        // Add Identity password hasher
        services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
        
        // Add repositories
        services.AddScoped<IUserRepository, UserRepository>();
        
        return services.BuildServiceProvider();
    }
}
