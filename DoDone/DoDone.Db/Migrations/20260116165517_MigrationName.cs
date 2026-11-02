using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoDone.Db.Migrations
{
    /// <inheritdoc />
    public partial class MigrationName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "AspNetUsers",
                columns: new[] { "Id", "AccessFailedCount", "AvatarUri", "ConcurrencyStamp", "CreatedAt", "CreatedBy", "Email", "EmailConfirmed", "FirstName", "IsActive", "IsFirstTeamAdmin", "LastName", "LockoutEnabled", "LockoutEnd", "MiddleName", "NormalizedEmail", "NormalizedUserName", "PasswordHash", "PhoneNumber", "PhoneNumberConfirmed", "Salutation", "SecurityStamp", "TeamId", "Trial1DayWarningSentAt", "Trial3DayWarningSentAt", "TrialExpiredWarningSentAt", "TrialWelcomeSentAt", "TwoFactorEnabled", "UpdatedAt", "UpdatedBy", "UserName" },
                values: new object[] { 100000L, 0, null, "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", new DateTimeOffset(new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, "deleted@dodone.com", true, "Deleted", false, false, "User", false, null, null, "DELETED@DODONE.COM", "DELETED", "AQAAAAEAACcQAAAAEJ8u9kXfSklHmPE4U1z4kJ8DKB5e2MYdJfz9h7QZQ4Kq8w5I6HJG9v8X2F7N5a3O4P", null, false, null, "AAAAAAAAAAAAAAAAAAAAAAAAAA", 1L, null, null, null, null, false, null, null, "deleted" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: 100000L);
        }
    }
}
