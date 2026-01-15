import React, { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import PrivateRoute from "../components/PrivateRoute";
import { useResponsive } from "../hooks/useResponsive";
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Calendar
} from "lucide-react";

export default function SidebarLayout() {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout, userDetails } = useAuth();
  const { isMobile, isTablet } = useResponsive();

  // Check if user needs migration - TEMPORARILY DISABLED
  // React.useEffect(() => {
  //   if (userDetails && !userDetails.organizationId) {
  //     navigate('/migration');
  //   }
  // }, [userDetails, navigate]);

  const handleLogout = async () => {
    console.log("🔴 Logout button clicked!");
    try {
      console.log("🔴 Calling logout function...");

      // Timeout efter 2 sekunder
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Logout timeout')), 2000)
      );

      try {
        await Promise.race([logout(), timeoutPromise]);
        console.log("✅ Logout successful");
      } catch (e) {
        console.warn("⚠️ Logout timed out or failed, forcing logout anyway:", e);
      }

      console.log("✅ Clearing storage...");
      localStorage.clear();
      sessionStorage.clear();
      console.log("✅ Storage cleared, navigating to home...");
      window.location.href = '/';
    } catch (error) {
      console.error("❌ Error signing out:", error);
      // Logga ut ändå
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  return (
    <PrivateRoute>
      <div style={{ display: "flex", minHeight: "100vh", position: "relative", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              position: "fixed",
              top: "1rem",
              left: "1rem",
              zIndex: 1002,
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
            }}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}

        {/* Overlay for mobile menu */}
        {isMobile && isMobileMenuOpen && (
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              zIndex: 1000,
            }}
          />
        )}

        {/* Sidebar */}
        <aside
        style={{
          width: isMobile ? "280px" : (isExpanded ? "240px" : "80px"),
          height: "100vh",
          background: '#ffffff',
          padding: "1.5rem 0",
          display: "flex",
          flexDirection: "column",
          alignItems: isMobile || isExpanded ? "stretch" : "center",
          position: "fixed",
          top: 0,
          left: isMobile ? (isMobileMenuOpen ? 0 : "-280px") : 0,
          zIndex: 1001,
          transition: isMobile ? "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)" : "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "2px 0 10px rgba(0, 0, 0, 0.1)",
          borderRight: '1px solid #e5e7eb',
          overflowY: "auto"
        }}
        onMouseEnter={() => !isMobile && setIsExpanded(true)}
        onMouseLeave={() => !isMobile && setIsExpanded(false)}
      >
        {/* Logo Section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: (isMobile || isExpanded) ? "flex-start" : "center",
            padding: (isMobile || isExpanded) ? "0 1.5rem" : "0",
            marginBottom: "2rem",
            gap: "0.75rem",
            marginTop: isMobile ? "3rem" : "0"
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
            {(isMobile || isExpanded) && (
              <span
                style={{
                  color: "#1e293b",
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
        <nav style={{ flex: 1, padding: (isMobile || isExpanded) ? "0 1rem" : "0", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <SidebarNavItem
            to="/dashboard"
            icon={LayoutDashboard}
            label="Dashboard"
            isExpanded={isMobile || isExpanded}
            onClick={() => isMobile && setIsMobileMenuOpen(false)}
          />
          <SidebarNavItem
            to="/orders/new"
            icon={FileText}
            label="Ny arbetsorder"
            isExpanded={isMobile || isExpanded}
            onClick={() => isMobile && setIsMobileMenuOpen(false)}
          />
          <SidebarNavItem
            to="/schema"
            icon={Calendar}
            label="Schema"
            isExpanded={isMobile || isExpanded}
            onClick={() => isMobile && setIsMobileMenuOpen(false)}
          />
          <SidebarNavItem
            to="/customers"
            icon={Users}
            label="Kunder"
            isExpanded={isMobile || isExpanded}
            onClick={() => isMobile && setIsMobileMenuOpen(false)}
          />
          <SidebarNavItem
            to="/reports"
            icon={BarChart3}
            label="Rapporter"
            isExpanded={isMobile || isExpanded}
            onClick={() => isMobile && setIsMobileMenuOpen(false)}
          />
          {/* Only show settings for admin users */}
          {userDetails?.role === 'admin' && (
            <SidebarNavItem
              to="/settings"
              icon={Settings}
              label="Inställningar"
              isExpanded={isMobile || isExpanded}
              onClick={() => isMobile && setIsMobileMenuOpen(false)}
            />
          )}
        </nav>

        {/* Logout Button */}
        <div style={{ padding: (isMobile || isExpanded) ? "0 1rem 2rem 1rem" : "0 0 2rem 0", marginTop: "auto" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              backgroundColor: "transparent",
              color: "#1e293b",
              border: "1px solid #e5e7eb",
              padding: (isMobile || isExpanded) ? "0.75rem 1rem" : "0.75rem",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: (isMobile || isExpanded) ? "flex-start" : "center",
              gap: "0.75rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontSize: "0.95rem",
              fontWeight: "500",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f1f5f9";
              e.currentTarget.style.borderColor = "#cbd5e1";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
            title="Logga ut"
          >
            <LogOut size={20} strokeWidth={2} />
            {(isMobile || isExpanded) && <span>Logga ut</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          marginLeft: isMobile ? "0" : "80px",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          overflowX: "hidden",
          width: isMobile ? "100%" : "auto"
        }}
      >
        <div style={{
          padding: isMobile ? "5rem 1rem 1rem 1rem" : "2rem",
          maxWidth: isMobile ? "100%" : "1600px",
          margin: "0 auto",
          boxSizing: "border-box",
          overflowX: "hidden",
          width: "100%"
        }}>
          <Outlet />
        </div>
      </main>
      </div>
    </PrivateRoute>
  );
}

function SidebarNavItem({ to, icon: Icon, label, isExpanded, onClick }) {
  return (
    <NavLink
      to={to}
      title={label}
      onClick={onClick}
      style={({ isActive }) => ({
        color: isActive ? "#3b82f6" : "#1e293b",
        backgroundColor: isActive ? "rgba(59, 130, 246, 0.15)" : "transparent",
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
    background-color: #f1f5f9 !important;
    color: #3b82f6 !important;
  }
`;
document.head.appendChild(style);
