/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
namespace DoDone.Server.Helpers;

public static class ConfigurationHelper
{
    public static T GetSectionOrDefault<T>(this IConfiguration configuration, string sectionName) where T : new()
    {
        var section = configuration.GetSection(sectionName);
        if (section.Exists())
        {
            return section.Get<T>()!;
        }
        return new T();
    }

    public static int GetIntValueOrDefault(this IConfiguration configuration, string key, int defaultValue)
    {
        var value = configuration[key];
        if (int.TryParse(value, out int result))
        {
            return result;
        }
        return defaultValue;
    }

    public static bool GetBoolValueOrDefault(this IConfiguration configuration, string key, bool defaultValue)
    {
        var value = configuration[key];
        if (bool.TryParse(value, out bool result))
        {
            return result;
        }
        return defaultValue;
    }

    public static string GetStringValueOrDefault(this IConfiguration configuration, string key, string defaultValue)
    {
        var value = configuration[key];
        return string.IsNullOrEmpty(value) ? defaultValue : value;
    }

    public static DateTimeOffset GetDateTimeOffsetValueOrDefault(this IConfiguration configuration, string key, DateTimeOffset defaultValue)
    {
        var value = configuration[key];
        if (DateTimeOffset.TryParse(value, out DateTimeOffset result))
        {
            return result;
        }
        return defaultValue;
    }
}
