/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using DoDone.Server.Dtos;
using DoDone.Server.Services;
using DoDone.Server.Services.Common;
using DoDone.Server.Dtos.Common;
using DoDone.Server.Attributes;
using DoDone.Server.Extensions;
using Org.BouncyCastle.Asn1.Cms;

namespace DoDone.Server.Controllers;

[Route("api/[controller]")]
[Authorize]
public class TaskItemController : ControllerBase
{

    protected readonly ITaskItemService _service;
    protected readonly ILogger _logger;
    protected readonly IConnectionPoolMonitorService _connectionMonitor;
    
    public TaskItemController(ITaskItemService service, ILogger<TaskItemController> logger, IConnectionPoolMonitorService connectionMonitor)
    // : base(service, logger)
    {
        _service = service;
        _logger = logger;
        _connectionMonitor = connectionMonitor;
    }

    [HttpGet("test")]
    [AllowAnonymous]  // This bypasses authentication
    public IActionResult Test()
    {
        try
        {
            return Ok(new { 
                Message = "TaskItem controller is working", 
                Controller = "TaskItem",
                Timestamp = DateTime.UtcNow,
                HasService = _service != null,
                HasLogger = _logger != null,
                HasConnectionMonitor = _connectionMonitor != null
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { 
                Error = ex.Message, 
                StackTrace = ex.StackTrace?.Split('\n').Take(10).ToArray()
            });
        }
    }

    [HttpPost("copy/{id}")]
    public async Task<IActionResult> Copy(long id)
    {
        try
        {
            var copiedItem = await _service.CopyAsync(id);
            _logger.LogInformation($"TaskItem {id} copied.");
            return Ok(new { Success = true, Message = "TaskItem copied successfully", Data = copiedItem });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while copying TaskItem {id}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during TaskItem copy for TaskItem {id}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpPost("pin/{id}/{pinning:bool?}")]
    public async Task<IActionResult> Pin(long id, bool pinning = true)
    {
        try
        {
            await _service.PinAsync(id, pinning);
            _logger.LogInformation($"TaskItem {id} pinned.");
            return Ok(new { Success = true, Message = "TaskItem pinned successfully" });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while pinning TaskItem {id}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during TaskItem pinning for TaskItem {id}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpPost("set-complete/{id}/{completing:bool?}")]
    public async Task<IActionResult> SetComplete(long id, bool completing = true)
    {
        try
        {
            await _service.SetCompleteAsync(id, completing);
            _logger.LogInformation($"TaskItem {id} marked as {(completing ? "complete" : "incomplete")}.");
            return Ok(new { Success = true, Message = $"TaskItem {(completing ? "completed" : "marked as incomplete")} successfully" });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while setting TaskItem {id} completion status");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during TaskItem completion for TaskItem {id}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpPost("set-active/{id}/{activating:bool?}")]
    public async Task<IActionResult> SetActive(long id, bool activating = true)
    {
        try
        {
            await _service.SetActiveAsync(id, activating);
            _logger.LogInformation($"TaskItem {id} marked as {(activating ? "active" : "inactive")}.");
            return Ok(new { Success = true, Message = $"TaskItem {(activating ? "activated" : "deactivated")} successfully" });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while setting TaskItem {id} active status");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during TaskItem activation for TaskItem {id}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(long id)
    {
        try
        {
            await _service.DeleteAsync(id);
            _logger.LogInformation($"TaskItem {id} deleted.");
            return Ok(new { Success = true, Message = "TaskItem deleted successfully" });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while deleting TaskItem {id}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during TaskItem deletion for TaskItem {id}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpPost("archive/{id}/{archiving:bool?}")]
    public async Task<IActionResult> Archive(long id, bool archiving = true)
    {
        try
        {
            await _service.ArchiveAsync(id, archiving);
            _logger.LogInformation($"TaskItem {id} archived.");
            return Ok(new { Success = true, Message = "TaskItem archived successfully" });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while archiving TaskItem {id}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during TaskItem archiving for TaskItem {id}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpPost("archive-list/{archiving:bool?}")]
    public async Task<IActionResult> ArchiveList([FromBody] List<long> taskItemIds, bool archiving = true)
    {
        try
        {
            await _service.ArchiveAsync(taskItemIds, archiving);
            _logger.LogInformation($"TaskItems {string.Join(", ", taskItemIds)} {(archiving ? "archived" : "unarchived")}.");
            return Ok(new { Success = true, Message = "TaskItems archived successfully" });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while archiving TaskItems {string.Join(", ", taskItemIds)}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during TaskItem completion for TaskItems {string.Join(", ", taskItemIds)} ");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpPost("pin-list/{pinning:bool?}")]
    public async Task<IActionResult> PinList([FromBody] List<long> taskItemIds, bool pinning = true)
    {
        try
        {
            await _service.PinAsync(taskItemIds, pinning);
            _logger.LogInformation($"TaskItems {string.Join(", ", taskItemIds)} pinned.");
            return Ok(new { Success = true, Message = "TaskItems pinned successfully" });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while pinning TaskItems {string.Join(", ", taskItemIds)}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during TaskItem completion for TaskItems {string.Join(", ", taskItemIds)} ");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpPost("set-complete-list/{completing:bool?}")]
    public async Task<IActionResult> SetCompleteList([FromBody] List<long> taskItemIds, bool completing = true)
    {
        try
        {
            await _service.SetCompleteAsync(taskItemIds, completing);
            _logger.LogInformation($"TaskItems {string.Join(", ", taskItemIds)} marked as {(completing ? "complete" : "incomplete")}.");
            return Ok(new { Success = true, Message = $"TaskItems {(completing ? "completed" : "incompleted")} successfully" });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while setting TaskItems {string.Join(", ", taskItemIds)} complete status");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during TaskItems completion for TaskItems {string.Join(", ", taskItemIds)} ");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpPost("set-active-list/{activating:bool?}")]
    public async Task<IActionResult> SetActiveList([FromBody] List<long> taskItemIds, bool activating = true)
    {
        try
        {
            await _service.SetActiveAsync(taskItemIds, activating);
            _logger.LogInformation($"TaskItems {string.Join(", ", taskItemIds)} marked as {(activating ? "active" : "inactive")}.");
            return Ok(new { Success = true, Message = $"TaskItems {(activating ? "activated" : "deactivated")} successfully" });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while setting TaskItems {string.Join(", ", taskItemIds)} active status");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during TaskItems activation for TaskItems {string.Join(", ", taskItemIds)} ");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpPost("copy-list")]
    public virtual async Task<IActionResult> CopyList([FromBody] List<long> taskItemIds)
    {
        try
        {
            await _service.CopyAsync(taskItemIds);
            _logger.LogInformation($"TaskItems {string.Join(", ", taskItemIds)} copied.");
            return Ok(new { Success = true, Message = "TaskItems copied successfully" });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while copying TaskItems {string.Join(", ", taskItemIds)}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during TaskItems copy for TaskItems {string.Join(", ", taskItemIds)}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpPost("delete-list")]
    public virtual async Task<IActionResult> DeleteList([FromBody] List<long> taskItemIds)
    {
        try
        {
            await _service.DeleteAsync(taskItemIds);
            _logger.LogInformation($"TaskItems {string.Join(", ", taskItemIds)} deleted.");
            return Ok(new { Success = true, Message = "TaskItems deleted successfully" });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while deleting TaskItems {string.Join(", ", taskItemIds)}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during TaskItems deletion for TaskItems {string.Join(", ", taskItemIds)}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpPost]
    public virtual async Task<IActionResult> Create([FromBody] TaskItemCreateRequest request)
    {
        try
        {
            var result = await _service.CreateAsync(request);
            _logger.LogInformation($"TaskItem {request.Name} created.");
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while creating TaskItem {request.Name}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during TaskItem creation for {request.Name}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpPut]
    public virtual async Task<IActionResult> Update([FromBody] TaskItemUpdateRequest request)
    {
        // _logger.LogInformation("=== UPDATE API CALLED === Request ID: {RequestId}", request?.Id ?? 0);
        
        if (request == null)
        {
            _logger.LogInformation("=== UPDATE API ERROR === Request is null");
            return BadRequest("Request cannot be null");
        }
        
        try
        {
            var result = await _service.UpdateAsync(request);
            // _logger.LogInformation("SUCCESS: TaskItem {Id} updated at {Time}", request.Id, DateTime.Now);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogError(ex, "VALIDATION ERROR: TaskItem {Id} validation failed at {Time}", request.Id, DateTime.Now);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, "EXCEPTION: TaskItem {Id} update failed at {Time} - {ErrorMessage}", request.Id, DateTime.Now, errorMessage);
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpGet("{id}")]
    public virtual async Task<IActionResult> Get(long id)
    {
        try
        {
            var result = await _service.GetAsync(id);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while getting TaskItem with ID {id}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during TaskItem retrieval for ID {id}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpGet("details/{id}")]
    public virtual async Task<IActionResult> GetDetails(long id)
    {
        try
        {
            var result = await _service.GetTaskItemEntityDetailsAsync(id);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while getting TaskItem details with ID {id}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during TaskItem details retrieval for ID {id}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }


    [HttpPost("paged-list")]
    public virtual async Task<IActionResult> GetList([FromBody] PagedTaskItemListRequest request)
    {
        try
        {
            var result = await _service.GetPagedListAsync(request);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while getting TaskItem list with request {request}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during TaskItem list retrieval with request {request}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpPost("paged-list-details")]
    public virtual async Task<IActionResult> GetListDetails([FromBody] PagedTaskItemListRequest request)
    {
        var startTime = DateTime.UtcNow;
        try
        {
            // Monitor connection pool before expensive operation
            // _ = Task.Run(async () => await _connectionMonitor.LogConnectionPoolStatsAsync());
            
            var result = await _service.GetPagedListDetailsAsync(request);
            
            var duration = DateTime.UtcNow - startTime;
            // if (duration.TotalMilliseconds > 3000) // Log if > 1 second
            // {
            //     var userId = User.GetUserId();
            //     _logger.LogInformation("Slow paged-list-details request completed in {Duration}ms ({DurationSeconds}s) for user {UserId}", duration.TotalMilliseconds, duration.TotalSeconds, userId);
            // }
            
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while getting TaskItem list details with request {request}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var duration = DateTime.UtcNow - startTime;
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during TaskItem list details retrieval after {duration.TotalMilliseconds}ms with request {request}");
            
            // Monitor connection pool after error
            // _ = Task.Run(async () => await _connectionMonitor.LogConnectionPoolStatsAsync());
            
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpPost("approve-bonus")]
    [RequireAdmin]
    public async Task<IActionResult> ApproveBonus([FromBody] BonusApprovalRequest request)
    {
        try
        {
            await _service.ApproveBonus(request);
            _logger.LogInformation($"Bonus for TaskItem {request.TaskItemId} approved: {request.IsApproved}.");
            return Ok(new { Success = true, Message = "Bonus approval processed successfully" });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while approving bonus for TaskItem {request.TaskItemId}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during bonus approval for TaskItem {request.TaskItemId}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }



    [HttpPost("claim-bonus/{taskItemId}")]
    public async Task<IActionResult> ClaimBonus(long taskItemId)
    {
        try
        {
            await _service.ClaimBonusAsync(taskItemId);
            _logger.LogInformation($"Bonus for TaskItem {taskItemId} claimed.");
            return Ok(new { Success = true, Message = "Bonus claimed successfully" });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while claiming bonus for TaskItem {taskItemId}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during bonus claim for TaskItem {taskItemId}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpPost("approve-allowance")]
    [RequireAdmin]
    public async Task<IActionResult> ApproveAllowance([FromBody] TaskItemAllowanceApprovalRequest request)
    {
        try
        {
            await _service.ApproveTaskItemAllowance(request);
            _logger.LogInformation($"Allowance for TaskItem {request.TaskItemId} approved: {request.IsApproved}.");
            return Ok(new { Success = true, Message = "Allowance approval processed successfully" });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while approving allowance for TaskItem {request.TaskItemId}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during allowance approval for TaskItem {request.TaskItemId}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpPost("update-task-details")]
    public async Task<IActionResult> UpdateTaskDetails([FromBody] TaskItemTaskDetailsUpdateRequest request)
    {
        try
        {
            await _service.UpdateTaskItemTaskDetailsAsync(request);
            _logger.LogInformation($"Task details for TaskItem {request.Id} updated.");
            return Ok(new { Success = true, Message = "Task details updated successfully" });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while updating task details for TaskItem {request.Id}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during task details update for TaskItem {request.Id}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }
    [HttpGet("get-task-details/{id}")]
    public async Task<IActionResult> GetTaskDetails(long id)
    {
        try
        {
            var result = await _service.GetTaskDetailsAsync(id);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error while getting task details for TaskItem {id}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Exception during task details retrieval for TaskItem {id}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }
}
