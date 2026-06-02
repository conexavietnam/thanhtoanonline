import { Navigate, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext.jsx";

const hasRequiredRole = (userRoles, userRole, requiredRoles = []) => {
  if (!requiredRoles || requiredRoles.length === 0) return true;

  // Check string role
  if (userRole && requiredRoles.includes(userRole)) return true;

  // Check array roles
  if (Array.isArray(userRoles)) {
    return requiredRoles.some((role) => userRoles.includes(role));
  }

  return false;
};

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, initializing, user } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="flex h-full min-h-[60vh] w-full items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" aria-label="Đang tải" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!hasRequiredRole(user?.roles, user?.role, roles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};


export default ProtectedRoute;

