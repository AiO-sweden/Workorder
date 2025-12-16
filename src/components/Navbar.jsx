import React from "react";
import { NavLink } from "react-router-dom"; // Use NavLink for active styling if needed

const topNavbarStyle = {
  backgroundColor: "#1A73E8", // Light blue from image
  padding: "0 1rem", // Horizontal padding
  height: "60px", // Match container height in SidebarLayout
  display: "flex",
  alignItems: "center", // Vertically center items
  color: "white",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)", // Subtle shadow
};

const navLinkStyle = {
  color: "white",
  textDecoration: "none",
  padding: "0 12px", // Padding for each link
  margin: "0 4px", // Margin between links
  height: "100%",
  display: "flex",
  alignItems: "center",
  fontSize: "0.9rem", // Slightly smaller font
  fontWeight: "500",
  borderBottom: "2px solid transparent", // For active state indication
  transition: "border-bottom-color 0.2s ease-in-out, background-color 0.2s ease-in-out",
};

const activeNavLinkStyle = {
  ...navLinkStyle,
  // Example active style: a slightly darker background or a border
  // For now, let's use a subtle background change or keep it simple
  // backgroundColor: "rgba(255,255,255,0.1)", // Subtle highlight
  borderBottomColor: "#FFFFFF", // White underline for active tab
};

// Placeholder for gear icon, replace with actual icon component if available
const GearIcon = () => <span style={{ marginLeft: "5px" }}>⚙️</span>;

export default function TopNavbar() {
  // Define links based on the image.
  // For now, most will point to /settings or a placeholder
  // We'll need to define actual routes for these in App.js later
  const links = [
    { to: "/settings/users", label: "Användare" }, // Assuming sub-route
    { to: "/customers", label: "Kunder" }, // Existing route
    { to: "/settings/contacts", label: "Kontakter" },
    { to: "/settings/timecodes", label: "Tidkoder" },
    { to: "/settings/travelcodes", label: "Reskoder" },
    { to: "/settings/suppliers", label: "Grossister" },
    { to: "/settings/own-material", label: "Eget material" },
    { to: "/settings/favorite-lists", label: "Favoritlistor" },
    { to: "/settings/subscription", label: "Mitt abonnemang" },
    { to: "/settings/organization", label: "Organisationsinställningar", icon: <GearIcon /> },
  ];

  return (
    <nav style={topNavbarStyle}>
      {links.map((link) => (
        <NavLink
          key={link.label}
          to={link.to}
          style={({ isActive }) =>
            isActive ? activeNavLinkStyle : navLinkStyle
          }
        >
          {link.label}
          {link.icon}
        </NavLink>
      ))}
      {/* Add user profile/logout on the right if needed */}
    </nav>
  );
}
