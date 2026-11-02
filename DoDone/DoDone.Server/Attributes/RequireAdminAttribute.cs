/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace DoDone.Server.Attributes;

public class RequireAdminAttribute : AuthorizeAttribute, IAuthorizationRequirement
{
}

public class AdminRequirementHandler : AuthorizationHandler<RequireAdminAttribute>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        RequireAdminAttribute requirement)
    {
        var isAdminClaim = context.User.FindFirst("IsAdmin")?.Value;
        if (bool.TryParse(isAdminClaim, out var isAdmin) && isAdmin)
        {
            context.Succeed(requirement);
        }
        else
        {
            context.Fail();
        }

        return Task.CompletedTask;
    }
}
