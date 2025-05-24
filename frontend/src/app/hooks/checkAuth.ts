import { useState, useEffect } from "react";
import axios from "axios";

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const testToken = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/test-token", {
        withCredentials: true,
      });
      return res.data.includes("passed");
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const check = async () => {
      const result = await testToken();
      setIsAuthenticated(result);
    };
    check();
  }, []);

  return { isAuthenticated, refreshAuth: testToken };
};