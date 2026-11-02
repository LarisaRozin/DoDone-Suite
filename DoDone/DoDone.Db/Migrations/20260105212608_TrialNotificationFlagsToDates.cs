using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoDone.Db.Migrations
{
    /// <inheritdoc />
    public partial class TrialNotificationFlagsToDates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Trial1DayWarningSent",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "Trial3DayWarningSent",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "TrialExpiredWarningSent",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "TrialWelcomeShown",
                table: "AspNetUsers");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "Trial1DayWarningSentAt",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "Trial3DayWarningSentAt",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "TrialExpiredWarningSentAt",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "TrialWelcomeSentAt",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: 1L,
                columns: new[] { "Trial1DayWarningSentAt", "Trial3DayWarningSentAt", "TrialExpiredWarningSentAt", "TrialWelcomeSentAt" },
                values: new object[] { null, null, null, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Trial1DayWarningSentAt",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "Trial3DayWarningSentAt",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "TrialExpiredWarningSentAt",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "TrialWelcomeSentAt",
                table: "AspNetUsers");

            migrationBuilder.AddColumn<bool>(
                name: "Trial1DayWarningSent",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "Trial3DayWarningSent",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "TrialExpiredWarningSent",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "TrialWelcomeShown",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: 1L,
                columns: new[] { "Trial1DayWarningSent", "Trial3DayWarningSent", "TrialExpiredWarningSent", "TrialWelcomeShown" },
                values: new object[] { false, false, false, false });
        }
    }
}
