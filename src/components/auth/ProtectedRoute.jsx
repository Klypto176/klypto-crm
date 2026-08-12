import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate } from "react-router-dom";
import { fetchUserProfile } from "../../store/auth/authSlice";
import { hasModuleAccess } from "../../utils/access";

/**
 * ProtectedRoute Component
 * Checks if user is authenticated before allowing access to a page
 * Can also verify specific roles if needed
 *
 * @param {React.Component} Component - The component to render if authenticated
 * @param {Array} requiredRoles - Optional array of roles required to access this route
 * @param {Array} requiredModules - Optional array of dashboard modules required for access
 * @returns {React.Component}
 */
const ProtectedRoute = ({
  Component,
  requiredRoles = [],
  requiredModules = [],
}) => {
  const dispatch = useDispatch();
  const { isAuthenticated, accessToken, loading, user } = useSelector(
    (state) => state.auth,
  );

  // Fetch user profile if authenticated but no profile data yet
  useEffect(() => {
    if (isAuthenticated && accessToken && !user) {
      dispatch(fetchUserProfile());
    }
  }, [isAuthenticated, accessToken, user, dispatch]);

  // Loading state - show loading spinner or message
  if (loading && !user) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
          gap: "20px",
        }}
      >
        <div 
          className="spinner" 
          style={{ 
            width: "40px", 
            height: "40px", 
            border: "3px solid var(--border)", 
            borderTopColor: "var(--primary)" 
          }} 
        />
        <div style={{ textAlign: "center" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "4px" }}>
            Setting up your workspace...
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Preparing your personalized dashboard experience.
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access if required roles specified
  if (requiredRoles.length > 0 && user) {
    const userRoles = user.roles || [];
    const hasRequiredRole = requiredRoles.some((role) =>
      userRoles.includes(role),
    );

    if (!hasRequiredRole) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            backgroundColor: "var(--bg-dark)",
          }}
        >
          <div
            style={{
              textAlign: "center",
              color: "#ef4444",
            }}
          >
            <h1>Access Denied</h1>
            <p>You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }
  }

  if (requiredModules.length > 0 && user) {
    const access = user.access || {};
    const hasRequiredModule = requiredModules.some((moduleKey) =>
      hasModuleAccess(access, moduleKey),
    );

    if (!hasRequiredModule) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            backgroundColor: "var(--bg-dark)",
          }}
        >
          <div
            style={{
              textAlign: "center",
              color: "#ef4444",
            }}
          >
            <h1>Access Denied</h1>
            <p>You don't have permission to access this module.</p>
          </div>
        </div>
      );
    }
  }

  // Render the protected component
  return <Component />;
};

export default ProtectedRoute;
