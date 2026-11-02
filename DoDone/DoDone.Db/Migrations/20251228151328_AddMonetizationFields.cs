using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoDone.Db.Migrations
{
    /// <inheritdoc />
    public partial class AddMonetizationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OriginalTransactionId",
                table: "Teams",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProductId",
                table: "Teams",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PurchaseToken",
                table: "Teams",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReceiptData",
                table: "Teams",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "SubscriptionExpiresAt",
                table: "Teams",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SubscriptionPlatform",
                table: "Teams",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SubscriptionTier",
                table: "Teams",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "TransactionId",
                table: "Teams",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "TrialEndsAt",
                table: "Teams",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Teams",
                keyColumn: "Id",
                keyValue: 1L,
                columns: new[] { "OriginalTransactionId", "ProductId", "PurchaseToken", "ReceiptData", "SubscriptionExpiresAt", "SubscriptionPlatform", "SubscriptionTier", "TransactionId", "TrialEndsAt" },
                values: new object[] { null, null, null, null, null, null, 0, null, null });

            migrationBuilder.UpdateData(
                table: "Teams",
                keyColumn: "Id",
                keyValue: 2L,
                columns: new[] { "OriginalTransactionId", "ProductId", "PurchaseToken", "ReceiptData", "SubscriptionExpiresAt", "SubscriptionPlatform", "SubscriptionTier", "TransactionId", "TrialEndsAt" },
                values: new object[] { null, null, null, null, null, null, 0, null, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OriginalTransactionId",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "ProductId",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "PurchaseToken",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "ReceiptData",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "SubscriptionExpiresAt",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "SubscriptionPlatform",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "SubscriptionTier",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "TransactionId",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "TrialEndsAt",
                table: "Teams");
        }
    }
}
