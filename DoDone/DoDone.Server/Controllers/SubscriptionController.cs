/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using DoDone.Server.Services;
using DoDone.Server.Dtos;
using DoDone.Shared;

namespace DoDone.Server.Controllers;

[Route("api/[controller]")]
[Authorize]
public class SubscriptionController : ControllerBase
{
    private readonly ISubscriptionService _service;
    private readonly ILogger _logger;

    public SubscriptionController(ISubscriptionService service, ILogger<SubscriptionController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet("limits")]
    public async Task<IActionResult> GetSubscriptionLimits()
    {
        try
        {
            var result = await _service.GetSubscriptionLimits();
            return Ok(result);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Error occurred while fetching subscription limits.");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpPost("validate-action")]
    public async Task<IActionResult> ValidateSubscriptionAction([FromBody] ValidateSubscriptionActionRequest request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest("Invalid request parameters.");
            }

            var result = await _service.ValidateSubscriptionAction(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, $"Error occurred while validating subscription action: {request}");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetSubscriptionStatus()
    {
        try
        {
            var result = await _service.GetSubscriptionStatus();
            return Ok(result);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, "Error occurred while fetching subscription status.");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpPost("verify")]
    public async Task<IActionResult> VerifyPurchase([FromBody] VerifyPurchaseRequest request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest("Invalid request parameters.");
            }

            if (string.IsNullOrEmpty(request.Platform))
            {
                return BadRequest("Platform is required.");
            }

            if (string.IsNullOrEmpty(request.ProductId))
            {
                return BadRequest("ProductId is required.");
            }

            if (request.Platform.ToLower() == Constants.ANDROID_PLATFORM && string.IsNullOrEmpty(request.PurchaseToken))
            {
                return BadRequest("PurchaseToken is required for Android purchases.");
            }

            if (request.Platform.ToLower() == Constants.IOS_PLATFORM && 
                string.IsNullOrEmpty(request.ReceiptData) && 
                string.IsNullOrEmpty(request.SignedTransactionInfo))
            {
                return BadRequest("Either ReceiptData (StoreKit 1) or SignedTransactionInfo (StoreKit 2) is required for iOS purchases.");
            }

            var result = await _service.VerifyPurchase(request);
            
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, "Error occurred while verifying purchase.");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpPost("cancel")]
    public async Task<IActionResult> CancelSubscription([FromBody] CancelSubscriptionRequest request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest("Invalid request parameters.");
            }

            if (string.IsNullOrEmpty(request.Platform))
            {
                return BadRequest("Platform is required.");
            }

            var result = await _service.CancelSubscription(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, "Error occurred while cancelling subscription.");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }

    [HttpGet("receipt")]
    public async Task<IActionResult> GetPurchaseReceipt()
    {
        try
        {
            var result = await _service.GetPurchaseReceipt();
            return Ok(result);
        }
        catch (Exception ex)
        {
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            _logger.LogError(ex, "Error occurred while fetching purchase receipt.");
            return StatusCode(500, $"An error occurred while processing your request. {errorMessage}");
        }
    }
}