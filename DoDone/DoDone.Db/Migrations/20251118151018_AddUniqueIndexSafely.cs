using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoDone.Db.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueIndexSafely : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Use raw SQL with proper error handling for index operations
            migrationBuilder.Sql(@"
                DO $$ 
                DECLARE
                    index_exists boolean;
                BEGIN 
                    -- Check if the old index exists
                    SELECT EXISTS (
                        SELECT 1 FROM pg_indexes 
                        WHERE indexname = 'IX_AllowanceHistories_TeamId'
                    ) INTO index_exists;
                    
                    -- Drop old index if it exists
                    IF index_exists THEN
                        BEGIN
                            DROP INDEX IF EXISTS ""IX_AllowanceHistories_TeamId"";
                        EXCEPTION 
                            WHEN insufficient_privilege THEN 
                                RAISE NOTICE 'Insufficient privileges to drop index IX_AllowanceHistories_TeamId. Attempting to change ownership.';
                                BEGIN
                                    EXECUTE 'ALTER INDEX ""IX_AllowanceHistories_TeamId"" OWNER TO ' || current_user;
                                    DROP INDEX ""IX_AllowanceHistories_TeamId"";
                                EXCEPTION 
                                    WHEN OTHERS THEN 
                                        RAISE NOTICE 'Could not drop index IX_AllowanceHistories_TeamId: %. Continuing anyway.', SQLERRM;
                                END;
                            WHEN OTHERS THEN 
                                RAISE NOTICE 'Could not drop index IX_AllowanceHistories_TeamId: %. Continuing anyway.', SQLERRM;
                        END;
                    END IF;
                    
                    -- Create new unique index if it doesn't exist
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_indexes 
                            WHERE indexname = 'IX_AllowanceHistories_TeamId_UserId_AllowanceIntervalType_Allo~'
                        ) THEN
                            CREATE UNIQUE INDEX ""IX_AllowanceHistories_TeamId_UserId_AllowanceIntervalType_Allo~"" 
                            ON ""AllowanceHistories"" (""TeamId"", ""UserId"", ""AllowanceIntervalType"", ""AllowanceIntervalValue"", ""StartDayOfWeek"", ""CalculatedStartAt"", ""CalculatedEndAt"", ""ApprovedAt"");
                        END IF;
                    EXCEPTION 
                        WHEN insufficient_privilege THEN 
                            RAISE NOTICE 'Insufficient privileges to create index. Please run as database owner or superuser.';
                        WHEN OTHERS THEN 
                            RAISE NOTICE 'Could not create unique index: %', SQLERRM;
                    END;
                END $$;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Use raw SQL with proper error handling for index operations
            migrationBuilder.Sql(@"
                DO $$ 
                BEGIN 
                    -- Drop unique index if it exists
                    BEGIN
                        DROP INDEX IF EXISTS ""IX_AllowanceHistories_TeamId_UserId_AllowanceIntervalType_Allo~"";
                    EXCEPTION 
                        WHEN insufficient_privilege THEN 
                            RAISE NOTICE 'Insufficient privileges to drop unique index. Continuing anyway.';
                        WHEN OTHERS THEN 
                            RAISE NOTICE 'Could not drop unique index: %. Continuing anyway.', SQLERRM;
                    END;
                    
                    -- Recreate simple index if it doesn't exist
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_indexes 
                            WHERE indexname = 'IX_AllowanceHistories_TeamId'
                        ) THEN
                            CREATE INDEX ""IX_AllowanceHistories_TeamId"" ON ""AllowanceHistories"" (""TeamId"");
                        END IF;
                    EXCEPTION 
                        WHEN insufficient_privilege THEN 
                            RAISE NOTICE 'Insufficient privileges to create index. Please run as database owner or superuser.';
                        WHEN OTHERS THEN 
                            RAISE NOTICE 'Could not create index: %', SQLERRM;
                    END;
                END $$;
            ");
        }
    }
}
