using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace DoDone.Db.Migrations
{
    /// <inheritdoc />
    public partial class RenameSemesterToGradingPeriod : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TeamAllowanceIntervalSemesters");

            migrationBuilder.CreateTable(
                name: "TeamAllowanceIntervalGradingPeriods",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TeamAllowanceIntervalId = table.Column<long>(type: "bigint", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    StartMonth = table.Column<int>(type: "integer", nullable: false),
                    StartDay = table.Column<int>(type: "integer", nullable: false),
                    EndMonth = table.Column<int>(type: "integer", nullable: false),
                    EndDay = table.Column<int>(type: "integer", nullable: false),
                    IsSchoolBreak = table.Column<bool>(type: "boolean", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "bytea", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeamAllowanceIntervalGradingPeriods", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TeamAllowanceIntervalGradingPeriods_TeamAllowanceIntervals_~",
                        column: x => x.TeamAllowanceIntervalId,
                        principalTable: "TeamAllowanceIntervals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TeamAllowanceIntervalGradingPeriods_TeamAllowanceIntervalId",
                table: "TeamAllowanceIntervalGradingPeriods",
                column: "TeamAllowanceIntervalId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TeamAllowanceIntervalGradingPeriods");

            migrationBuilder.CreateTable(
                name: "TeamAllowanceIntervalSemesters",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TeamAllowanceIntervalId = table.Column<long>(type: "bigint", nullable: false),
                    EndDay = table.Column<int>(type: "integer", nullable: false),
                    EndMonth = table.Column<int>(type: "integer", nullable: false),
                    IsSchoolBreak = table.Column<bool>(type: "boolean", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "bytea", nullable: false),
                    StartDay = table.Column<int>(type: "integer", nullable: false),
                    StartMonth = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeamAllowanceIntervalSemesters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TeamAllowanceIntervalSemesters_TeamAllowanceIntervals_TeamA~",
                        column: x => x.TeamAllowanceIntervalId,
                        principalTable: "TeamAllowanceIntervals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TeamAllowanceIntervalSemesters_TeamAllowanceIntervalId",
                table: "TeamAllowanceIntervalSemesters",
                column: "TeamAllowanceIntervalId");
        }
    }
}
