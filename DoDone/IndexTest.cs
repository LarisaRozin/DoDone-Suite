using Microsoft.EntityFrameworkCore;
using DoDone.Db.Models;
using DoDone.Shared.Enums;

// Simple test to verify unique constraint
public class IndexTest
{
    public static async Task TestUniqueConstraint()
    {
        var connectionString = "Host=localhost;Port=5432;Database=dodone;Username=dodone_user;Password=2Business123;Pooling=true;Minimum Pool Size=20;Maximum Pool Size=500;Connection Idle Lifetime=300;Timeout=30;Command Timeout=30;Connection Pruning Interval=10;Keepalive=30";
        
        var options = new DbContextOptionsBuilder<DoDoneDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        using var context = new DoDoneDbContext(options);
        
        Console.WriteLine("Testing unique constraint on AllowanceHistories...");
        
        try
        {
            // First, check if any data exists
            var count = await context.AllowanceHistories.CountAsync();
            Console.WriteLine($"Current AllowanceHistories count: {count}");
            
            // Try to create two identical records to test unique constraint
            var now = DateTimeOffset.UtcNow;
            
            var history1 = new AllowanceHistory
            {
                TeamId = 1,
                UserId = 1,
                TeamAllowanceIntervalId = 1,
                AllowanceIntervalType = AllowanceIntervalType.Weekly,
                AllowanceIntervalValue = 1,
                StartDayOfWeek = DayOfWeek.Monday,
                CalculatedStartAt = now,
                ActualStartAt = now,
                CalculatedEndAt = now.AddDays(7),
                TotalCredits = 100,
                Gpa = 3.5m,
                CalculatedAmount = 50.0m,
                CreatedAt = now
            };
            
            context.AllowanceHistories.Add(history1);
            await context.SaveChangesAsync();
            Console.WriteLine("First record added successfully");
            
            // Try to add duplicate - this should fail if unique constraint exists
            var history2 = new AllowanceHistory
            {
                TeamId = 1, // Same as history1
                UserId = 1, // Same as history1
                TeamAllowanceIntervalId = 2, // Different, but constraint includes other fields
                AllowanceIntervalType = AllowanceIntervalType.Weekly, // Same as history1
                AllowanceIntervalValue = 1, // Same as history1
                StartDayOfWeek = DayOfWeek.Monday, // Same as history1
                CalculatedStartAt = now, // Same as history1
                ActualStartAt = now,
                CalculatedEndAt = now.AddDays(7), // Same as history1
                ApprovedAt = null, // Same as history1 (both null)
                TotalCredits = 200,
                Gpa = 4.0m,
                CalculatedAmount = 75.0m,
                CreatedAt = now
            };
            
            context.AllowanceHistories.Add(history2);
            await context.SaveChangesAsync();
            Console.WriteLine("ERROR: Second duplicate record was added - unique constraint is NOT working!");
            
        }
        catch (DbUpdateException ex)
        {
            if (ex.InnerException?.Message?.Contains("duplicate key") == true || 
                ex.InnerException?.Message?.Contains("unique constraint") == true)
            {
                Console.WriteLine("SUCCESS: Unique constraint is working - duplicate record was rejected");
                Console.WriteLine($"Error: {ex.InnerException.Message}");
            }
            else
            {
                Console.WriteLine($"Unexpected error: {ex.Message}");
                if (ex.InnerException != null)
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
    }
}