using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoDone.Db.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAllowanceIntervalSemmesters : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EndAt",
                table: "TeamAllowanceIntervalSemesters");

            migrationBuilder.DropColumn(
                name: "StartAt",
                table: "TeamAllowanceIntervalSemesters");

            migrationBuilder.AddColumn<int>(
                name: "EndDay",
                table: "TeamAllowanceIntervalSemesters",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "EndMonth",
                table: "TeamAllowanceIntervalSemesters",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "StartDay",
                table: "TeamAllowanceIntervalSemesters",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "StartMonth",
                table: "TeamAllowanceIntervalSemesters",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EndDay",
                table: "TeamAllowanceIntervalSemesters");

            migrationBuilder.DropColumn(
                name: "EndMonth",
                table: "TeamAllowanceIntervalSemesters");

            migrationBuilder.DropColumn(
                name: "StartDay",
                table: "TeamAllowanceIntervalSemesters");

            migrationBuilder.DropColumn(
                name: "StartMonth",
                table: "TeamAllowanceIntervalSemesters");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "EndAt",
                table: "TeamAllowanceIntervalSemesters",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "StartAt",
                table: "TeamAllowanceIntervalSemesters",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));
        }
    }
}
