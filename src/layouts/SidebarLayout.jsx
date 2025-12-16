import React, { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import PrivateRoute from "../components/PrivateRoute";
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X
} from "lucide-react";

export default function SidebarLayout() {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const { logout, userDetails } = useAuth();

  // Check if user needs migration
  React.useEffect(() => {
    if (userDetails && !userDetails.organizationId) {
      navigate('/migration');
    }
  }, [userDetails, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
      console.log("User signed out successfully");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <PrivateRoute>
      <div style={{ display: "flex", minHeight: "100vh", position: "relative", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        {/* Sidebar */}
        <aside
        style={{
          width: isExpanded ? "240px" : "80px",
          height: "100vh",
          background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
          padding: "1.5rem 0",
          display: "flex",
          flexDirection: "column",
          alignItems: isExpanded ? "stretch" : "center",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 1001,
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "4px 0 24px rgba(0, 0, 0, 0.12)",
        }}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Logo Section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: isExpanded ? "flex-start" : "center",
            padding: isExpanded ? "0 1.5rem" : "0",
            marginBottom: "2rem",
            gap: "0.75rem",
          }}
        >
          <Link to="/dashboard" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)",
              }}
            >
              <FileText size={24} color="white" strokeWidth={2.5} />
            </div>
            {isExpanded && (
              <span
                style={{
                  color: "white",
                  fontSize: "1.25rem",
                  fontWeight: "700",
                  marginLeft: "0.75rem",
                  letterSpacing: "-0.02em",
                }}
              >
                WorkOrder
              </span>
            )}
          </Link>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: isExpanded ? "0 1rem" : "0", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <SidebarNavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" isExpanded={isExpanded} />
          <SidebarNavItem to="/orders/new" icon={FileText} label="Ny arbetsorder" isExpanded={isExpanded} />
          <SidebarNavItem to="/customers" icon={Users} label="Kunder" isExpanded={isExpanded} />
          <SidebarNavItem to="/reports" icon={BarChart3} label="Rapporter" isExpanded={isExpanded} />
          <SidebarNavItem to="/settings" icon={Settings} label="Inställningar" isExpanded={isExpanded} />
        </nav>

        {/* Logout Button */}
        <div style={{ padding: isExpanded ? "0 1rem 2rem 1rem" : "0 0 2rem 0", marginTop: "auto" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              backgroundColor: "transparent",
              color: "#ef4444",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              padding: isExpanded ? "0.75rem 1rem" : "0.75rem",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: isExpanded ? "flex-start" : "center",
              gap: "0.75rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontSize: "0.95rem",
              fontWeight: "500",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
              e.currentTarget.style.borderColor = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
            }}
            title="Logga ut"
          >
            <LogOut size={20} strokeWidth={2} />
            {isExpanded && <span>Logga ut</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          marginLeft: "80px",
          minHeight: "100vh",
          backgroundColor: "#f8fafc",
          transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div style={{ padding: "2rem", maxWidth: "1600px", margin: "0 auto" }}>
          <Outlet />
        </div>
      </main>
      </div>
    </PrivateRoute>
  );
}

function SidebarNavItem({ to, icon: Icon, label, isExpanded }) {
  return (
    <NavLink
      to={to}
      title={label}
      style={({ isActive }) => ({
        color: isActive ? "#3b82f6" : "#94a3b8",
        backgroundColor: isActive ? "rgba(59, 130, 246, 0.1)" : "transparent",
        textDecoration: "none",
        padding: isExpanded ? "0.75rem 1rem" : "0.75rem",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: isExpanded ? "flex-start" : "center",
        gap: "0.75rem",
        transition: "all 0.2s ease",
        fontSize: "0.95rem",
        fontWeight: "500",
        position: "relative",
        overflow: "hidden",
      })}
      className="sidebar-nav-item"
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "50%",
                transform: "translateY(-50%)",
                width: "3px",
                height: "60%",
                backgroundColor: "#3b82f6",
                borderRadius: "0 4px 4px 0",
              }}
            />
          )}
          <Icon size={20} strokeWidth={2} style={{ flexShrink: 0 }} />
          {isExpanded && <span>{label}</span>}
        </>
      )}
    </NavLink>
  );
}

// Add hover effects via inline style for nav items
const style = document.createElement("style");
style.textContent = `
  .sidebar-nav-item:hover {
    background-color: rgba(59, 130, 246, 0.08) !important;
    color: #3b82f6 !important;
  }
`;
document.head.appendChild(style);
