/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using DoDone.Server.Dtos;
using DoDone.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoDone.Server.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public partial class TaskGroupController : 
    BaseController<TaskGroup, TaskGroupResponse, TaskGroupDetailsResponse, TaskGroupCreateRequest, TaskGroupUpdateRequest, ITaskGroupService>
{
    public TaskGroupController(ITaskGroupService service, ILogger<TaskGroupController> logger)
        : base(service, logger)
    { }
}