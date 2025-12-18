import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  FileText,
  Users,
  AlertCircle,
  Plus,
  UserPlus,
  Search,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  CheckCircle
} from "lucide-react";
import StatsCard from "../components/shared/StatsCard";
import ActionButton from "../components/shared/ActionButton";
import Badge from "../components/shared/Badge";
import { colors, spacing, shadows, borderRadius, typography, transitions } from "../components/shared/theme";

export default function Dashboard() {
  const navigate = useNavigate();
  const { userDetails } = useAuth();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filter, setFilter] = useState({ priority: "", status: "" });
  const [sortConfig, setSortConfig] = useState({ key: 'orderNumber', direction: 'ascending' });
  const [searchTerm, setSearchTerm] = useState("");
  const [showClosed, setShowClosed] = useState(false);
  const [quickFilter, setQuickFilter] = useState("all"); // "all", "ongoing", "planned", "nearDeadline"

  // Handle quick status/priority changes
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const updateData = { status: newStatus };

      // If status is "Full fakturerad" or "Avslutad", mark as closed
      if (newStatus === "Full fakturerad" || newStatus === "Avslutad") {
        updateData.closed = true;
        updateData.closedAt = new Date().toISOString();
      } else {
        updateData.closed = false;
        updateData.closedAt = null;
      }

      await updateDoc(doc(db, "orders", orderId), updateData);

      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, ...updateData } : order
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Kunde inte uppdatera status");
    }
  };

  const handlePriorityChange = async (orderId, newPriority) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { priority: newPriority });

      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, priority: newPriority } : order
        )
      );
    } catch (error) {
      console.error("Error updating priority:", error);
      alert("Kunde inte uppdatera prioritet");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!userDetails?.organizationId) return;

      try {
        const [ordersSnap, customersSnap] = await Promise.all([
          getDocs(query(collection(db, "orders"), where("organizationId", "==", userDetails.organizationId))),
          getDocs(query(collection(db, "customers"), where("organizationId", "==", userDetails.organizationId))),
        ]);

      const customerList = customersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCustomers(customerList);

      const orderList = ordersSnap.docs.map(doc => {
        const orderData = doc.data();
        const customer = customerList.find(c => c.id === orderData.customerId);
        return {
          id: doc.id,
          ...orderData,
          customerName: customer?.name || "Okänd kund",
        };
      });

      setOrders(orderList);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, [userDetails]);

  // Date calculations for deadline filtering
  const today = new Date();
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(today.getDate() + 7);

  const filteredOrders = orders.filter(order => {
    // Filter out closed orders unless showClosed is true
    const isClosed = order.closed === true || order.status === "Full fakturerad" || order.status === "Avslutad";
    if (!showClosed && isClosed) {
      return false;
    }
    // Only show closed orders when showClosed is true
    if (showClosed && !isClosed) {
      return false;
    }

    // Quick filter from StatsCard clicks
    if (quickFilter === "ongoing" && order.status !== "Pågående") {
      return false;
    }
    if (quickFilter === "planned" && order.status !== "Planerad" && order.status !== "Ej påbörjad") {
      return false;
    }
    if (quickFilter === "nearDeadline") {
      if (!order.deadline) return false;
      const deadlineDate = new Date(order.deadline);
      const isNearDeadline = deadlineDate >= today && deadlineDate <= sevenDaysFromNow;
      if (!isNearDeadline) return false;
    }

    const matchesFilter =
      (filter.priority ? order.priority === filter.priority : true) &&
      (filter.status ? order.status === filter.status : true);

    const matchesSearch = searchTerm === "" ||
      order.orderNumber?.toString().includes(searchTerm) ||
      order.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.address?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const sortedAndFilteredOrders = React.useMemo(() => {
    let sortableItems = [...filteredOrders];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        
        if (sortConfig.key === 'deadline') {
          const dateA = new Date(valA);
          const dateB = new Date(valB);
          if (dateA < dateB) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (dateA > dateB) return sortConfig.direction === 'ascending' ? 1 : -1;
          return 0;
        }

        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredOrders, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Calculate stats (excluding closed orders)
  const activeOrders = orders.filter(o => o.closed !== true && o.status !== "Full fakturerad" && o.status !== "Avslutad");
  const closedOrdersCount = orders.filter(o => o.closed === true || o.status === "Full fakturerad" || o.status === "Avslutad").length;
  const ongoingOrdersCount = activeOrders.filter(o => o.status === "Pågående").length;
  const plannedOrdersCount = activeOrders.filter(o => o.status === "Planerad" || o.status === "Ej påbörjad").length;
  const totalCustomersCount = customers.length;

  const ordersNearDeadlineCount = activeOrders.filter(order => {
    if (!order.deadline) return false;
    const deadlineDate = new Date(order.deadline);
    if (isNaN(deadlineDate.getTime())) return false;
    return deadlineDate >= today && deadlineDate <= sevenDaysFromNow;
  }).length;

  return (
    <div className="page-enter" style={{ fontFamily: typography.fontFamily.sans }}>
      {/* Header */}
      <div style={{ marginBottom: spacing[8] }}>
        <h1 style={{
          fontSize: typography.fontSize['4xl'],
          fontWeight: typography.fontWeight.bold,
          color: colors.neutral[900],
          marginBottom: spacing[2],
          letterSpacing: "-0.02em"
        }}>
          Dashboard
        </h1>
        <p style={{ color: colors.neutral[500], fontSize: typography.fontSize.lg }}>
          Välkommen tillbaka! Här är en översikt över dina arbetsordrar.
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: spacing[6],
        marginBottom: spacing[10]
      }}>
        <StatsCard
          label="Pågående ordrar"
          value={ongoingOrdersCount}
          icon={<TrendingUp size={24} />}
          gradient="blue"
          onClick={() => setQuickFilter(quickFilter === "ongoing" ? "all" : "ongoing")}
          active={quickFilter === "ongoing"}
        />
        <StatsCard
          label="Planerade ordrar"
          value={plannedOrdersCount}
          icon={<FileText size={24} />}
          gradient="purple"
          onClick={() => setQuickFilter(quickFilter === "planned" ? "all" : "planned")}
          active={quickFilter === "planned"}
        />
        <StatsCard
          label="Antal kunder"
          value={totalCustomersCount}
          icon={<Users size={24} />}
          gradient="green"
          onClick={() => navigate("/customers")}
        />
        <StatsCard
          label="Nära deadline (7d)"
          value={ordersNearDeadlineCount}
          icon={<AlertCircle size={24} />}
          gradient="orange"
          onClick={() => setQuickFilter(quickFilter === "nearDeadline" ? "all" : "nearDeadline")}
          active={quickFilter === "nearDeadline"}
        />
      </div>

      {/* Quick Actions */}
      <div style={{
        display: "flex",
        gap: spacing[4],
        marginBottom: spacing[8],
        flexWrap: "wrap"
      }}>
        <ActionButton
          onClick={() => navigate("/orders/new")}
          icon={<Plus size={20} />}
          variant="primary"
        >
          Ny arbetsorder
        </ActionButton>

        <ActionButton
          onClick={() => navigate("/customers/new")}
          icon={<UserPlus size={20} />}
          variant="secondary"
        >
          Ny kund
        </ActionButton>
      </div>

      {/* Orders Section */}
      <div className="card-enter" style={{
        backgroundColor: "white",
        borderRadius: borderRadius.xl,
        boxShadow: shadows.lg,
        overflow: "hidden",
        border: `1px solid ${colors.neutral[200]}`
      }}>
        {/* Table Header with Filters */}
        <div style={{
          padding: spacing[6],
          borderBottom: `2px solid ${colors.neutral[100]}`,
          display: "flex",
          flexDirection: "column",
          gap: spacing[4]
        }}>
          <h2 style={{
            fontSize: typography.fontSize['2xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.neutral[900],
            margin: 0
          }}>
            Arbetsordrar
          </h2>

          <div style={{
            display: "flex",
            gap: spacing[4],
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            {/* Search */}
            <div style={{ position: "relative", flex: "0 1 280px", minWidth: "200px" }}>
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: spacing[3],
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: colors.neutral[400]
                }}
              />
              <input
                type="text"
                placeholder="Sök ordernummer, titel, kund..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: `${spacing[3]} ${spacing[4]} ${spacing[3]} ${spacing[10]}`,
                  border: `2px solid ${colors.neutral[200]}`,
                  borderRadius: borderRadius.lg,
                  fontSize: typography.fontSize.base,
                  outline: "none",
                  transition: "all 0.2s ease",
                  fontFamily: typography.fontFamily.sans,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.primary[500];
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primary[100]}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.neutral[200];
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Filter Group - Right Side */}
            <div style={{
              display: "flex",
              gap: spacing[4],
              alignItems: "center",
              flexWrap: "wrap"
            }}>
            {/* Priority Filter */}
            <select
              value={filter.priority}
              onChange={e => setFilter({ ...filter, priority: e.target.value })}
              style={{
                padding: `${spacing[3]} ${spacing[4]}`,
                border: `2px solid ${colors.neutral[200]}`,
                borderRadius: borderRadius.lg,
                fontSize: typography.fontSize.base,
                color: colors.neutral[700],
                backgroundColor: "white",
                cursor: "pointer",
                outline: "none",
                minWidth: "160px",
                fontFamily: typography.fontFamily.sans,
                fontWeight: typography.fontWeight.medium,
              }}
            >
              <option value="">Alla prioriteter</option>
              <option value="Låg">Låg</option>
              <option value="Mellan">Mellan</option>
              <option value="Hög">Hög</option>
            </select>

            {/* Status Filter */}
            <select
              value={filter.status}
              onChange={e => setFilter({ ...filter, status: e.target.value })}
              style={{
                padding: `${spacing[3]} ${spacing[4]}`,
                border: `2px solid ${colors.neutral[200]}`,
                borderRadius: borderRadius.lg,
                fontSize: typography.fontSize.base,
                color: colors.neutral[700],
                backgroundColor: "white",
                cursor: "pointer",
                outline: "none",
                minWidth: "180px",
                fontFamily: typography.fontFamily.sans,
                fontWeight: typography.fontWeight.medium,
              }}
            >
              <option value="">Alla statusar</option>
              <option value="Planerad">Planerad</option>
              <option value="Ej påbörjad">Ej påbörjad</option>
              <option value="Pågående">Pågående</option>
              <option value="Klar för fakturering">Klar för fakturering</option>
              <option value="Full fakturerad">Full fakturerad</option>
            </select>

            {/* Show Closed Orders Toggle */}
            <button
              onClick={() => setShowClosed(!showClosed)}
              style={{
                padding: `${spacing[3]} ${spacing[4]}`,
                border: `2px solid ${showClosed ? colors.success[500] : colors.neutral[200]}`,
                borderRadius: borderRadius.lg,
                fontSize: typography.fontSize.base,
                color: showClosed ? "white" : colors.neutral[700],
                backgroundColor: showClosed ? colors.success[500] : "white",
                cursor: "pointer",
                fontFamily: typography.fontFamily.sans,
                fontWeight: typography.fontWeight.semibold,
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: spacing[2],
                minWidth: "200px",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                if (!showClosed) {
                  e.currentTarget.style.backgroundColor = colors.neutral[50];
                  e.currentTarget.style.borderColor = colors.success[300];
                }
              }}
              onMouseLeave={(e) => {
                if (!showClosed) {
                  e.currentTarget.style.backgroundColor = "white";
                  e.currentTarget.style.borderColor = colors.neutral[200];
                }
              }}
            >
              <CheckCircle size={18} />
              {showClosed ? `Visa aktiva (${activeOrders.length})` : `Visa avslutade (${closedOrdersCount})`}
            </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
          }}>
            <thead>
              <tr style={{ backgroundColor: colors.neutral[50] }}>
                <TableHeader onClick={() => requestSort('orderNumber')} sortKey="orderNumber" sortConfig={sortConfig}>
                  Order
                </TableHeader>
                <TableHeader onClick={() => requestSort('title')} sortKey="title" sortConfig={sortConfig}>
                  Titel
                </TableHeader>
                <TableHeader onClick={() => requestSort('customerName')} sortKey="customerName" sortConfig={sortConfig}>
                  Kund
                </TableHeader>
                <TableHeader>Adress</TableHeader>
                <TableHeader onClick={() => requestSort('deadline')} sortKey="deadline" sortConfig={sortConfig}>
                  Deadline
                </TableHeader>
                <TableHeader onClick={() => requestSort('status')} sortKey="status" sortConfig={sortConfig}>
                  Status
                </TableHeader>
                <TableHeader onClick={() => requestSort('priority')} sortKey="priority" sortConfig={sortConfig}>
                  Prioritet
                </TableHeader>
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredOrders.length > 0 ? (
                sortedAndFilteredOrders.map((order, index) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="hover-lift"
                    style={{
                      cursor: "pointer",
                      borderBottom: index !== sortedAndFilteredOrders.length - 1 ? `1px solid ${colors.neutral[100]}` : "none",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.neutral[50]}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: spacing[3] }}>
                        <div style={{
                          width: "40px",
                          height: "40px",
                          backgroundColor: colors.primary[100],
                          borderRadius: borderRadius.lg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}>
                          <FileText size={18} color={colors.primary[600]} />
                        </div>
                        <span style={{ fontWeight: typography.fontWeight.semibold, color: colors.neutral[900] }}>
                          #{order.orderNumber}
                        </span>
                      </div>
                    </td>
                    <td style={tdStyle}>{order.title || "—"}</td>
                    <td style={tdStyle}>{order.customerName || "—"}</td>
                    <td style={tdStyle}>{order.address || "—"}</td>
                    <td style={tdStyle}>
                      {order.deadline ? (
                        <span style={{ color: colors.neutral[700] }}>{order.deadline}</span>
                      ) : "—"}
                    </td>
                    <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                      <StatusBadge
                        status={order.status}
                        orderId={order.id}
                        onChange={handleStatusChange}
                      />
                    </td>
                    <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                      <PriorityBadge
                        priority={order.priority}
                        orderId={order.id}
                        onChange={handlePriorityChange}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{
                    padding: spacing[12],
                    textAlign: "center",
                    color: colors.neutral[400],
                    fontSize: typography.fontSize.lg,
                  }}>
                    {searchTerm || filter.priority || filter.status
                      ? "Inga arbetsordrar matchar dina filter"
                      : "Inga arbetsordrar ännu"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function TableHeader({ children, onClick, sortKey, sortConfig }) {
  const isActive = sortConfig?.key === sortKey;
  return (
    <th
      onClick={onClick}
      style={{
        padding: spacing[4],
        textAlign: "left",
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.bold,
        color: colors.neutral[600],
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
        whiteSpace: "nowrap",
        borderBottom: `2px solid ${colors.neutral[200]}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: spacing[2] }}>
        {children}
        {onClick && (
          <div style={{ display: "flex", flexDirection: "column", opacity: isActive ? 1 : 0.3 }}>
            <ChevronUp size={12} style={{ marginBottom: "-4px" }} />
            <ChevronDown size={12} />
          </div>
        )}
      </div>
    </th>
  );
}

const tdStyle = {
  padding: spacing[4],
  fontSize: typography.fontSize.base,
  color: colors.neutral[700],
  fontWeight: typography.fontWeight.medium,
};

function StatusBadge({ status, orderId, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = React.useRef(null);

  const statusMap = {
    "Pågående": "info",
    "Planerad": "warning",
    "Ej påbörjad": "neutral",
    "Klar för fakturering": "success",
    "Full fakturerad": "success",
  };

  const statusOptions = [
    "Ej påbörjad",
    "Planerad",
    "Pågående",
    "Klar för fakturering",
    "Full fakturerad",
    "Avslutad"
  ];

  const handleToggle = (e) => {
    e.stopPropagation();

    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 300; // Max height of dropdown
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Open upward if not enough space below
      const shouldOpenUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      setPosition({
        top: shouldOpenUpward ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
        left: rect.left,
        openUpward: shouldOpenUpward
      });
    }
    setIsOpen(!isOpen);
  };

  const handleChange = (newStatus) => {
    onChange(orderId, newStatus);
    setIsOpen(false);
  };

  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (buttonRef.current && buttonRef.current.contains(e.target)) return;
      setIsOpen(false);
    };

    // Small delay to avoid immediate closure
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      <div style={{ position: "relative" }}>
        <div
          ref={buttonRef}
          onClick={handleToggle}
          style={{ cursor: "pointer", display: "inline-block" }}
        >
          <Badge variant={statusMap[status] || "neutral"}>
            {status || "—"} ▾
          </Badge>
        </div>
      </div>

      {isOpen && ReactDOM.createPortal(
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: position.openUpward ? "auto" : `${position.top}px`,
            bottom: position.openUpward ? `${window.innerHeight - position.top}px` : "auto",
            left: `${position.left}px`,
            backgroundColor: "white",
            borderRadius: borderRadius.lg,
            boxShadow: shadows.lg,
            padding: spacing[2],
            zIndex: 9999,
            minWidth: "180px",
            border: `1px solid ${colors.neutral[200]}`,
            maxHeight: "300px",
            overflowY: "auto"
          }}>
          {statusOptions.map((option) => (
            <div
              key={option}
              onClick={(e) => {
                e.stopPropagation();
                handleChange(option);
              }}
              style={{
                padding: `${spacing[2]} ${spacing[3]}`,
                cursor: "pointer",
                borderRadius: borderRadius.md,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                backgroundColor: status === option ? colors.primary[50] : "transparent",
                color: status === option ? colors.primary[700] : colors.neutral[700],
                transition: `all ${transitions.base}`,
              }}
              onMouseEnter={(e) => {
                if (status !== option) {
                  e.currentTarget.style.backgroundColor = colors.neutral[50];
                }
              }}
              onMouseLeave={(e) => {
                if (status !== option) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              {option}
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

function PriorityBadge({ priority, orderId, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = React.useRef(null);

  const priorityMap = {
    "Hög": "error",
    "Mellan": "warning",
    "Låg": "info",
  };

  const priorityOptions = ["Låg", "Mellan", "Hög"];

  const handleToggle = (e) => {
    e.stopPropagation();

    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 200; // Max height of dropdown
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Open upward if not enough space below
      const shouldOpenUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      setPosition({
        top: shouldOpenUpward ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
        left: rect.left,
        openUpward: shouldOpenUpward
      });
    }
    setIsOpen(!isOpen);
  };

  const handleChange = (newPriority) => {
    onChange(orderId, newPriority);
    setIsOpen(false);
  };

  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (buttonRef.current && buttonRef.current.contains(e.target)) return;
      setIsOpen(false);
    };

    // Small delay to avoid immediate closure
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      <div style={{ position: "relative" }}>
        <div
          ref={buttonRef}
          onClick={handleToggle}
          style={{ cursor: "pointer", display: "inline-block" }}
        >
          <Badge variant={priorityMap[priority] || "neutral"}>
            {priority || "—"} ▾
          </Badge>
        </div>
      </div>

      {isOpen && ReactDOM.createPortal(
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: position.openUpward ? "auto" : `${position.top}px`,
            bottom: position.openUpward ? `${window.innerHeight - position.top}px` : "auto",
            left: `${position.left}px`,
            backgroundColor: "white",
            borderRadius: borderRadius.lg,
            boxShadow: shadows.lg,
            padding: spacing[2],
            zIndex: 9999,
            minWidth: "120px",
            border: `1px solid ${colors.neutral[200]}`,
            maxHeight: "200px",
            overflowY: "auto"
          }}>
          {priorityOptions.map((option) => (
            <div
              key={option}
              onClick={(e) => {
                e.stopPropagation();
                handleChange(option);
              }}
              style={{
                padding: `${spacing[2]} ${spacing[3]}`,
                cursor: "pointer",
                borderRadius: borderRadius.md,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                backgroundColor: priority === option ? colors.primary[50] : "transparent",
                color: priority === option ? colors.primary[700] : colors.neutral[700],
                transition: `all ${transitions.base}`,
              }}
              onMouseEnter={(e) => {
                if (priority !== option) {
                  e.currentTarget.style.backgroundColor = colors.neutral[50];
                }
              }}
              onMouseLeave={(e) => {
                if (priority !== option) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              {option}
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
