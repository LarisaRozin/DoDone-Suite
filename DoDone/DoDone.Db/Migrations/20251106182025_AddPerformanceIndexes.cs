using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoDone.Db.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TaskItems_AssignedTo",
                table: "TaskItems");

            migrationBuilder.DropIndex(
                name: "IX_TaskItems_CreatedBy",
                table: "TaskItems");

            migrationBuilder.DropIndex(
                name: "IX_TaskItems_TeamAllowanceIntervalId",
                table: "TaskItems");

            migrationBuilder.DropIndex(
                name: "IX_TaskItems_TeamId",
                table: "TaskItems");

            migrationBuilder.CreateIndex(
                name: "IX_TaskItems_AssignedTo_IsActive",
                table: "TaskItems",
                columns: new[] { "AssignedTo", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_TaskItems_CreatedBy_IsPrivate",
                table: "TaskItems",
                columns: new[] { "CreatedBy", "IsPrivate" });

            migrationBuilder.CreateIndex(
                name: "IX_TaskItems_DueAt_PercentComplete_Active",
                table: "TaskItems",
                columns: new[] { "DueAt", "PercentComplete" },
                filter: "\"DueAt\" IS NOT NULL AND \"IsActive\" = true");

            migrationBuilder.CreateIndex(
                name: "IX_TaskItems_EndAt_Active",
                table: "TaskItems",
                column: "EndAt",
                filter: "\"EndAt\" IS NOT NULL AND \"IsActive\" = true");

            migrationBuilder.CreateIndex(
                name: "IX_TaskItems_MaxBonus_BonusStatusAt",
                table: "TaskItems",
                columns: new[] { "MaxBonus", "BonusStatusAt" },
                filter: "\"MaxBonus\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_TaskItems_StartAt_Active",
                table: "TaskItems",
                column: "StartAt",
                filter: "\"StartAt\" IS NOT NULL AND \"IsActive\" = true");

            migrationBuilder.CreateIndex(
                name: "IX_TaskItems_TeamAllowanceIntervalId_GradedAt_Accredited",
                table: "TaskItems",
                columns: new[] { "TeamAllowanceIntervalId", "GradedAt" },
                filter: "\"IsApprovedForAllowance\" = true AND \"IsArchived\" = false AND \"IsPrivate\" = false AND \"GradeId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_TaskItems_TeamId_IsActive",
                table: "TaskItems",
                columns: new[] { "TeamId", "IsActive" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TaskItems_AssignedTo_IsActive",
                table: "TaskItems");

            migrationBuilder.DropIndex(
                name: "IX_TaskItems_CreatedBy_IsPrivate",
                table: "TaskItems");

            migrationBuilder.DropIndex(
                name: "IX_TaskItems_DueAt_PercentComplete_Active",
                table: "TaskItems");

            migrationBuilder.DropIndex(
                name: "IX_TaskItems_EndAt_Active",
                table: "TaskItems");

            migrationBuilder.DropIndex(
                name: "IX_TaskItems_MaxBonus_BonusStatusAt",
                table: "TaskItems");

            migrationBuilder.DropIndex(
                name: "IX_TaskItems_StartAt_Active",
                table: "TaskItems");

            migrationBuilder.DropIndex(
                name: "IX_TaskItems_TeamAllowanceIntervalId_GradedAt_Accredited",
                table: "TaskItems");

            migrationBuilder.DropIndex(
                name: "IX_TaskItems_TeamId_IsActive",
                table: "TaskItems");

            migrationBuilder.CreateIndex(
                name: "IX_TaskItems_AssignedTo",
                table: "TaskItems",
                column: "AssignedTo");

            migrationBuilder.CreateIndex(
                name: "IX_TaskItems_CreatedBy",
                table: "TaskItems",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_TaskItems_TeamAllowanceIntervalId",
                table: "TaskItems",
                column: "TeamAllowanceIntervalId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskItems_TeamId",
                table: "TaskItems",
                column: "TeamId");
        }
    }
}
