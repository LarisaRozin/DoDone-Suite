using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoDone.Db.Migrations
{
    /// <inheritdoc />
    public partial class UserTrialNotificationFlags : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsFirstTeamAdmin",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

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
                columns: new[] { "IsFirstTeamAdmin", "Trial1DayWarningSent", "Trial3DayWarningSent", "TrialExpiredWarningSent", "TrialWelcomeShown" },
                values: new object[] { false, false, false, false, false });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsFirstTeamAdmin",
                table: "AspNetUsers");

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
        }
    }
}
