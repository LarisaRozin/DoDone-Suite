/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using System.Collections.Concurrent;

namespace DoDone.Server.Services;

public enum CircuitBreakerState
{
    Closed,    // Normal operation
    Open,      // Circuit is open, failing fast
    HalfOpen   // Testing if service has recovered
}

public class CircuitBreaker
{
    private readonly int _failureThreshold;
    private readonly TimeSpan _timeout;
    private readonly TimeSpan _retryTimeout;
    private readonly ILogger<CircuitBreaker> _logger;
    
    private int _failureCount;
    private DateTime _lastFailureTime;
    private CircuitBreakerState _state = CircuitBreakerState.Closed;
    private readonly object _lock = new object();

    public CircuitBreaker(int failureThreshold, TimeSpan timeout, TimeSpan retryTimeout, ILogger<CircuitBreaker> logger)
    {
        _failureThreshold = failureThreshold;
        _timeout = timeout;
        _retryTimeout = retryTimeout;
        _logger = logger;
    }

    public async Task<T> ExecuteAsync<T>(Func<Task<T>> operation, string operationName)
    {
        if (GetState() == CircuitBreakerState.Open)
        {
            _logger.LogWarning($"Circuit breaker is OPEN for {operationName}. Failing fast.");
            throw new CircuitBreakerOpenException($"Circuit breaker is open for {operationName}");
        }

        try
        {
            using var cts = new CancellationTokenSource(_timeout);
            var result = await operation();
            OnSuccess();
            return result;
        }
        catch (Exception ex)
        {
            OnFailure(operationName, ex);
            throw;
        }
    }

    private CircuitBreakerState GetState()
    {
        lock (_lock)
        {
            if (_state == CircuitBreakerState.Open)
            {
                if (DateTime.UtcNow - _lastFailureTime >= _retryTimeout)
                {
                    _state = CircuitBreakerState.HalfOpen;
                    _logger.LogInformation("Circuit breaker transitioning to HALF-OPEN state");
                }
            }
            return _state;
        }
    }

    private void OnSuccess()
    {
        lock (_lock)
        {
            if (_state == CircuitBreakerState.HalfOpen)
            {
                _logger.LogInformation("Circuit breaker transitioning to CLOSED state - service recovered");
            }
            _failureCount = 0;
            _state = CircuitBreakerState.Closed;
        }
    }

    private void OnFailure(string operationName, Exception ex)
    {
        lock (_lock)
        {
            _failureCount++;
            _lastFailureTime = DateTime.UtcNow;

            if (_failureCount >= _failureThreshold)
            {
                _state = CircuitBreakerState.Open;
                _logger.LogError(ex, $"Circuit breaker OPENED for {operationName} after {_failureCount} failures");
            }
            else
            {
                _logger.LogWarning(ex, $"Circuit breaker failure {_failureCount}/{_failureThreshold} for {operationName}");
            }
        }
    }
}

public class CircuitBreakerOpenException : Exception
{
    public CircuitBreakerOpenException(string message) : base(message) { }
}

public interface ICircuitBreakerFactory
{
    CircuitBreaker CreateCircuitBreaker(string name);
}

public class CircuitBreakerFactory : ICircuitBreakerFactory
{
    private readonly ConcurrentDictionary<string, CircuitBreaker> _circuitBreakers = new();
    private readonly IServiceProvider _serviceProvider;

    public CircuitBreakerFactory(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public CircuitBreaker CreateCircuitBreaker(string name)
    {
        return _circuitBreakers.GetOrAdd(name, _ =>
        {
            var logger = _serviceProvider.GetRequiredService<ILogger<CircuitBreaker>>();
            // Configure circuit breaker: 5 failures, 30s timeout, 60s retry
            return new CircuitBreaker(5, TimeSpan.FromSeconds(30), TimeSpan.FromSeconds(60), logger);
        });
    }
}