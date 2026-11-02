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
public partial class TaskCategoryController : 
    BaseController<TaskCategory, TaskCategoryResponse, TaskCategoryDetailsResponse, TaskCategoryCreateRequest, TaskCategoryUpdateRequest, ITaskCategoryService>
{
    public TaskCategoryController(ITaskCategoryService service, ILogger<TaskCategoryController> logger)
        : base(service, logger)
    { }
}