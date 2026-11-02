declare @userName nvarchar(256) = 'susanrozin'
declare @userId int = (select Id from AspNetUsers where UserName = @userName)
declare @teamId int = (select TeamId from AspNetUsers where UserName = @userName)
declare @isAdmin bit = (select IsAdmin from AspNetUsers where UserName = @userName)

delete from UserNotificationPreferences where UserId = @userId
delete from UserNotifications where UserId = @userId or AllowanceHistoryId in (select Id from AllowanceHistories where UserId = @userId)
delete from TaskItems where AssignedTo = @userId

if @isAdmin = 1 
begin
print 'is admin'
delete from TaskCategories where KindId in (select Id from TaskKinds where GroupId in (select Id from TaskGroups where TeamId = @teamId or UserId = @userId)) 
delete from TaskKinds where GroupId in (select Id from TaskGroups where TeamId = @teamId or UserId = @userId)
delete from TaskGroups where TeamId = @teamId or UserId = @userId
end
else
begin
print 'not admin'
delete from TaskCategories where KindId in (select Id from TaskKinds where GroupId in (select Id from TaskGroups where CreatedBy = @userId)) 
delete from TaskKinds where GroupId in (select Id from TaskGroups where CreatedBy = @userId)
delete from TaskGroups where CreatedBy = @userId
end

delete from TaskComments where CreatedBy = @userId
delete from UserTaskItemPins where TaskItemId in (select TaskItemId from TaskComments where TaskItemId in (select Id from TaskItems where AssignedTo = @userId or CreatedBy = @userId))

delete from AllowanceHistoryTaskItems where AllowanceHistoryId in (select Id from AllowanceHistories where UserId = @userId) 
delete from AllowanceHistories where UserId = @userId
delete from AspNetUsers where Id = @userId
if @isAdmin = 1 
begin
delete from AllowanceIntervalGradeConfigs where TeamAllowanceIntervalId in (select Id from TeamAllowanceIntervals where TeamId = @teamId)
delete from TeamAllowanceIntervals where TeamId = @teamId
delete from Teams where Id = @teamId
end
