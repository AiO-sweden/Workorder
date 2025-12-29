import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  BarChart3,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  Download,
  FileText,
  Calendar,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Layers,
  PieChart,
  Activity,
  CheckCircle,
  AlertCircle,
  Target,
  Save,
  FilePlus,
  Edit2,
  Trash2,
  X
} from "lucide-react";

// Import modern design system
import ActionButton from "../components/shared/ActionButton";
import Badge from "../components/shared/Badge";
import Toast from "../components/shared/Toast";
import StatsCard from "../components/shared/StatsCard";
import { cardStyle, inputStyle } from "../components/shared/styles";
import { colors, spacing, shadows, borderRadius, typography } from "../components/shared/theme";

// Default time codes if none exist
const DEFAULT_TIME_CODES = [
  { id: "normal", name: "Normal tid", color: "#3b82f6", billable: true, hourlyRate: 650 },
  { id: "overtime", name: "Övertid", color: "#f59e0b", billable: true, hourlyRate: 975 },
  { id: "oncall", name: "Jour", color: "#8b5cf6", billable: true, hourlyRate: 800 },
  { id: "travel", name: "Restid", color: "#06b6d4", billable: true, hourlyRate: 500 },
  { id: "internal", name: "Intern tid", color: "#64748b", billable: false, hourlyRate: 0 },
  { id: "vacation", name: "Semester", color: "#10b981", billable: false, hourlyRate: 0 },
  { id: "sick", name: "Sjuk", color: "#ef4444", billable: false, hourlyRate: 0 }
];

// Helper Components
function TabButton({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: spacing[2],
        padding: `${spacing[3]} ${spacing[5]}`,
        border: "none",
        borderRadius: borderRadius.lg,
        cursor: "pointer",
        backgroundColor: active ? colors.primary[500] : "transparent",
        color: active ? "white" : colors.neutral[600],
        fontWeight: active ? typography.fontWeight.semibold : typography.fontWeight.medium,
        fontSize: typography.fontSize.base,
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = colors.neutral[50];
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function FormField({ label, required, children, helper }) {
  return (
    <div style={{ marginBottom: spacing[4] }}>
      <label style={{
        display: "block",
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
        color: colors.neutral[700],
        marginBottom: spacing[2]
      }}>
        {label}
        {required && <span style={{ color: colors.error[500], marginLeft: spacing[1] }}>*</span>}
      </label>
      {children}
      {helper && (
        <div style={{ marginTop: spacing[1], fontSize: typography.fontSize.xs, color: colors.neutral[500] }}>
          {helper}
        </div>
      )}
    </div>
  );
}

function BarChart({ data, maxValue, color = colors.primary[500] }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: spacing[2], height: "150px" }}>
      {data.map((item, index) => {
        const heightPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        return (
          <div key={index} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: spacing[2] }}>
            <div style={{ width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "120px" }}>
              <div
                style={{
                  width: "100%",
                  height: `${heightPercent}%`,
                  backgroundColor: color,
                  borderRadius: `${borderRadius.base} ${borderRadius.base} 0 0`,
                  transition: "all 0.3s ease",
                  position: "relative"
                }}
                title={`${item.label}: ${item.value.toFixed(1)}h`}
              >
                <div style={{
                  position: "absolute",
                  top: "-20px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.neutral[900],
                  whiteSpace: "nowrap"
                }}>
                  {item.value > 0 ? item.value.toFixed(1) : ""}
                </div>
              </div>
            </div>
            <div style={{ fontSize: typography.fontSize.xs, color: colors.neutral[500], fontWeight: typography.fontWeight.medium }}>
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PieChartDisplay({ data, total }) {
  let currentAngle = 0;
  const radius = 70;
  const centerX = 80;
  const centerY = 80;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: spacing[8] }}>
      <svg width="160" height="160" style={{ transform: "rotate(-90deg)" }}>
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          const angle = (percentage / 100) * 360;
          const largeArcFlag = angle > 180 ? 1 : 0;

          const startX = centerX + radius * Math.cos((currentAngle * Math.PI) / 180);
          const startY = centerY + radius * Math.sin((currentAngle * Math.PI) / 180);

          currentAngle += angle;

          const endX = centerX + radius * Math.cos((currentAngle * Math.PI) / 180);
          const endY = centerY + radius * Math.sin((currentAngle * Math.PI) / 180);

          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${startX} ${startY}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            'Z'
          ].join(' ');

          return (
            <path
              key={index}
              d={pathData}
              fill={item.color}
              stroke="white"
              strokeWidth="2"
            />
          );
        })}
        <circle cx={centerX} cy={centerY} r="40" fill="white" />
      </svg>

      <div style={{ display: "flex", flexDirection: "column", gap: spacing[2] }}>
        {data.map((item, index) => (
          <div key={index} style={{ display: "flex", alignItems: "center", gap: spacing[2] }}>
            <div style={{
              width: "12px",
              height: "12px",
              borderRadius: borderRadius.sm,
              backgroundColor: item.color
            }} />
            <div style={{ fontSize: typography.fontSize.sm, color: colors.neutral[600] }}>
              {item.label}
            </div>
            <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.neutral[900], marginLeft: "auto" }}>
              {item.value.toFixed(1)}h ({total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { userDetails, currentUser } = useAuth();

  // Data state
  const [timeReports, setTimeReports] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [timeCodes, setTimeCodes] = useState(DEFAULT_TIME_CODES);
  const [loading, setLoading] = useState(true);

  // UI state
  const [activeView, setActiveView] = useState("dashboard");
  const [timePeriod, setTimePeriod] = useState("month");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [selectedTimeCode, setSelectedTimeCode] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterBillable, setFilterBillable] = useState("all");
  const [expandedRows, setExpandedRows] = useState({});
  const [editingReport, setEditingReport] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Time report form state
  const [form, setForm] = useState({
    arbetsorder: "",
    datum: new Date().toISOString().split('T')[0],
    startTid: "",
    slutTid: "",
    antalTimmar: "",
    timeCode: "",
    fakturerbar: true,
    kommentar: ""
  });

  // Toast state
  const [toast, setToast] = useState(null);

  // PDF Export filter state
  const [pdfFilterCustomer, setPdfFilterCustomer] = useState("");
  const [pdfFilterOrder, setPdfFilterOrder] = useState("");
  const [pdfFilterUser, setPdfFilterUser] = useState("");

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE');
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      if (!userDetails) {
        console.log("⏳ ReportsPage: Waiting for userDetails to load...");
        setLoading(false);
        return;
      }

      if (!userDetails.organizationId) {
        console.log("⚠️ ReportsPage: No organizationId, skipping data fetch");
        setLoading(false);
        return;
      }

      console.log('🔍 ReportsPage: Fetching time codes, reports, orders, customers, and users...');

      try {
        setLoading(true);

        // Fetch time codes from settings
        const { data: timeCodesData, error: timeCodesError } = await supabase
          .from('time_codes')
          .select('*')
          .order('code', { ascending: true });

        if (timeCodesError && timeCodesError.code !== 'PGRST116') {
          console.error("❌ ReportsPage: Error fetching time codes:", timeCodesError);
        }

        if (timeCodesData && timeCodesData.length > 0) {
          // Convert time_codes table format to component format
          const convertedTimeCodes = timeCodesData.map(tc => ({
            id: tc.code || tc.id,
            name: tc.name,
            color: "#3b82f6", // Default color, could be added to time_codes table later
            billable: tc.type === 'Arbetstid',
            hourlyRate: tc.rate || 0
          }));
          setTimeCodes(convertedTimeCodes);
          console.log("✅ ReportsPage: Time codes fetched:", convertedTimeCodes.length);
        }

        // Fetch time reports
        const { data: reportsData, error: reportsError } = await supabase
          .from('tidsrapporteringar')
          .select('*')
          .eq('organization_id', userDetails.organizationId)
          .order('datum', { ascending: false });

        if (reportsError) throw reportsError;

        // Convert from snake_case to camelCase
        const convertedReports = reportsData.map(report => ({
          id: report.id,
          arbetsorder: report.arbetsorder,
          datum: report.datum,
          startTid: report.start_tid,
          slutTid: report.slut_tid,
          antalTimmar: report.antal_timmar,
          timeCode: report.time_code,
          timeCodeName: report.time_code_name,
          timeCodeColor: report.time_code_color,
          hourlyRate: report.hourly_rate,
          fakturerbar: report.fakturerbar,
          kommentar: report.kommentar,
          godkand: report.godkand,
          userId: report.user_id,
          userName: report.user_name,
          organizationId: report.organization_id,
          timestamp: report.timestamp,
          updatedAt: report.updated_at
        }));

        setTimeReports(convertedReports);
        console.log("✅ ReportsPage: Tidsrapporter hämtade:", convertedReports.length);

        // Fetch orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('organization_id', userDetails.organizationId);

        if (ordersError) throw ordersError;

        // Convert from snake_case to camelCase
        const convertedOrders = ordersData.map(order => ({
          id: order.id,
          orderNumber: order.order_number,
          customerId: order.customer_id,
          title: order.title,
          description: order.description,
          address: order.address,
          workType: order.work_type,
          status: order.status,
          priority: order.priority,
          billingType: order.billing_type,
          deadline: order.deadline,
          estimatedTime: order.estimated_time,
          assignedTo: order.assigned_to,
          billable: order.billable,
          fixedPrice: order.fixed_price,
          organizationId: order.organization_id,
          createdAt: order.created_at,
          updatedAt: order.updated_at
        }));

        setOrders(convertedOrders);
        console.log("✅ ReportsPage: Arbetsordrar hämtade:", convertedOrders.length);

        // Fetch customers
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('*')
          .eq('organization_id', userDetails.organizationId);

        if (customersError) throw customersError;

        // Convert from snake_case to camelCase
        const convertedCustomers = customersData.map(customer => ({
          id: customer.id,
          name: customer.name,
          customerNumber: customer.customer_number,
          address: customer.address,
          phone: customer.phone,
          email: customer.email,
          invoiceBy: customer.invoice_by,
          paymentTerms: customer.payment_terms,
          referencePerson: customer.reference_person,
          organizationId: customer.organization_id,
          createdAt: customer.created_at,
          updatedAt: customer.updated_at
        }));

        setCustomers(convertedCustomers);
        console.log("✅ ReportsPage: Kunder hämtade:", convertedCustomers.length);

        // Fetch users
        const { data: usersData, error: usersError } = await supabase
          .from('schedulable_users')
          .select('*')
          .eq('organization_id', userDetails.organizationId);

        if (usersError) throw usersError;

        // Convert from snake_case to camelCase
        const convertedUsers = usersData.map(user => ({
          id: user.id,
          email: user.email,
          displayName: user.name,
          role: user.role,
          organizationId: user.organization_id,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }));

        setUsers(convertedUsers);
        console.log("✅ ReportsPage: Användare hämtade:", convertedUsers.length);

      } catch (error) {
        console.error("❌ ReportsPage: Fel vid hämtning av data:", error);
        showToast("Ett fel uppstod vid hämtning av data. Försök igen.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userDetails, toast?.message]);

  // Set default timeCode when timeCodes are loaded
  useEffect(() => {
    if (timeCodes.length > 0 && !form.timeCode) {
      setForm(prev => ({
        ...prev,
        timeCode: timeCodes[0].id
      }));
    }
  }, [timeCodes, form.timeCode]);

  // Handle time report form
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "startTid" || name === "slutTid") {
      setForm(prev => {
        const newForm = { ...prev, [name]: value };
        if (newForm.startTid && newForm.slutTid) {
          const start = new Date(`2000-01-01T${newForm.startTid}`);
          const end = new Date(`2000-01-01T${newForm.slutTid}`);
          const diffMs = end - start;
          const diffHours = (diffMs / (1000 * 60 * 60)).toFixed(2);
          newForm.antalTimmar = diffHours > 0 ? diffHours : "";
        }
        return newForm;
      });
    } else {
      setForm({ ...form, [name]: type === "checkbox" ? checked : value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const timeCodeInfo = timeCodes.find(tc => tc.id === form.timeCode);

      if (!userDetails?.organizationId) {
        showToast("Du måste vara inloggad för att rapportera tid.", "error");
        return;
      }

      // Convert camelCase to snake_case for database
      const { data, error } = await supabase
        .from('tidsrapporteringar')
        .insert([{
          arbetsorder: form.arbetsorder,
          datum: form.datum,
          start_tid: form.startTid || null,
          slut_tid: form.slutTid || null,
          antal_timmar: form.antalTimmar,
          time_code: form.timeCode,
          time_code_name: timeCodeInfo?.name || "Normal tid",
          time_code_color: timeCodeInfo?.color || "#3b82f6",
          hourly_rate: timeCodeInfo?.hourlyRate || 650,
          fakturerbar: form.fakturerbar,
          kommentar: form.kommentar,
          godkand: true,
          organization_id: userDetails.organizationId,
          user_id: currentUser.uid,
          user_name: userDetails.displayName || userDetails.email || "Användare",
          timestamp: new Date().toISOString()
        }]);

      if (error) throw error;

      showToast("Tiden har rapporterats!", "success");
      setForm({
        arbetsorder: "",
        datum: new Date().toISOString().split('T')[0],
        startTid: "",
        slutTid: "",
        antalTimmar: "",
        timeCode: timeCodes.length > 0 ? timeCodes[0].id : "",
        fakturerbar: true,
        kommentar: ""
      });
    } catch (err) {
      console.error("Fel vid submit:", err);
      showToast("Ett fel uppstod. Försök igen.", "error");
    }
  };

  // Handle edit report
  const handleEditReport = (report) => {
    setEditingReport(report.id);
    setEditForm({
      arbetsorder: report.arbetsorder,
      datum: report.datum,
      startTid: report.startTid || "",
      slutTid: report.slutTid || "",
      antalTimmar: report.antalTimmar,
      timeCode: report.timeCode || (timeCodes.length > 0 ? timeCodes[0].id : ""),
      fakturerbar: report.fakturerbar !== false,
      kommentar: report.kommentar || ""
    });
  };

  const handleCancelEdit = () => {
    setEditingReport(null);
    setEditForm({});
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "startTid" || name === "slutTid") {
      setEditForm(prev => {
        const newForm = { ...prev, [name]: value };
        if (newForm.startTid && newForm.slutTid) {
          const start = new Date(`2000-01-01T${newForm.startTid}`);
          const end = new Date(`2000-01-01T${newForm.slutTid}`);
          const diffMs = end - start;
          const diffHours = (diffMs / (1000 * 60 * 60)).toFixed(2);
          newForm.antalTimmar = diffHours > 0 ? diffHours : "";
        }
        return newForm;
      });
    } else {
      setEditForm({ ...editForm, [name]: type === "checkbox" ? checked : value });
    }
  };

  const handleUpdateReport = async (reportId) => {
    try {
      const timeCodeInfo = timeCodes.find(tc => tc.id === editForm.timeCode);

      const { error } = await supabase
        .from('tidsrapporteringar')
        .update({
          arbetsorder: editForm.arbetsorder,
          datum: editForm.datum,
          start_tid: editForm.startTid || null,
          slut_tid: editForm.slutTid || null,
          antal_timmar: editForm.antalTimmar,
          time_code: editForm.timeCode,
          time_code_name: timeCodeInfo?.name || "Normal tid",
          time_code_color: timeCodeInfo?.color || "#3b82f6",
          hourly_rate: timeCodeInfo?.hourlyRate || 650,
          fakturerbar: editForm.fakturerbar,
          kommentar: editForm.kommentar,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      setEditingReport(null);
      setEditForm({});
      showToast("Tidrapporten har uppdaterats!", "success");
    } catch (err) {
      console.error("Fel vid uppdatering:", err);
      showToast("Fel vid uppdatering. Försök igen.", "error");
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm("Är du säker på att du vill radera denna tidrapport? Detta kan inte ångras.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tidsrapporteringar')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      showToast("Tidrapporten har raderats!", "success");
    } catch (err) {
      console.error("Fel vid radering:", err);
      showToast("Fel vid radering. Försök igen.", "error");
    }
  };

  const handleApprovalChange = async (reportId, newApproval) => {
    try {
      const { error } = await supabase
        .from('tidsrapporteringar')
        .update({
          godkand: newApproval,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      // Update local state
      setTimeReports(prevReports =>
        prevReports.map(report =>
          report.id === reportId ? { ...report, godkand: newApproval } : report
        )
      );

      showToast(`Rapporten ${newApproval ? 'godkänd' : 'nekad'}!`, "success");
    } catch (err) {
      console.error("Fel vid uppdatering av godkännandestatus:", err);
      showToast("Fel vid uppdatering. Försök igen.", "error");
    }
  };

  // Filter reports by time period
  const getDateRangeReports = (reports) => {
    const now = new Date();

    if (dateRange.start && dateRange.end) {
      return reports.filter(r => {
        const reportDate = new Date(r.datum);
        return reportDate >= new Date(dateRange.start) && reportDate <= new Date(dateRange.end);
      });
    }

    switch (timePeriod) {
      case "today":
        return reports.filter(r => {
          const reportDate = new Date(r.datum);
          return reportDate.toDateString() === now.toDateString();
        });

      case "week":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1);
        weekStart.setHours(0, 0, 0, 0);
        return reports.filter(r => {
          const reportDate = new Date(r.datum);
          return reportDate >= weekStart;
        });

      case "month":
        return reports.filter(r => {
          const reportDate = new Date(r.datum);
          return reportDate.getMonth() === now.getMonth() &&
                 reportDate.getFullYear() === now.getFullYear();
        });

      case "year":
        return reports.filter(r => {
          const reportDate = new Date(r.datum);
          return reportDate.getFullYear() === now.getFullYear();
        });

      case "all":
      default:
        return reports;
    }
  };

  // Apply all filters
  const filteredReports = timeReports.filter(report => {
    const periodReports = getDateRangeReports([report]);
    if (periodReports.length === 0) return false;

    const order = orders.find(o => o.id === report.arbetsorder);
    const customer = order ? customers.find(c => c.id === order.customerId) : null;
    const searchString = `${order?.orderNumber || ""} ${order?.title || ""} ${customer?.name || ""} ${report.kommentar || ""} ${report.userName || ""}`.toLowerCase();
    if (searchTerm && !searchString.includes(searchTerm.toLowerCase())) return false;

    if (selectedCustomers.length > 0) {
      const reportCustomerId = order?.customerId;
      if (!selectedCustomers.includes(reportCustomerId)) return false;
    }

    if (selectedTimeCode !== "all" && report.timeCode !== selectedTimeCode) return false;
    if (filterStatus === "approved" && !report.godkand) return false;
    if (filterStatus === "pending" && report.godkand) return false;
    if (filterBillable === "billable" && report.fakturerbar === false) return false;
    if (filterBillable === "internal" && report.fakturerbar !== false) return false;

    return true;
  });

  // Get period reports for statistics
  const periodReports = getDateRangeReports(timeReports);
  const billableReports = periodReports.filter(r => r.fakturerbar !== false && r.godkand === true);
  const totalHours = periodReports.reduce((sum, r) => sum + parseFloat(r.antalTimmar || 0), 0);
  const billableHours = billableReports.reduce((sum, r) => sum + parseFloat(r.antalTimmar || 0), 0);
  const totalValue = billableReports.reduce((sum, r) => {
    const hours = parseFloat(r.antalTimmar || 0);
    const rate = r.hourlyRate || 650;
    return sum + (hours * rate);
  }, 0);
  const approvedReports = periodReports.filter(r => r.godkand).length;
  const pendingReports = periodReports.filter(r => !r.godkand).length;

  const getPeriodLabel = () => {
    if (dateRange.start && dateRange.end) {
      return `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;
    }
    switch (timePeriod) {
      case "today": return "Idag";
      case "week": return "Denna vecka";
      case "month": return "Denna månad";
      case "year": return "Detta år";
      case "all": return "Totalt";
      default: return "Totalt";
    }
  };

  const getLast7DaysData = () => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayReports = periodReports.filter(r => r.datum === dateStr);
      const dayHours = dayReports.reduce((sum, r) => sum + parseFloat(r.antalTimmar || 0), 0);
      data.push({
        label: date.toLocaleDateString('sv-SE', { weekday: 'short' }),
        value: dayHours
      });
    }
    return data;
  };

  const getCustomerDistribution = () => {
    const customerHours = {};
    periodReports.forEach(report => {
      const order = orders.find(o => o.id === report.arbetsorder);
      const customer = order ? customers.find(c => c.id === order.customerId) : null;
      const customerId = customer?.id || "unknown";
      const customerName = customer?.name || "Okänd kund";

      if (!customerHours[customerId]) {
        customerHours[customerId] = {
          name: customerName,
          hours: 0,
          color: `hsl(${Object.keys(customerHours).length * 45}, 70%, 50%)`
        };
      }
      customerHours[customerId].hours += parseFloat(report.antalTimmar || 0);
    });

    return Object.values(customerHours)
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5)
      .map(c => ({
        label: c.name,
        value: c.hours,
        color: c.color
      }));
  };

  const getTimeCodeDistribution = () => {
    const codeHours = {};
    timeCodes.forEach(code => {
      codeHours[code.id] = { ...code, hours: 0 };
    });

    periodReports.forEach(report => {
      const codeId = report.timeCode || "normal";
      if (codeHours[codeId]) {
        codeHours[codeId].hours += parseFloat(report.antalTimmar || 0);
      }
    });

    return Object.values(codeHours)
      .filter(c => c.hours > 0)
      .map(c => ({
        label: c.name,
        value: c.hours,
        color: c.color
      }));
  };

  // Export to Excel
  const exportToExcel = () => {
    const exportData = filteredReports.map(report => {
      const order = orders.find(o => o.id === report.arbetsorder);
      const customer = order ? customers.find(c => c.id === order.customerId) : null;
      const timeCode = timeCodes.find(tc => tc.id === report.timeCode);
      return {
        'Datum': formatDate(report.datum),
        'Kund': customer?.name || '-',
        'Ordernr': order?.orderNumber || '-',
        'Ordertitel': order?.title || '-',
        'Tidkod': timeCode?.name || 'Normal tid',
        'Timmar': report.antalTimmar,
        'Fakturerbar': report.fakturerbar !== false ? 'Ja' : 'Nej',
        'Timpris (kr, ex. moms)': report.hourlyRate || 650,
        'Värde (kr, ex. moms)': parseFloat(report.antalTimmar || 0) * (report.hourlyRate || 650),
        'Status': report.godkand ? 'Godkänd' : 'Väntande',
        'Användare': report.userName || '-',
        'Kommentar': report.kommentar || '-'
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tidsrapporter");

    const avgRate = billableReports.length > 0
      ? billableReports.reduce((sum, r) => sum + (r.hourlyRate || 650), 0) / billableReports.length
      : 650;

    const summaryData = [
      { 'Beskrivning': 'Period', 'Värde': getPeriodLabel() },
      { 'Beskrivning': 'Totalt timmar', 'Värde': totalHours.toFixed(2) },
      { 'Beskrivning': 'Fakturerbara timmar', 'Värde': billableHours.toFixed(2) },
      { 'Beskrivning': 'Totalt värde (ex. moms)', 'Värde': `${totalValue.toLocaleString('sv-SE')} kr` },
      { 'Beskrivning': 'Antal rapporter', 'Värde': periodReports.length },
      { 'Beskrivning': 'Godkända', 'Värde': approvedReports },
      { 'Beskrivning': 'Väntande', 'Värde': pendingReports },
      { 'Beskrivning': 'Medel timpris', 'Värde': `${avgRate.toFixed(0)} kr/h` }
    ];

    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Sammanfattning");

    XLSX.writeFile(wb, `rapporter_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast("Excel-rapport exporterad!", "success");
  };

  // Export to PDF
  const exportToPDF = () => {
    // Filter reports based on PDF filters
    let pdfReports = filteredReports;

    if (pdfFilterCustomer) {
      pdfReports = pdfReports.filter(report => {
        const order = orders.find(o => o.id === report.arbetsorder);
        return order?.customerId === pdfFilterCustomer;
      });
    }

    if (pdfFilterOrder) {
      pdfReports = pdfReports.filter(report => report.arbetsorder === pdfFilterOrder);
    }

    if (pdfFilterUser) {
      pdfReports = pdfReports.filter(report => report.userId === pdfFilterUser);
    }

    if (pdfReports.length === 0) {
      showToast("Inga rapporter att exportera med valda filter.", "warning");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageMargin = 15;

    // Header
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Tidsrapport', pageMargin, 20);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Period: ${getPeriodLabel()}`, pageMargin, 28);
    doc.text(`Exportdatum: ${formatDate(new Date().toISOString())}`, pageMargin, 34);

    // Filter info
    let yPos = 40;
    if (pdfFilterCustomer) {
      const customer = customers.find(c => c.id === pdfFilterCustomer);
      doc.text(`Kund: ${customer?.name || 'Okänd'}`, pageMargin, yPos);
      yPos += 6;
    }
    if (pdfFilterOrder) {
      const order = orders.find(o => o.id === pdfFilterOrder);
      doc.text(`Order: #${order?.orderNumber || 'Okänd'}`, pageMargin, yPos);
      yPos += 6;
    }
    if (pdfFilterUser) {
      const user = users.find(u => u.id === pdfFilterUser);
      doc.text(`Användare: ${user?.displayName || user?.email || 'Okänd'}`, pageMargin, yPos);
      yPos += 6;
    }

    yPos += 5;

    // Table
    const tableData = pdfReports.map(report => {
      const order = orders.find(o => o.id === report.arbetsorder);
      const customer = order ? customers.find(c => c.id === order.customerId) : null;
      const timeCode = timeCodes.find(tc => tc.id === report.timeCode);

      return [
        formatDate(report.datum),
        customer?.name || '-',
        order?.orderNumber || '-',
        timeCode?.name || 'Normal tid',
        report.antalTimmar,
        report.fakturerbar !== false ? 'Ja' : 'Nej',
        (parseFloat(report.antalTimmar || 0) * (report.hourlyRate || 650)).toLocaleString('sv-SE'),
        report.kommentar || '-'
      ];
    });

    autoTable(doc, {
      head: [['Datum', 'Kund', 'Order', 'Tidkod', 'Timmar', 'Fakt.', 'Värde (ex. moms)', 'Kommentar']],
      body: tableData,
      startY: yPos,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 30 },
        2: { cellWidth: 20 },
        3: { cellWidth: 25 },
        4: { cellWidth: 15, halign: 'right' },
        5: { cellWidth: 12, halign: 'center' },
        6: { cellWidth: 25, halign: 'right' },
        7: { cellWidth: 'auto' }
      }
    });

    // Summary
    const summaryY = doc.lastAutoTable.finalY + 10;
    const reportTotal = pdfReports.reduce((sum, r) => sum + parseFloat(r.antalTimmar || 0), 0);
    const reportBillable = pdfReports.filter(r => r.fakturerbar !== false && r.godkand === true).reduce((sum, r) => sum + parseFloat(r.antalTimmar || 0), 0);
    const reportValue = pdfReports
      .filter(r => r.fakturerbar !== false && r.godkand === true)
      .reduce((sum, r) => {
        const hours = parseFloat(r.antalTimmar || 0);
        const rate = r.hourlyRate || 650;
        return sum + (hours * rate);
      }, 0);

    const avgRate = reportBillable > 0
      ? pdfReports
          .filter(r => r.fakturerbar !== false && r.godkand === true)
          .reduce((sum, r) => sum + (r.hourlyRate || 650), 0) / pdfReports.filter(r => r.fakturerbar !== false && r.godkand === true).length
      : 650;

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(`Totalt antal timmar: ${reportTotal.toFixed(2)}h`, pageMargin, summaryY);
    doc.text(`Fakturerbara timmar: ${reportBillable.toFixed(2)}h`, pageMargin, summaryY + 6);
    doc.text(`Totalt värde (ex. moms): ${reportValue.toLocaleString('sv-SE')} kr`, pageMargin, summaryY + 12);
    doc.text(`Medel timpris: ${avgRate.toFixed(0)} kr/h`, pageMargin, summaryY + 18);

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(`Genererad från ${userDetails?.organizationName || 'Workorder App'}`, pageWidth / 2, footerY, { align: 'center' });

    doc.save(`tidsrapport_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast("PDF-rapport exporterad!", "success");
  };

  const last7DaysData = getLast7DaysData();
  const maxDailyHours = Math.max(...last7DaysData.map(d => d.value), 1);
  const customerDistribution = getCustomerDistribution();
  const timeCodeDistribution = getTimeCodeDistribution();

  // Get filtered orders for PDF export
  const pdfCustomerOrders = pdfFilterCustomer
    ? orders.filter(o => o.customerId === pdfFilterCustomer)
    : orders;

  return (
    <div style={{
      maxWidth: "1600px",
      margin: "0 auto",
      fontFamily: typography.fontFamily.sans
    }}>
      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: spacing[8] }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: spacing[4] }}>
          <div>
            <h1 style={{
              fontSize: typography.fontSize['4xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.neutral[900],
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: spacing[3]
            }}>
              <BarChart3 size={32} color={colors.primary[500]} />
              Rapporter & Analys
            </h1>
            <p style={{
              color: colors.neutral[600],
              fontSize: typography.fontSize.base,
              margin: `${spacing[1]} 0 0 ${spacing[10]}`
            }}>
              Rapportera tid, analysera och exportera rapporter
            </p>
          </div>

          <div style={{ display: "flex", gap: spacing[3], flexWrap: "wrap" }}>
            <ActionButton onClick={exportToPDF} icon={<Download size={18} />} variant="danger">
              Exportera PDF
            </ActionButton>
            <ActionButton onClick={exportToExcel} icon={<Download size={18} />} variant="success">
              Exportera Excel
            </ActionButton>
          </div>
        </div>
      </div>

      {/* Time Period Selector */}
      <div style={{
        marginBottom: spacing[6],
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: spacing[4]
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: spacing[3], flexWrap: "wrap" }}>
          <span style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: colors.neutral[600]
          }}>
            Period:
          </span>
          <div style={{ display: "flex", gap: spacing[2] }}>
            {["today", "week", "month", "year", "all"].map(period => (
              <button
                key={period}
                onClick={() => {
                  setTimePeriod(period);
                  setDateRange({ start: "", end: "" });
                }}
                style={{
                  padding: `${spacing[2]} ${spacing[4]}`,
                  border: `2px solid ${colors.neutral[200]}`,
                  borderRadius: borderRadius.lg,
                  cursor: "pointer",
                  backgroundColor: timePeriod === period && !dateRange.start ? colors.primary[500] : "white",
                  color: timePeriod === period && !dateRange.start ? "white" : colors.neutral[600],
                  fontWeight: typography.fontWeight.semibold,
                  fontSize: typography.fontSize.sm,
                  transition: "all 0.2s ease"
                }}
              >
                {period === "today" ? "Idag" : period === "week" ? "Vecka" : period === "month" ? "Månad" : period === "year" ? "År" : "Alla"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: spacing[2], alignItems: "center" }}>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              style={{ ...inputStyle, width: "auto", padding: spacing[2] }}
            />
            <span style={{ color: colors.neutral[500] }}>-</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              style={{ ...inputStyle, width: "auto", padding: spacing[2] }}
            />
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: spacing[6],
        marginBottom: spacing[8]
      }}>
        <StatsCard
          icon={<Clock size={24} />}
          label={`${getPeriodLabel()} - Timmar`}
          value={totalHours.toFixed(1)}
          gradient="blue"
        />
        <StatsCard
          icon={<DollarSign size={24} />}
          label={`${getPeriodLabel()} - Värde`}
          value={`${totalValue.toLocaleString('sv-SE')} kr`}
          gradient="green"
        />
        <StatsCard
          icon={<FileText size={24} />}
          label="Antal rapporter"
          value={periodReports.length}
          gradient="orange"
        />
        <StatsCard
          icon={<Activity size={24} />}
          label="Snitt per dag"
          value={periodReports.length > 0 ? (totalHours / 30).toFixed(1) : "0.0"}
          gradient="purple"
        />
      </div>

      {/* Tabs Navigation */}
      <div className="card-enter" style={{
        backgroundColor: "white",
        borderRadius: borderRadius.xl,
        padding: spacing[2],
        marginBottom: spacing[6],
        boxShadow: shadows.md,
        display: "inline-flex",
        gap: spacing[2],
        flexWrap: "wrap"
      }}>
        <TabButton
          active={activeView === "report"}
          onClick={() => setActiveView("report")}
          icon={<FilePlus size={18} />}
        >
          Rapportera tid
        </TabButton>
        <TabButton
          active={activeView === "dashboard"}
          onClick={() => setActiveView("dashboard")}
          icon={<BarChart3 size={18} />}
        >
          Dashboard
        </TabButton>
        <TabButton
          active={activeView === "details"}
          onClick={() => setActiveView("details")}
          icon={<FileText size={18} />}
        >
          Detaljerad vy
        </TabButton>
        <TabButton
          active={activeView === "customers"}
          onClick={() => setActiveView("customers")}
          icon={<Users size={18} />}
        >
          Kundanalys
        </TabButton>
        <TabButton
          active={activeView === "timecodes"}
          onClick={() => setActiveView("timecodes")}
          icon={<Layers size={18} />}
        >
          Tidkoder
        </TabButton>
        <TabButton
          active={activeView === "export"}
          onClick={() => setActiveView("export")}
          icon={<Download size={18} />}
        >
          PDF Export
        </TabButton>
      </div>

      {/* Report Time View */}
      {activeView === "report" && (
        <div className="card-enter" style={cardStyle}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: spacing[3],
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.semibold,
            color: colors.neutral[900],
            marginBottom: spacing[6],
            paddingBottom: spacing[4],
            borderBottom: `2px solid ${colors.neutral[100]}`
          }}>
            <FilePlus size={20} color={colors.primary[500]} />
            <span>Rapportera ny tid</span>
          </div>

          {loading ? (
            <div style={{
              textAlign: "center",
              padding: spacing[12],
              color: colors.neutral[500]
            }}>
              <Clock size={48} style={{ marginBottom: spacing[4], opacity: 0.5, animation: "spin 2s linear infinite" }} />
              <p style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.medium }}>Laddar data...</p>
            </div>
          ) : orders.length === 0 ? (
            <div style={{
              padding: spacing[8],
              backgroundColor: colors.warning[50],
              border: `2px solid ${colors.warning[500]}`,
              borderRadius: borderRadius.lg,
              marginBottom: spacing[4]
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: spacing[3], marginBottom: spacing[4] }}>
                <AlertCircle size={24} color={colors.warning[600]} />
                <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colors.warning[800] }}>
                  Inga arbetsordrar tillgängliga
                </div>
              </div>
              <p style={{ color: colors.warning[800], marginBottom: spacing[4] }}>
                Du behöver skapa minst en arbetsorder innan du kan rapportera tid. Arbetsordrar skapas från kundvyn.
              </p>
              <ActionButton
                onClick={() => window.location.href = "/customers"}
                variant="secondary"
              >
                Gå till Kunder
              </ActionButton>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[6], marginBottom: spacing[6] }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <FormField label="Arbetsorder" required>
                    <select
                      name="arbetsorder"
                      value={form.arbetsorder}
                      onChange={handleChange}
                      required
                      style={inputStyle}
                    >
                      <option value="">Välj arbetsorder ({orders.length} tillgängliga)</option>
                      {orders.map((order) => {
                        const customer = customers.find(c => c.id === order.customerId);
                        return (
                          <option key={order.id} value={order.id}>
                            #{order.orderNumber} – {order.title || "(Ingen titel)"} ({customer?.name || "Okänd kund"})
                          </option>
                        );
                      })}
                    </select>
                  </FormField>
                </div>

              <FormField label="Datum" required>
                <input
                  type="date"
                  name="datum"
                  value={form.datum}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Tidkod" required>
                <select
                  name="timeCode"
                  value={form.timeCode}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  {timeCodes.map(code => (
                    <option key={code.id} value={code.id}>
                      {code.name} {!code.billable ? "(Ej fakturerbar)" : ""}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Starttid" helper="Valfritt - beräknar automatiskt timmar">
                <input
                  type="time"
                  name="startTid"
                  value={form.startTid}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Sluttid" helper="Valfritt - beräknar automatiskt timmar">
                <input
                  type="time"
                  name="slutTid"
                  value={form.slutTid}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Antal timmar" required>
                <input
                  type="number"
                  name="antalTimmar"
                  value={form.antalTimmar}
                  onChange={handleChange}
                  required
                  step="0.25"
                  min="0"
                  placeholder="0.00"
                  style={inputStyle}
                />
              </FormField>

              <div style={{ display: "flex", alignItems: "center", marginTop: spacing[6] }}>
                <label style={{ display: "flex", alignItems: "center", gap: spacing[2], cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    name="fakturerbar"
                    checked={form.fakturerbar}
                    onChange={handleChange}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.neutral[700] }}>
                    Fakturerbar tid
                  </span>
                </label>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <FormField label="Kommentar">
                  <textarea
                    name="kommentar"
                    value={form.kommentar}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Beskriv arbetet som utfördes..."
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </FormField>
              </div>
            </div>

            {form.antalTimmar && form.fakturerbar && (
              <div style={{
                padding: spacing[4],
                backgroundColor: colors.primary[50],
                border: `2px solid ${colors.primary[500]}`,
                borderRadius: borderRadius.lg,
                marginBottom: spacing[4],
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span style={{ color: colors.primary[700], fontWeight: typography.fontWeight.semibold }}>
                  Beräknat värde (ex. moms):
                </span>
                <span style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.primary[700] }}>
                  {(() => {
                    const selectedTimeCode = timeCodes.find(tc => tc.id === form.timeCode);
                    const rate = selectedTimeCode?.hourlyRate || 650;
                    return (parseFloat(form.antalTimmar) * rate).toLocaleString('sv-SE');
                  })()} kr
                </span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <ActionButton
                onClick={handleSubmit}
                icon={<Save size={18} />}
                variant="primary"
              >
                Rapportera tid
              </ActionButton>
            </div>
          </form>
          )}
        </div>
      )}

      {/* PDF Export View */}
      {activeView === "export" && (
        <div className="card-enter" style={cardStyle}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: spacing[3],
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.semibold,
            color: colors.neutral[900],
            marginBottom: spacing[6],
            paddingBottom: spacing[4],
            borderBottom: `2px solid ${colors.neutral[100]}`
          }}>
            <Download size={20} color={colors.error[500]} />
            <span>PDF Export med filter</span>
          </div>

          <div style={{ marginBottom: spacing[8] }}>
            <p style={{ color: colors.neutral[600], marginBottom: spacing[6] }}>
              Filtrera rapporter innan export till PDF. Välj kund, arbetsorder och/eller användare för att skapa en skräddarsydd rapport.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: spacing[4], marginBottom: spacing[6] }}>
              <FormField label="Filtrera per kund">
                <select
                  value={pdfFilterCustomer}
                  onChange={(e) => {
                    setPdfFilterCustomer(e.target.value);
                    setPdfFilterOrder(""); // Reset order when customer changes
                  }}
                  style={inputStyle}
                >
                  <option value="">Alla kunder</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Filtrera per arbetsorder">
                <select
                  value={pdfFilterOrder}
                  onChange={(e) => setPdfFilterOrder(e.target.value)}
                  style={inputStyle}
                  disabled={pdfFilterCustomer && pdfCustomerOrders.length === 0}
                >
                  <option value="">Alla arbetsordrar</option>
                  {pdfCustomerOrders.map(order => {
                    const customer = customers.find(c => c.id === order.customerId);
                    return (
                      <option key={order.id} value={order.id}>
                        #{order.orderNumber} - {order.title} ({customer?.name})
                      </option>
                    );
                  })}
                </select>
              </FormField>

              <FormField label="Filtrera per användare">
                <select
                  value={pdfFilterUser}
                  onChange={(e) => setPdfFilterUser(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Alla användare</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.displayName || user.email}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div style={{
              padding: spacing[4],
              backgroundColor: colors.neutral[50],
              borderRadius: borderRadius.lg,
              border: `1px solid ${colors.neutral[200]}`,
              marginBottom: spacing[6]
            }}>
              <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.neutral[900], marginBottom: spacing[2] }}>
                Förhandsvisning av export
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: spacing[3] }}>
                <div>
                  <div style={{ fontSize: typography.fontSize.xs, color: colors.neutral[500] }}>Period</div>
                  <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.neutral[900] }}>{getPeriodLabel()}</div>
                </div>
                <div>
                  <div style={{ fontSize: typography.fontSize.xs, color: colors.neutral[500] }}>Antal rapporter</div>
                  <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.neutral[900] }}>
                    {(() => {
                      let count = filteredReports.length;
                      if (pdfFilterCustomer) {
                        count = filteredReports.filter(r => {
                          const order = orders.find(o => o.id === r.arbetsorder);
                          return order?.customerId === pdfFilterCustomer;
                        }).length;
                      }
                      if (pdfFilterOrder) {
                        count = filteredReports.filter(r => r.arbetsorder === pdfFilterOrder).length;
                      }
                      if (pdfFilterUser) {
                        count = filteredReports.filter(r => r.userId === pdfFilterUser).length;
                      }
                      return count;
                    })()}
                  </div>
                </div>
                {pdfFilterCustomer && (
                  <div>
                    <div style={{ fontSize: typography.fontSize.xs, color: colors.neutral[500] }}>Vald kund</div>
                    <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.neutral[900] }}>
                      {customers.find(c => c.id === pdfFilterCustomer)?.name}
                    </div>
                  </div>
                )}
                {pdfFilterOrder && (
                  <div>
                    <div style={{ fontSize: typography.fontSize.xs, color: colors.neutral[500] }}>Vald order</div>
                    <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.neutral[900] }}>
                      #{orders.find(o => o.id === pdfFilterOrder)?.orderNumber}
                    </div>
                  </div>
                )}
                {pdfFilterUser && (
                  <div>
                    <div style={{ fontSize: typography.fontSize.xs, color: colors.neutral[500] }}>Vald användare</div>
                    <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.neutral[900] }}>
                      {users.find(u => u.id === pdfFilterUser)?.displayName || users.find(u => u.id === pdfFilterUser)?.email}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: spacing[4], justifyContent: "flex-end" }}>
              <ActionButton
                onClick={() => {
                  setPdfFilterCustomer("");
                  setPdfFilterOrder("");
                  setPdfFilterUser("");
                }}
                variant="secondary"
              >
                Rensa filter
              </ActionButton>
              <ActionButton
                onClick={exportToPDF}
                icon={<Download size={18} />}
                variant="danger"
              >
                Generera PDF
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard View */}
      {activeView === "dashboard" && (
        <div className="fade-in">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: spacing[6], marginBottom: spacing[6] }}>
            <div className="card-enter" style={cardStyle}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: spacing[3],
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.semibold,
                color: colors.neutral[900],
                marginBottom: spacing[6],
                paddingBottom: spacing[4],
                borderBottom: `2px solid ${colors.neutral[100]}`
              }}>
                <Activity size={20} color={colors.primary[500]} />
                <span>Timmar senaste 7 dagarna</span>
              </div>
              <BarChart data={last7DaysData} maxValue={maxDailyHours} color={colors.primary[500]} />
            </div>

            <div className="card-enter" style={cardStyle}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: spacing[3],
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.semibold,
                color: colors.neutral[900],
                marginBottom: spacing[6],
                paddingBottom: spacing[4],
                borderBottom: `2px solid ${colors.neutral[100]}`
              }}>
                <PieChart size={20} color={colors.success[500]} />
                <span>Fördelning per kund (Top 5)</span>
              </div>
              {customerDistribution.length > 0 ? (
                <PieChartDisplay
                  data={customerDistribution}
                  total={customerDistribution.reduce((sum, c) => sum + c.value, 0)}
                />
              ) : (
                <div style={{ textAlign: "center", padding: spacing[8], color: colors.neutral[500] }}>
                  Ingen data att visa för vald period
                </div>
              )}
            </div>
          </div>

          <div className="card-enter" style={cardStyle}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[3],
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.semibold,
              color: colors.neutral[900],
              marginBottom: spacing[6],
              paddingBottom: spacing[4],
              borderBottom: `2px solid ${colors.neutral[100]}`
            }}>
              <Layers size={20} color={colors.warning[500]} />
              <span>Fördelning per tidkod</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: spacing[4] }}>
              {timeCodeDistribution.map((code, index) => (
                <div
                  key={index}
                  className="hover-lift"
                  style={{
                    padding: spacing[4],
                    backgroundColor: `${code.color}10`,
                    border: `2px solid ${code.color}`,
                    borderRadius: borderRadius.lg,
                    display: "flex",
                    flexDirection: "column",
                    gap: spacing[2]
                  }}
                >
                  <div style={{ fontSize: typography.fontSize.sm, color: code.color, fontWeight: typography.fontWeight.semibold }}>
                    {code.label}
                  </div>
                  <div style={{ fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold, color: code.color }}>
                    {code.value.toFixed(1)}h
                  </div>
                  <div style={{ fontSize: typography.fontSize.xs, color: colors.neutral[500] }}>
                    {((code.value / totalHours) * 100).toFixed(0)}% av totalt
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detailed View */}
      {activeView === "details" && (
        <div className="card-enter" style={cardStyle}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: spacing[3],
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.semibold,
            color: colors.neutral[900],
            marginBottom: spacing[6],
            paddingBottom: spacing[4],
            borderBottom: `2px solid ${colors.neutral[100]}`
          }}>
            <FileText size={20} color={colors.primary[500]} />
            <span>Alla tidrapporter</span>
          </div>

          <div style={{ display: "flex", gap: spacing[4], marginBottom: spacing[6], flexWrap: "wrap" }}>
            <div style={{ flex: "1", minWidth: "250px" }}>
              <div style={{ position: "relative" }}>
                <Search size={18} style={{ position: "absolute", left: spacing[3], top: "50%", transform: "translateY(-50%)", color: colors.neutral[500] }} />
                <input
                  type="text"
                  placeholder="Sök efter kund, order, kommentar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: spacing[10] }}
                />
              </div>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ ...inputStyle, width: "auto", minWidth: "150px" }}
            >
              <option value="all">Alla statusar</option>
              <option value="approved">Godkända</option>
              <option value="pending">Väntande</option>
            </select>

            <select
              value={filterBillable}
              onChange={(e) => setFilterBillable(e.target.value)}
              style={{ ...inputStyle, width: "auto", minWidth: "150px" }}
            >
              <option value="all">Alla typer</option>
              <option value="billable">Fakturerbar</option>
              <option value="internal">Intern</option>
            </select>

            <select
              value={selectedTimeCode}
              onChange={(e) => setSelectedTimeCode(e.target.value)}
              style={{ ...inputStyle, width: "auto", minWidth: "150px" }}
            >
              <option value="all">Alla tidkoder</option>
              {timeCodes.map(code => (
                <option key={code.id} value={code.id}>{code.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: spacing[4], fontSize: typography.fontSize.sm, color: colors.neutral[600] }}>
            Visar {filteredReports.length} av {timeReports.length} rapporter
          </div>

          {filteredReports.length === 0 ? (
            <div style={{ textAlign: "center", padding: spacing[12], color: colors.neutral[500] }}>
              <FileText size={48} style={{ marginBottom: spacing[4], opacity: 0.5 }} />
              <p style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.medium }}>Inga rapporter hittades</p>
              <p style={{ fontSize: typography.fontSize.base }}>Försök ändra dina filterinställningar</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${colors.neutral[200]}` }}>
                    <th style={{ padding: spacing[3], textAlign: "left", fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.neutral[600] }}>Datum</th>
                    <th style={{ padding: spacing[3], textAlign: "left", fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.neutral[600] }}>Kund</th>
                    <th style={{ padding: spacing[3], textAlign: "left", fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.neutral[600] }}>Order</th>
                    <th style={{ padding: spacing[3], textAlign: "left", fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.neutral[600] }}>Tidkod</th>
                    <th style={{ padding: spacing[3], textAlign: "right", fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.neutral[600] }}>Timmar</th>
                    <th style={{ padding: spacing[3], textAlign: "right", fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.neutral[600] }}>Värde</th>
                    <th style={{ padding: spacing[3], textAlign: "left", fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.neutral[600] }}>Status</th>
                    <th style={{ padding: spacing[3], textAlign: "left", fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.neutral[600] }}>Användare</th>
                    <th style={{ padding: spacing[3], textAlign: "center", fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.neutral[600] }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map(report => {
                    const order = orders.find(o => o.id === report.arbetsorder);
                    const customer = order ? customers.find(c => c.id === order.customerId) : null;
                    const timeCode = timeCodes.find(tc => tc.id === report.timeCode);
                    const isExpanded = expandedRows[report.id];

                    return (
                      <React.Fragment key={report.id}>
                        <tr
                          style={{
                            borderBottom: `1px solid ${colors.neutral[100]}`,
                            backgroundColor: isExpanded ? colors.neutral[50] : "white",
                            transition: "background-color 0.2s ease"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.neutral[50]}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isExpanded ? colors.neutral[50] : "white"}
                        >
                          <td style={{ padding: spacing[3], fontSize: typography.fontSize.sm, color: colors.neutral[900] }}>
                            {formatDate(report.datum)}
                          </td>
                          <td style={{ padding: spacing[3], fontSize: typography.fontSize.sm, color: colors.neutral[900] }}>
                            {customer?.name || "Okänd kund"}
                          </td>
                          <td style={{ padding: spacing[3], fontSize: typography.fontSize.sm, color: colors.neutral[900] }}>
                            #{order?.orderNumber || report.arbetsorder?.substring(0, 8) || "N/A"}
                          </td>
                          <td style={{ padding: spacing[3] }}>
                            <Badge variant="neutral">
                              {timeCode?.name || "Normal tid"}
                            </Badge>
                          </td>
                          <td style={{ padding: spacing[3], textAlign: "right", fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.neutral[900] }}>
                            {report.antalTimmar}h
                          </td>
                          <td style={{ padding: spacing[3], textAlign: "right", fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: report.fakturerbar !== false ? colors.success[600] : colors.neutral[500] }}>
                            {report.fakturerbar !== false ? `${(parseFloat(report.antalTimmar || 0) * (report.hourlyRate || 650)).toLocaleString('sv-SE')} kr` : "Intern"}
                          </td>
                          <td style={{ padding: spacing[3] }} onClick={(e) => e.stopPropagation()}>
                            <ApprovalBadge
                              approved={report.godkand}
                              reportId={report.id}
                              onChange={handleApprovalChange}
                            />
                          </td>
                          <td style={{ padding: spacing[3], fontSize: typography.fontSize.sm, color: colors.neutral[600] }}>
                            {report.userName || "-"}
                          </td>
                          <td style={{ padding: spacing[3], textAlign: "center" }}>
                            <button
                              onClick={() => setExpandedRows(prev => ({ ...prev, [report.id]: !prev[report.id] }))}
                              style={{
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                                color: colors.neutral[600],
                                padding: spacing[1]
                              }}
                            >
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr style={{ backgroundColor: colors.neutral[50], borderBottom: `1px solid ${colors.neutral[200]}` }}>
                            <td colSpan="9" style={{ padding: spacing[4] }}>
                              {editingReport === report.id ? (
                                // Editing mode
                                <div>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing[4] }}>
                                    <div style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.neutral[900] }}>
                                      Redigera tidrapport
                                    </div>
                                    <button
                                      onClick={handleCancelEdit}
                                      style={{
                                        border: "none",
                                        background: "none",
                                        cursor: "pointer",
                                        color: colors.neutral[600],
                                        padding: spacing[1]
                                      }}
                                    >
                                      <X size={20} />
                                    </button>
                                  </div>

                                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: spacing[4], marginBottom: spacing[4] }}>
                                    <FormField label="Arbetsorder" required>
                                      <select
                                        name="arbetsorder"
                                        value={editForm.arbetsorder}
                                        onChange={handleEditChange}
                                        required
                                        style={inputStyle}
                                      >
                                        <option value="">Välj arbetsorder</option>
                                        {orders.map((order) => {
                                          const customer = customers.find(c => c.id === order.customerId);
                                          return (
                                            <option key={order.id} value={order.id}>
                                              #{order.orderNumber} – {order.title || "(Ingen titel)"} ({customer?.name || "Okänd kund"})
                                            </option>
                                          );
                                        })}
                                      </select>
                                    </FormField>

                                    <FormField label="Datum" required>
                                      <input
                                        type="date"
                                        name="datum"
                                        value={editForm.datum}
                                        onChange={handleEditChange}
                                        required
                                        style={inputStyle}
                                      />
                                    </FormField>

                                    <FormField label="Tidkod" required>
                                      <select
                                        name="timeCode"
                                        value={editForm.timeCode}
                                        onChange={handleEditChange}
                                        style={inputStyle}
                                      >
                                        {timeCodes.map(code => (
                                          <option key={code.id} value={code.id}>
                                            {code.name} {!code.billable ? "(Ej fakturerbar)" : ""}
                                          </option>
                                        ))}
                                      </select>
                                    </FormField>

                                    <FormField label="Antal timmar" required>
                                      <input
                                        type="number"
                                        name="antalTimmar"
                                        value={editForm.antalTimmar}
                                        onChange={handleEditChange}
                                        required
                                        step="0.25"
                                        min="0"
                                        style={inputStyle}
                                      />
                                    </FormField>

                                    <FormField label="Starttid">
                                      <input
                                        type="time"
                                        name="startTid"
                                        value={editForm.startTid}
                                        onChange={handleEditChange}
                                        style={inputStyle}
                                      />
                                    </FormField>

                                    <FormField label="Sluttid">
                                      <input
                                        type="time"
                                        name="slutTid"
                                        value={editForm.slutTid}
                                        onChange={handleEditChange}
                                        style={inputStyle}
                                      />
                                    </FormField>

                                    <div style={{ gridColumn: "1 / -1" }}>
                                      <FormField label="Kommentar">
                                        <textarea
                                          name="kommentar"
                                          value={editForm.kommentar}
                                          onChange={handleEditChange}
                                          rows={3}
                                          style={{ ...inputStyle, resize: "vertical" }}
                                        />
                                      </FormField>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center" }}>
                                      <label style={{ display: "flex", alignItems: "center", gap: spacing[2], cursor: "pointer" }}>
                                        <input
                                          type="checkbox"
                                          name="fakturerbar"
                                          checked={editForm.fakturerbar}
                                          onChange={handleEditChange}
                                          style={{ width: "18px", height: "18px", cursor: "pointer" }}
                                        />
                                        <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.neutral[700] }}>
                                          Fakturerbar tid
                                        </span>
                                      </label>
                                    </div>
                                  </div>

                                  <div style={{ display: "flex", gap: spacing[3], justifyContent: "flex-end" }}>
                                    <ActionButton
                                      onClick={handleCancelEdit}
                                      variant="secondary"
                                    >
                                      Avbryt
                                    </ActionButton>
                                    <ActionButton
                                      onClick={() => handleUpdateReport(report.id)}
                                      icon={<Save size={18} />}
                                      variant="primary"
                                    >
                                      Spara ändringar
                                    </ActionButton>
                                  </div>
                                </div>
                              ) : (
                                // View mode
                                <div>
                                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[4], marginBottom: spacing[4] }}>
                                    <div>
                                      <div style={{ fontSize: typography.fontSize.xs, color: colors.neutral[500], marginBottom: spacing[1] }}>Ordertitel</div>
                                      <div style={{ fontSize: typography.fontSize.sm, color: colors.neutral[900], fontWeight: typography.fontWeight.medium }}>{order?.title || "Ingen titel"}</div>
                                    </div>
                                    {report.startTid && report.slutTid && (
                                      <div>
                                        <div style={{ fontSize: typography.fontSize.xs, color: colors.neutral[500], marginBottom: spacing[1] }}>Arbetstid</div>
                                        <div style={{ fontSize: typography.fontSize.sm, color: colors.neutral[900], fontWeight: typography.fontWeight.medium }}>{report.startTid} - {report.slutTid}</div>
                                      </div>
                                    )}
                                    {report.kommentar && (
                                      <div style={{ gridColumn: "1 / -1" }}>
                                        <div style={{ fontSize: typography.fontSize.xs, color: colors.neutral[500], marginBottom: spacing[1] }}>Kommentar</div>
                                        <div style={{ fontSize: typography.fontSize.sm, color: colors.neutral[900], fontStyle: "italic", padding: spacing[2], backgroundColor: "white", borderRadius: borderRadius.base }}>
                                          "{report.kommentar}"
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div style={{ display: "flex", gap: spacing[3], justifyContent: "flex-end", paddingTop: spacing[2], borderTop: `1px solid ${colors.neutral[200]}` }}>
                                    <ActionButton
                                      onClick={() => handleEditReport(report)}
                                      icon={<Edit2 size={16} />}
                                      variant="primary"
                                    >
                                      Redigera
                                    </ActionButton>
                                    <ActionButton
                                      onClick={() => handleDeleteReport(report.id)}
                                      icon={<Trash2 size={16} />}
                                      variant="danger"
                                    >
                                      Radera
                                    </ActionButton>
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Customer Analysis View */}
      {activeView === "customers" && (
        <div className="card-enter" style={cardStyle}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: spacing[3],
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.semibold,
            color: colors.neutral[900],
            marginBottom: spacing[6],
            paddingBottom: spacing[4],
            borderBottom: `2px solid ${colors.neutral[100]}`
          }}>
            <Users size={20} color={colors.success[500]} />
            <span>Analys per kund</span>
          </div>

          {customers.map(customer => {
            const customerOrders = orders.filter(o => o.customerId === customer.id);
            const customerOrderIds = customerOrders.map(o => o.id);
            const customerReports = periodReports.filter(r => customerOrderIds.includes(r.arbetsorder));
            const customerHours = customerReports.reduce((sum, r) => sum + parseFloat(r.antalTimmar || 0), 0);
            const customerBillableHours = customerReports.filter(r => r.fakturerbar !== false && r.godkand === true).reduce((sum, r) => sum + parseFloat(r.antalTimmar || 0), 0);
            const customerValue = customerReports
              .filter(r => r.fakturerbar !== false && r.godkand === true)
              .reduce((sum, r) => {
                const hours = parseFloat(r.antalTimmar || 0);
                const rate = r.hourlyRate || 650;
                return sum + (hours * rate);
              }, 0);

            if (customerHours === 0) return null;

            return (
              <div
                key={customer.id}
                className="hover-lift"
                style={{
                  padding: spacing[5],
                  backgroundColor: colors.neutral[50],
                  borderRadius: borderRadius.lg,
                  marginBottom: spacing[4],
                  border: `1px solid ${colors.neutral[200]}`
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: spacing[4] }}>
                  <div>
                    <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colors.neutral[900], marginBottom: spacing[1] }}>
                      {customer.name}
                    </div>
                    <div style={{ fontSize: typography.fontSize.sm, color: colors.neutral[600] }}>
                      {customerReports.length} rapport{customerReports.length !== 1 ? "er" : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold, color: colors.neutral[900] }}>
                      {customerHours.toFixed(1)}h
                    </div>
                    <div style={{ fontSize: typography.fontSize.sm, color: colors.success[600], fontWeight: typography.fontWeight.semibold }}>
                      {customerValue.toLocaleString('sv-SE')} kr
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: spacing[3] }}>
                  <div style={{ padding: spacing[3], backgroundColor: "white", borderRadius: borderRadius.base }}>
                    <div style={{ fontSize: typography.fontSize.xs, color: colors.neutral[600], marginBottom: spacing[1] }}>Fakturerbart</div>
                    <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colors.success[600] }}>{customerBillableHours.toFixed(1)}h</div>
                  </div>
                  <div style={{ padding: spacing[3], backgroundColor: "white", borderRadius: borderRadius.base }}>
                    <div style={{ fontSize: typography.fontSize.xs, color: colors.neutral[600], marginBottom: spacing[1] }}>Internt</div>
                    <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colors.neutral[600] }}>{(customerHours - customerBillableHours).toFixed(1)}h</div>
                  </div>
                  <div style={{ padding: spacing[3], backgroundColor: "white", borderRadius: borderRadius.base }}>
                    <div style={{ fontSize: typography.fontSize.xs, color: colors.neutral[600], marginBottom: spacing[1] }}>Arbetsorder</div>
                    <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colors.primary[600] }}>{customerOrders.length}</div>
                  </div>
                  <div style={{ padding: spacing[3], backgroundColor: "white", borderRadius: borderRadius.base }}>
                    <div style={{ fontSize: typography.fontSize.xs, color: colors.neutral[600], marginBottom: spacing[1] }}>Snitt/order</div>
                    <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colors.warning[600] }}>{(customerHours / customerOrders.length).toFixed(1)}h</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Time Codes View */}
      {activeView === "timecodes" && (
        <div className="card-enter" style={cardStyle}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: spacing[3],
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.semibold,
            color: colors.neutral[900],
            marginBottom: spacing[6],
            paddingBottom: spacing[4],
            borderBottom: `2px solid ${colors.neutral[100]}`
          }}>
            <Layers size={20} color={colors.warning[500]} />
            <span>Detaljerad tidkodsanalys</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: spacing[6] }}>
            {timeCodes.map(timeCode => {
              const codeReports = periodReports.filter(r => r.timeCode === timeCode.id);
              const codeHours = codeReports.reduce((sum, r) => sum + parseFloat(r.antalTimmar || 0), 0);
              const codeValue = timeCode.billable
                ? codeReports
                    .filter(r => r.fakturerbar !== false)
                    .reduce((sum, r) => {
                      const hours = parseFloat(r.antalTimmar || 0);
                      const rate = r.hourlyRate || 650;
                      return sum + (hours * rate);
                    }, 0)
                : 0;

              return (
                <div
                  key={timeCode.id}
                  className="hover-lift"
                  style={{
                    padding: spacing[6],
                    backgroundColor: `${timeCode.color}08`,
                    border: `2px solid ${timeCode.color}`,
                    borderRadius: borderRadius.xl
                  }}
                >
                  <div style={{ marginBottom: spacing[4] }}>
                    <div style={{ display: "flex", alignItems: "center", gap: spacing[2], marginBottom: spacing[2] }}>
                      <Target size={20} color={timeCode.color} />
                      <div style={{ fontSize: typography.fontSize.lg, color: timeCode.color, fontWeight: typography.fontWeight.bold }}>
                        {timeCode.name}
                      </div>
                    </div>
                    <div style={{ fontSize: typography.fontSize.xs, color: colors.neutral[600] }}>
                      {timeCode.billable ? `Fakturerbar - ${timeCode.hourlyRate} kr/tim` : "Ej fakturerbar"}
                    </div>
                  </div>

                  <div style={{ marginBottom: spacing[4] }}>
                    <div style={{ fontSize: typography.fontSize['4xl'], fontWeight: typography.fontWeight.bold, color: timeCode.color }}>
                      {codeHours.toFixed(1)}h
                    </div>
                    {timeCode.billable && (
                      <div style={{ fontSize: typography.fontSize.lg, color: timeCode.color, fontWeight: typography.fontWeight.semibold }}>
                        {codeValue.toLocaleString('sv-SE')} kr
                      </div>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[3] }}>
                    <div style={{ padding: spacing[3], backgroundColor: "white", borderRadius: borderRadius.base }}>
                      <div style={{ fontSize: typography.fontSize.xs, color: colors.neutral[600], marginBottom: spacing[1] }}>Rapporter</div>
                      <div style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.neutral[900] }}>{codeReports.length}</div>
                    </div>
                    <div style={{ padding: spacing[3], backgroundColor: "white", borderRadius: borderRadius.base }}>
                      <div style={{ fontSize: typography.fontSize.xs, color: colors.neutral[600], marginBottom: spacing[1] }}>Andel</div>
                      <div style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.neutral[900] }}>
                        {totalHours > 0 ? ((codeHours / totalHours) * 100).toFixed(0) : 0}%
                      </div>
                    </div>
                  </div>

                  {codeReports.length > 0 && (
                    <div style={{ marginTop: spacing[4], padding: spacing[3], backgroundColor: "white", borderRadius: borderRadius.base }}>
                      <div style={{ fontSize: typography.fontSize.xs, color: colors.neutral[600], marginBottom: spacing[1] }}>Snitt per rapport</div>
                      <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.neutral[900] }}>
                        {(codeHours / codeReports.length).toFixed(1)}h
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ApprovalBadge component for changing approval status
function ApprovalBadge({ approved, reportId, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = React.useRef(null);

  const approvalOptions = [
    { value: true, label: "Godkänd", variant: "success", icon: <CheckCircle size={12} /> },
    { value: false, label: "Nekad", variant: "error", icon: <X size={12} /> }
  ];

  const currentOption = approvalOptions.find(opt => opt.value === approved) || approvalOptions[0];

  const handleToggle = (e) => {
    e.stopPropagation();

    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 120;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      const shouldOpenUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      setPosition({
        top: shouldOpenUpward ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
        left: rect.left,
        openUpward: shouldOpenUpward
      });
    }
    setIsOpen(!isOpen);
  };

  const handleChange = (newApproval) => {
    onChange(reportId, newApproval);
    setIsOpen(false);
  };

  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (buttonRef.current && buttonRef.current.contains(e.target)) return;
      setIsOpen(false);
    };

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
          <Badge variant={currentOption.variant} icon={currentOption.icon}>
            {currentOption.label} ▾
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
            minWidth: "150px",
            border: `1px solid ${colors.neutral[200]}`
          }}>
          {approvalOptions.map((option) => (
            <div
              key={option.label}
              onClick={() => handleChange(option.value)}
              style={{
                padding: spacing[2],
                cursor: "pointer",
                borderRadius: borderRadius.md,
                backgroundColor: approved === option.value ? colors.neutral[100] : "transparent",
                transition: "background-color 0.15s",
                display: "flex",
                alignItems: "center",
                gap: spacing[2],
                fontSize: typography.fontSize.sm,
                fontWeight: approved === option.value ? typography.fontWeight.semibold : typography.fontWeight.normal,
                color: colors.neutral[900]
              }}
              onMouseEnter={(e) => {
                if (approved !== option.value) {
                  e.currentTarget.style.backgroundColor = colors.neutral[50];
                }
              }}
              onMouseLeave={(e) => {
                if (approved !== option.value) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              {option.icon}
              {option.label}
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
