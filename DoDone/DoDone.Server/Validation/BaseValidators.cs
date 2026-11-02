/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Shared.Abstractions;

namespace DoDone.Server.Validation;

/// <summary>
/// Interface for request validation
/// </summary>
public interface IValidator<T>
{
    Task<ValidationResult> ValidateAsync(T request);
}

/// <summary>
/// Validation result containing errors if any
/// </summary>
public class ValidationResult
{
    public bool IsValid => !Errors.Any();
    public List<string> Errors { get; set; } = new();

    public static ValidationResult Success() => new();
    
    public static ValidationResult Failure(params string[] errors) => new() { Errors = errors.ToList() };
    
    public static ValidationResult Failure(IEnumerable<string> errors) => new() { Errors = errors.ToList() };
}

/// <summary>
/// Base validator for create requests
/// </summary>
public abstract class BaseCreateRequestValidator<T> : IValidator<T> where T : ICreateRequestDto
{
    public virtual async Task<ValidationResult> ValidateAsync(T request)
    {
        var errors = new List<string>();

        if (request == null)
        {
            errors.Add("Request cannot be null");
            return ValidationResult.Failure(errors);
        }

        if (string.IsNullOrWhiteSpace(request.Name))
            errors.Add("Name is required");
        else if (request.Name.Length > 100)
            errors.Add("Name must be less than 100 characters");

        if (request.Description?.Length > 500)
            errors.Add("Description must be less than 500 characters");

        var customValidationErrors = await ValidateCustomRules(request);
        errors.AddRange(customValidationErrors);

        return errors.Any() ? ValidationResult.Failure(errors) : ValidationResult.Success();
    }

    protected virtual async Task<IEnumerable<string>> ValidateCustomRules(T request)
    {
        return await Task.FromResult(Enumerable.Empty<string>());
    }
}

/// <summary>
/// Base validator for update requests
/// </summary>
public abstract class BaseUpdateRequestValidator<T> : IValidator<T> where T : IUpdateRequestDto
{
    public virtual async Task<ValidationResult> ValidateAsync(T request)
    {
        var errors = new List<string>();

        if (request == null)
        {
            errors.Add("Request cannot be null");
            return ValidationResult.Failure(errors);
        }

        if (request.Id <= 0)
            errors.Add("Invalid ID");

        if (string.IsNullOrWhiteSpace(request.Name))
            errors.Add("Name is required");
        else if (request.Name.Length > 100)
            errors.Add("Name must be less than 100 characters");

        if (request.Description?.Length > 500)
            errors.Add("Description must be less than 500 characters");

        var customValidationErrors = await ValidateCustomRules(request);
        errors.AddRange(customValidationErrors);

        return errors.Any() ? ValidationResult.Failure(errors) : ValidationResult.Success();
    }

    protected virtual async Task<IEnumerable<string>> ValidateCustomRules(T request)
    {
        return await Task.FromResult(Enumerable.Empty<string>());
    }
}
