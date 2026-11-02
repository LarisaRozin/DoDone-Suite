using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoDone.Db.Migrations
{
    /// <inheritdoc />
    public partial class FixUniqueIndexForAllowanceHistories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AllowanceHistories_TeamId_UserId_AllowanceIntervalType_Allo~",
                table: "AllowanceHistories");

            migrationBuilder.DropIndex(
                name: "IX_AllowanceHistories_UserId",
                table: "AllowanceHistories");

            // Drop IX_AllowanceHistories_TeamId if it exists to avoid conflicts
            migrationBuilder.Sql(@"
                DROP INDEX IF EXISTS ""IX_AllowanceHistories_TeamId"";
            ");

            migrationBuilder.CreateIndex(
                name: "IX_AllowanceHistories_TeamId",
                table: "AllowanceHistories",
                column: "TeamId");

            migrationBuilder.CreateIndex(
                name: "IX_AllowanceHistories_UserId_TeamAllowanceIntervalId_Calculate~",
                table: "AllowanceHistories",
                columns: new[] { "UserId", "TeamAllowanceIntervalId", "CalculatedStartAt", "CalculatedEndAt", "ApprovedAt" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AllowanceHistories_TeamId",
                table: "AllowanceHistories");

            migrationBuilder.DropIndex(
                name: "IX_AllowanceHistories_UserId_TeamAllowanceIntervalId_Calculate~",
                table: "AllowanceHistories");

            migrationBuilder.CreateIndex(
                name: "IX_AllowanceHistories_TeamId_UserId_AllowanceIntervalType_Allo~",
                table: "AllowanceHistories",
                columns: new[] { "TeamId", "UserId", "AllowanceIntervalType", "AllowanceIntervalValue", "StartDayOfWeek", "CalculatedStartAt", "CalculatedEndAt", "ApprovedAt" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AllowanceHistories_UserId",
                table: "AllowanceHistories",
                column: "UserId");
        }
    }
}
