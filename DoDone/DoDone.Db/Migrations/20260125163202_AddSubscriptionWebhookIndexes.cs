using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoDone.Db.Migrations
{
    /// <inheritdoc />
    public partial class AddSubscriptionWebhookIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Teams_OriginalTransactionId",
                table: "Teams",
                column: "OriginalTransactionId",
                filter: "\"OriginalTransactionId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Teams_ProductId_Platform",
                table: "Teams",
                columns: new[] { "ProductId", "SubscriptionPlatform" },
                filter: "(\"SubscriptionPlatform\" = 'android' OR \"SubscriptionPlatform\" = 'ios')");

            migrationBuilder.CreateIndex(
                name: "IX_Teams_PurchaseToken",
                table: "Teams",
                column: "PurchaseToken",
                filter: "\"PurchaseToken\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Teams_OriginalTransactionId",
                table: "Teams");

            migrationBuilder.DropIndex(
                name: "IX_Teams_ProductId_Platform",
                table: "Teams");

            migrationBuilder.DropIndex(
                name: "IX_Teams_PurchaseToken",
                table: "Teams");
        }
    }
}
