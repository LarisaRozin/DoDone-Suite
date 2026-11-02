using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoDone.Db.Migrations
{
    /// <inheritdoc />
    public partial class AddPurchaseHistoryUniqueConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_PurchaseHistories_OriginalTransactionId",
                table: "PurchaseHistories",
                column: "OriginalTransactionId",
                unique: true,
                filter: "\"OriginalTransactionId\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PurchaseHistories_OriginalTransactionId",
                table: "PurchaseHistories");
        }
    }
}
