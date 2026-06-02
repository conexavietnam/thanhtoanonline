import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api, { clearAuthTokens, registerRefreshHandler, registerTokenExpiredHandler, setAuthTokens, refreshApi } from "../lib/api.js";

const AuthContext = createContext(undefined);

const STORAGE_KEY = "disc_auth_session";

// Ensure user always has a roles array and keep backward compatibility with single-role payloads
const normalizeUser = (user) => {
  if (!user) return null;

  const normalizedRoles = Array.from(new Set(
    [
      ...(Array.isArray(user.roles) ? user.roles : []),
      ...(user.role ? [user.role] : []),
    ]
      .filter(Boolean)
      .map((role) => role.toUpperCase())
  ));

  // Backend currently returns only ADMIN for admin accounts; map it to SUPER_ADMIN for UI gates
  if (normalizedRoles.includes("ADMIN") && !normalizedRoles.includes("SUPER_ADMIN")) {
    normalizedRoles.push("SUPER_ADMIN");
  }

  return {
    ...user,
    role: user.role ?? normalizedRoles[0] ?? null,
    roles: normalizedRoles,
  };
};

const readStoredSession = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn("Failed to parse auth session", error);
    return null;
  }
};

const writeStoredSession = (session) => {
  if (!session) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

// Helper function để decode JWT và kiểm tra expiration
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    // Kiểm tra nếu token hết hạn trong vòng 5 phút tới (để refresh sớm)
    return now >= (exp - 5 * 60 * 1000);
  } catch (error) {
    // Nếu không decode được, coi như token không hợp lệ
    return true;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const persistSession = useCallback((session) => {
    if (!session) {
      writeStoredSession(null);
      clearAuthTokens();
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      return;
    }

    const normalizedUser = normalizeUser(session.user);
    setAuthTokens(session.accessToken, session.refreshToken);
    setUser(normalizedUser);
    setAccessToken(session.accessToken);
    setRefreshToken(session.refreshToken);
    writeStoredSession({ ...session, user: normalizedUser });
  }, []);

  const refreshSession = useCallback(
    async (currentRefreshToken) => {
      const tokenToUse = currentRefreshToken ?? refreshToken;
      if (!tokenToUse) {
        persistSession(null);
        return null;
      }

      // Kiểm tra refresh token có còn hợp lệ không
      if (isTokenExpired(tokenToUse)) {
        console.log("Refresh token expired");
        persistSession(null);
        return null;
      }

      try {
        // Gọi API refresh bằng refreshApi (không có interceptor thêm Authorization header)
      const { data } = await refreshApi.post("/auth/refresh", { refreshToken: tokenToUse });
        if (!data?.accessToken) {
          persistSession(null);
          return null;
        }

        const session = {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken ?? tokenToUse,
          user: normalizeUser(data.user),
        };
        persistSession(session);
        return session;
      } catch (error) {
        // Refresh token hết hạn hoặc không hợp lệ
        console.error("Failed to refresh token:", error);
        persistSession(null);
        return null;
      }
    },
    [persistSession, refreshToken]
  );

  const loadProfile = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      const normalized = normalizeUser(data);
      setUser(normalized);
      const stored = readStoredSession();
      if (stored) {
        writeStoredSession({ ...stored, user: normalized });
      }
    } catch (error) {
      console.warn("Failed to refresh profile", error);
    }
  }, []);

  // Handler khi token hết hạn hoàn toàn
  const handleTokenExpired = useCallback(() => {
    persistSession(null);
    // Redirect về login nếu không phải trang public
    const publicPaths = ["/", "/login", "/register", "/plans"];
    const currentPath = window.location.pathname;
    const isPublicPath = publicPaths.some(path =>
      currentPath === path || currentPath.startsWith(path + "/")
    );

    if (!isPublicPath) {
      // Redirect về login và lưu path hiện tại để quay lại sau khi đăng nhập
      const returnUrl = encodeURIComponent(currentPath);
      window.location.href = `/login?from=${returnUrl}`;
    }
  }, [persistSession]);

  useEffect(() => {
    registerRefreshHandler(async (token) => {
      const session = await refreshSession(token);
      return session ? { accessToken: session.accessToken, refreshToken: session.refreshToken } : null;
    });

    // Đăng ký handler khi token hết hạn hoàn toàn
    registerTokenExpiredHandler(handleTokenExpired);

    // Cleanup: unregister handlers khi unmount
    return () => {
      registerTokenExpiredHandler(null);
    };
  }, [refreshSession, handleTokenExpired]);

  useEffect(() => {
    const bootstrap = async () => {
      const stored = readStoredSession();
      if (stored?.accessToken && stored?.refreshToken) {
        // Kiểm tra xem access token còn hợp lệ không
        const accessTokenExpired = isTokenExpired(stored.accessToken);

        if (accessTokenExpired) {
          // Access token đã hết hạn, thử refresh
          console.log("Access token expired, attempting to refresh...");
          const refreshedSession = await refreshSession(stored.refreshToken);

          if (refreshedSession) {
            // Refresh thành công, đã tự động đăng nhập lại
            // refreshSession đã tự động persist session và set state
            console.log("Token refreshed successfully, user auto-logged in");
          } else {
            // Refresh thất bại, token đã hết hạn hoàn toàn
            // refreshSession đã tự động clear session
            console.log("Refresh token expired, user needs to login again");
          }
        } else {
          // Access token còn hợp lệ, set vào state
          setAuthTokens(stored.accessToken, stored.refreshToken);
          setAccessToken(stored.accessToken);
          setRefreshToken(stored.refreshToken);
          setUser(normalizeUser(stored.user ?? null));

          // If the stored session is missing profile details, refresh from the API.
          if (!stored.user || !stored.user.fullName) {
            try {
              await loadProfile();
            } catch (error) {
              // Nếu load profile fail, có thể token đã hết hạn trong lúc check
              // Thử refresh lại
              if (error.response?.status === 401) {
                const refreshedSession = await refreshSession(stored.refreshToken);
                if (!refreshedSession) {
                  // Refresh thất bại, clear session
                  persistSession(null);
                }
              }
            }
          }
        }
      }
      setInitializing(false);
    };

    bootstrap();
  }, [loadProfile, refreshSession, persistSession]);

  // Tự động refresh token định kỳ (kiểm tra mỗi 5 phút)
  useEffect(() => {
    if (!refreshToken) return;

    const interval = setInterval(async () => {
      const stored = readStoredSession();
      if (!stored?.accessToken || !stored?.refreshToken) return;

      // Kiểm tra xem access token có sắp hết hạn không (trong vòng 10 phút)
      const accessTokenExpired = isTokenExpired(stored.accessToken);

      if (accessTokenExpired) {
        console.log("Auto-refreshing token before expiration...");
        await refreshSession(stored.refreshToken);
      }
    }, 5 * 60 * 1000); // Kiểm tra mỗi 5 phút

    return () => clearInterval(interval);
  }, [refreshToken, refreshSession]);

  const persistPendingDiscTestResult = useCallback(async () => {
    try {
      const pendingTestResult = localStorage.getItem("disc_pending_test_result");
      if (!pendingTestResult) return;

      const testData = JSON.parse(pendingTestResult);
      const testTimestamp = new Date(testData.timestamp);
      const now = new Date();
      const hoursDiff = (now - testTimestamp) / (1000 * 60 * 60);

      if (hoursDiff >= 24 || !Array.isArray(testData.answers) || testData.answers.length === 0) {
        localStorage.removeItem("disc_pending_test_result");
        return;
      }

      try {
        await api.post("/disc/tests", {
          answers: testData.answers,
          testMode: testData.testMode,
          testTakerName: testData.testTakerName,
        });
        localStorage.removeItem("disc_pending_test_result");
      } catch (testError) {
        console.warn("Failed to save pending test result after authentication:", testError);
      }
    } catch (error) {
      console.warn("Failed to process pending test result:", error);
    }
  }, []);

  const login = useCallback(
    async (payload) => {
      const { data } = await api.post("/auth/login", payload);
      const session = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: normalizeUser(data.user),
      };
      persistSession(session);
      await persistPendingDiscTestResult();
      return session.user;
    },
    [persistPendingDiscTestResult, persistSession]
  );

  const register = useCallback(
    async (payload) => {
      const { data } = await api.post("/auth/register", payload);
      return data;
    },
    []
  );

  const googleLogin = useCallback(
    async ({ idToken, code, redirectUri, referralCode }) => {
      const payload = {
        ...(idToken ? { idToken } : {}),
        ...(code ? { code } : {}),
        ...(redirectUri ? { redirectUri } : {}),
        ...(referralCode ? { referralCode } : {}),
      };

      const { data } = await api.post("/auth/google", payload);
      const session = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: normalizeUser(data.user),
      };
      persistSession(session);
      await persistPendingDiscTestResult();
      return session.user;
    },
    [persistPendingDiscTestResult, persistSession]
  );

  const logout = useCallback(() => {
    persistSession(null);
    // Redirect về trang login nếu đang ở trang yêu cầu auth
    if (window.location.pathname.startsWith("/dashboard") ||
      window.location.pathname.startsWith("/admin")) {
      window.location.href = "/login";
    }
  }, [persistSession]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      refreshToken,
      initializing,
      login,
      register,
      googleLogin, // Added googleLogin here
      logout,
      refreshSession,
      loadProfile,
      isAuthenticated: Boolean(accessToken && user),
    }),
    [user, accessToken, refreshToken, initializing, login, register, googleLogin, logout, refreshSession, loadProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
