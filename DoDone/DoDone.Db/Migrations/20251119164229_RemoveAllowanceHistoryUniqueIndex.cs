using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoDone.Db.Migrations
{
    /// <inheritdoc />
    public partial class RemoveAllowanceHistoryUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AllowanceHistories_UserId_TeamAllowanceIntervalId_Calculate~",
                table: "AllowanceHistories");

            migrationBuilder.CreateIndex(
                name: "IX_AllowanceHistories_UserId",
                table: "AllowanceHistories",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AllowanceHistories_UserId",
                table: "AllowanceHistories");

            migrationBuilder.CreateIndex(
                name: "IX_AllowanceHistories_UserId_TeamAllowanceIntervalId_Calculate~",
                table: "AllowanceHistories",
                columns: new[] { "UserId", "TeamAllowanceIntervalId", "CalculatedStartAt", "CalculatedEndAt", "ApprovedAt" },
                unique: true);
        }
    }
}
