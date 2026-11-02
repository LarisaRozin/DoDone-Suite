/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
namespace DoDone.Server.Dtos;

public class ResponseBase
{
    public string? Message { get; set; }
    public bool Success { get; set; }
}

public class DataResponse<T> : ResponseBase
{
    public T? Data { get; set; }
}