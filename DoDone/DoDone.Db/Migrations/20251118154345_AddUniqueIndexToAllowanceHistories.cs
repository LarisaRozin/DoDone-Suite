using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoDone.Db.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueIndexToAllowanceHistories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Check if index exists first, then create if it doesn't
            migrationBuilder.Sql(@"
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_indexes 
                        WHERE tablename = 'AllowanceHistories' 
                        AND indexname = 'IX_AllowanceHistories_TeamId_UserId_AllowanceIntervalType_Allo~'
                    ) THEN
                        CREATE UNIQUE INDEX ""IX_AllowanceHistories_TeamId_UserId_AllowanceIntervalType_Allo~"" 
                        ON ""AllowanceHistories"" (
                            ""TeamId"", 
                            ""UserId"", 
                            ""AllowanceIntervalType"", 
                            ""AllowanceIntervalValue"", 
                            ""StartDayOfWeek"", 
                            ""CalculatedStartAt"", 
                            ""CalculatedEndAt"", 
                            ""ApprovedAt""
                        );
                        RAISE NOTICE 'Created unique index IX_AllowanceHistories_TeamId_UserId_AllowanceIntervalType_Allo~';
                    ELSE
                        RAISE NOTICE 'Unique index IX_AllowanceHistories_TeamId_UserId_AllowanceIntervalType_Allo~ already exists';
                    END IF;
                END $$;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    DROP INDEX IF EXISTS ""IX_AllowanceHistories_TeamId_UserId_AllowanceIntervalType_Allo~"";
                    RAISE NOTICE 'Dropped unique index IX_AllowanceHistories_TeamId_UserId_AllowanceIntervalType_Allo~';
                END $$;
            ");
        }
    }
}
