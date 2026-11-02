/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Db.Models;
using DoDone.Server.Dtos;
using DoDone.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace DoDone.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public partial class TaskKindController : 
    BaseController<TaskKind, TaskKindResponse, TaskKindDetailsResponse, TaskKindCreateRequest, TaskKindUpdateRequest, ITaskKindService>
{
    public TaskKindController(ITaskKindService service, ILogger<TaskKindController> logger)
        : base(service, logger)
    { }
}