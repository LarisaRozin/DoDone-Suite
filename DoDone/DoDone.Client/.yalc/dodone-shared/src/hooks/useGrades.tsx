/*
 * Copyright (c) 2025 LarisaRozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */

import { useState, useCallback, useEffect } from "react";
import type { GradeResponse } from "../types/TaskItem";
import { API_ROUTES } from "../api/routes";
import { useAuth } from "./auth/useAuth";
import { useConfig } from "../config/useConfig";
import { createApiClient } from "../utils/ApiClient";

export function useGrades() {
  const { token } = useAuth();
  const { baseUrl } = useConfig();
  const [grades, setGrades] = useState<GradeResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGrades = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const apiClient = createApiClient(baseUrl, token);
      const data = await apiClient.get<GradeResponse[]>(
        API_ROUTES.grades.getList(),
      );
      setGrades(data);
    } catch (error) {
      console.error("Error fetching grades:", error);
    } finally {
      setLoading(false);
    }
  }, [token, baseUrl]);

  useEffect(() => {
      fetchGrades();
  }, [fetchGrades]);


  return { grades, loading };
}