using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoDone.Db.Migrations
{
    /// <inheritdoc />
    public partial class AddIsSchoolBreak : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsSchoolBreak",
                table: "TeamAllowanceIntervalSemesters",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsSchoolBreak",
                table: "TeamAllowanceIntervalSemesters");
        }
    }
}
