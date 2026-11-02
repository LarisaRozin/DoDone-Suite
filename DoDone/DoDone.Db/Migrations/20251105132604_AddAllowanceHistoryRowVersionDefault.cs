using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoDone.Db.Migrations
{
    /// <inheritdoc />
    public partial class AddAllowanceHistoryRowVersionDefault : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<byte[]>(
                name: "RowVersion",
                table: "AllowanceHistories",
                type: "bytea",
                rowVersion: true,
                nullable: false,
                defaultValueSql: "'\\x00000000'::bytea",
                oldClrType: typeof(byte[]),
                oldType: "bytea",
                oldRowVersion: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<byte[]>(
                name: "RowVersion",
                table: "AllowanceHistories",
                type: "bytea",
                rowVersion: true,
                nullable: false,
                oldClrType: typeof(byte[]),
                oldType: "bytea",
                oldRowVersion: true,
                oldDefaultValueSql: "'\\x00000000'::bytea");
        }
    }
}
