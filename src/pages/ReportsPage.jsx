import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import { useResponsive } from "../hooks/useResponsive";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  BarChart3,
  Clock,
  DollarSign,
  Users,
  Download,
  FileText,
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
import { inputStyle } from "../components/shared/styles";
import { colors, spacing, shadows, borderRadius, typography, transitions } from "../components/shared/theme";

// Dark glasmorphism card style to match NewOrder
const darkCardStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(20px)',
  borderRadius: borderRadius.xl,
  padding: spacing[8],
  marginBottom: spacing[6],
  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

// Dark input style to match NewOrder
const darkInputStyle = {
  width: "100%",
  padding: `${spacing[3]} ${spacing[4]}`,
  borderRadius: borderRadius.lg,
  border: '1px solid rgba(255, 255, 255, 0.1)',
  fontSize: typography.fontSize.base,
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  color: '#fff',
  outline: "none",
  transition: `all ${transitions.base}`,
  fontFamily: typography.fontFamily.sans,
  fontWeight: typography.fontWeight.normal,
  boxSizing: "border-box",
};

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
        backgroundColor: active ? "#60a5fa" : "rgba(15, 23, 42, 0.4)",
        color: active ? "white" : '#94a3b8',
        fontWeight: active ? typography.fontWeight.semibold : typography.fontWeight.medium,
        fontSize: typography.fontSize.base,
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = 'rgba(96, 165, 250, 0.2)';
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.4)";
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
        color: '#e2e8f0',
        marginBottom: spacing[2]
      }}>
        {label}
        {required && <span style={{ color: colors.error[500], marginLeft: spacing[1] }}>*</span>}
      </label>
      {children}
      {helper && (
        <div style={{ marginTop: spacing[1], fontSize: typography.fontSize.xs, color: '#94a3b8' }}>
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
                  color: '#fff',
                  whiteSpace: "nowrap"
                }}>
                  {item.value > 0 ? item.value.toFixed(1) : ""}
                </div>
              </div>
            </div>
            <div style={{ fontSize: typography.fontSize.xs, color: '#94a3b8', fontWeight: typography.fontWeight.medium }}>
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
              stroke="rgba(26, 26, 46, 0.5)"
              strokeWidth="2"
            />
          );
        })}
        <circle cx={centerX} cy={centerY} r="40" fill="rgba(26, 26, 46, 0.8)" />
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
            <div style={{ fontSize: typography.fontSize.sm, color: '#94a3b8' }}>
              {item.label}
            </div>
            <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: '#fff', marginLeft: "auto" }}>
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
  const { isMobile, isTablet } = useResponsive();

  // Data state
  const [timeReports, setTimeReports] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [timeCodes, setTimeCodes] = useState(DEFAULT_TIME_CODES);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  // UI state
  const [activeView, setActiveView] = useState("dashboard");
  const [timePeriod, setTimePeriod] = useState("month");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [searchTerm, setSearchTerm] = useState("");
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

  // Export filter state
  const [exportType, setExportType] = useState("pdf"); // pdf, csv, excel
  const [pdfFilterCustomer, setPdfFilterCustomer] = useState("");
  const [pdfFilterOrder, setPdfFilterOrder] = useState("");
  const [pdfFilterUser, setPdfFilterUser] = useState("");
  const [pdfShowComments, setPdfShowComments] = useState(true);
  const [pdfShowPrices, setPdfShowPrices] = useState(true);

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
          .eq('organization_id', userDetails.organizationId)
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

          // Remove duplicates based on id
          const uniqueTimeCodes = convertedTimeCodes.filter((code, index, self) =>
            index === self.findIndex((c) => c.id === code.id)
          );

          setTimeCodes(uniqueTimeCodes);
          console.log("✅ ReportsPage: Time codes fetched:", uniqueTimeCodes.length, "(duplicates removed)");
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

        // Fetch organization details
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', userDetails.organizationId)
          .single();

        if (orgError) {
          console.error("Error fetching organization:", orgError);
        } else {
          setOrganization(orgData);
          console.log("✅ ReportsPage: Organisation hämtad:", orgData.company_name);
        }

      } catch (error) {
        console.error("❌ ReportsPage: Fel vid hämtning av data:", error);
        showToast("Ett fel uppstod vid hämtning av data. Försök igen.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userDetails, toast?.message]);

  // Real-time listener for time_codes changes
  useEffect(() => {
    if (!userDetails?.organizationId) return;

    console.log('🔄 ReportsPage: Setting up real-time listener for time_codes');

    const channel = supabase
      .channel('time_codes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_codes',
          filter: `organization_id=eq.${userDetails.organizationId}`
        },
        async (payload) => {
          console.log('🔔 ReportsPage: Time codes changed:', payload);

          // Re-fetch time codes
          const { data: timeCodesData, error: timeCodesError } = await supabase
            .from('time_codes')
            .select('*')
            .eq('organization_id', userDetails.organizationId)
            .order('code', { ascending: true });

          if (!timeCodesError && timeCodesData) {
            const convertedTimeCodes = timeCodesData.map(tc => ({
              id: tc.code || tc.id,
              name: tc.name,
              color: "#3b82f6",
              billable: tc.type === 'Arbetstid',
              hourlyRate: tc.rate || 0
            }));

            const uniqueTimeCodes = convertedTimeCodes.filter((code, index, self) =>
              index === self.findIndex((c) => c.id === code.id)
            );

            setTimeCodes(uniqueTimeCodes);
            console.log("✅ ReportsPage: Time codes updated from real-time:", uniqueTimeCodes.length);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 ReportsPage: Cleaning up time_codes listener');
      supabase.removeChannel(channel);
    };
  }, [userDetails?.organizationId]);

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
          user_id: currentUser.id,
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


  // Export to CSV
  const exportToCSV = () => {
    // Apply filters
    let exportReports = filteredReports;

    if (pdfFilterCustomer) {
      exportReports = exportReports.filter(report => {
        const order = orders.find(o => o.id === report.arbetsorder);
        return order?.customerId === pdfFilterCustomer;
      });
    }

    if (pdfFilterOrder) {
      exportReports = exportReports.filter(report => report.arbetsorder === pdfFilterOrder);
    }

    if (pdfFilterUser) {
      exportReports = exportReports.filter(report => report.userId === pdfFilterUser);
    }

    if (exportReports.length === 0) {
      showToast("Inga rapporter att exportera med valda filter.", "warning");
      return;
    }

    const exportData = exportReports.map(report => {
      const order = orders.find(o => o.id === report.arbetsorder);
      const customer = order ? customers.find(c => c.id === order.customerId) : null;
      const timeCode = timeCodes.find(tc => tc.id === report.timeCode);
      return {
        'Datum': formatDate(report.datum),
        'Kund': customer?.name || '-',
        'Ordernr': order?.orderNumber || '-',
        'Ordertitel': order?.title || '-',
        'Tidkod': timeCode?.name || report.timeCodeName || 'Normal tid',
        'Timmar': report.antalTimmar,
        'Fakturerbar': report.fakturerbar !== false ? 'Ja' : 'Nej',
        'Timpris (kr, ex. moms)': report.hourlyRate || 650,
        'Värde (kr, ex. moms)': parseFloat(report.antalTimmar || 0) * (report.hourlyRate || 650),
        'Status': report.godkand ? 'Godkänd' : 'Väntande',
        'Användare': report.userName || '-',
        ...(pdfShowComments && { 'Kommentar': report.kommentar || '-' })
      };
    });

    // Convert to CSV
    const headers = Object.keys(exportData[0]).join(',');
    const rows = exportData.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tidsrapporter_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    showToast("CSV-export klar!", "success");
  };

  // Export to Excel
  const exportToExcel = () => {
    // Apply filters
    let exportReports = filteredReports;

    if (pdfFilterCustomer) {
      exportReports = exportReports.filter(report => {
        const order = orders.find(o => o.id === report.arbetsorder);
        return order?.customerId === pdfFilterCustomer;
      });
    }

    if (pdfFilterOrder) {
      exportReports = exportReports.filter(report => report.arbetsorder === pdfFilterOrder);
    }

    if (pdfFilterUser) {
      exportReports = exportReports.filter(report => report.userId === pdfFilterUser);
    }

    if (exportReports.length === 0) {
      showToast("Inga rapporter att exportera med valda filter.", "warning");
      return;
    }

    const exportData = exportReports.map(report => {
      const order = orders.find(o => o.id === report.arbetsorder);
      const customer = order ? customers.find(c => c.id === order.customerId) : null;
      const timeCode = timeCodes.find(tc => tc.id === report.timeCode);
      return {
        'Datum': formatDate(report.datum),
        'Kund': customer?.name || '-',
        'Ordernr': order?.orderNumber || '-',
        'Ordertitel': order?.title || '-',
        'Tidkod': timeCode?.name || report.timeCodeName || 'Normal tid',
        'Timmar': report.antalTimmar,
        'Fakturerbar': report.fakturerbar !== false ? 'Ja' : 'Nej',
        'Timpris (kr, ex. moms)': report.hourlyRate || 650,
        'Värde (kr, ex. moms)': parseFloat(report.antalTimmar || 0) * (report.hourlyRate || 650),
        'Status': report.godkand ? 'Godkänd' : 'Väntande',
        'Användare': report.userName || '-',
        ...(pdfShowComments && { 'Kommentar': report.kommentar || '-' })
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tidrapporter");
    XLSX.writeFile(wb, `tidrapporter_${new Date().toISOString().split('T')[0]}.xlsx`);

    showToast("Excel-export klar!", "success");
  };

  // Handle export based on selected type
  const handleExport = () => {
    switch (exportType) {
      case 'csv':
        exportToCSV();
        break;
      case 'excel':
        exportToExcel();
        break;
      case 'pdf':
      default:
        exportToPDF();
        break;
    }
  };

  // Export to PDF - Fortnox style time report
  const exportToPDF = async () => {
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

    // Check if reports are from multiple customers
    const uniqueCustomerIds = [...new Set(pdfReports.map(report => {
      const order = orders.find(o => o.id === report.arbetsorder);
      return order?.customerId;
    }).filter(Boolean))];

    const isMultipleCustomers = !pdfFilterCustomer && uniqueCustomerIds.length > 1;

    // Get customer info
    let customer;
    if (isMultipleCustomers) {
      // Multiple customers - create a virtual customer object
      customer = {
        name: 'Olika kunder',
        customer_number: '-',
        reference_person: '-'
      };
    } else {
      // Single customer - get from first report
      const firstOrder = orders.find(o => o.id === pdfReports[0].arbetsorder);
      customer = firstOrder ? customers.find(c => c.id === firstOrder.customerId) : null;

      if (!customer) {
        showToast("Kunde inte hitta kundinformation.", "error");
        return;
      }
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Calculate totals
    const totalHours = pdfReports.reduce((sum, r) => sum + parseFloat(r.antalTimmar || 0), 0);
    const subtotal = pdfReports.reduce((sum, r) => {
      if (r.fakturerbar === false) return sum;
      const hours = parseFloat(r.antalTimmar || 0);
      const rate = r.hourlyRate || 650;
      return sum + (hours * rate);
    }, 0);
    const vat = subtotal * 0.25; // 25% moms
    const total = subtotal + vat;

    // Generate report number (based on date and random)
    const reportNr = Math.floor(Math.random() * 1000);
    const today = new Date();

    // Get period dates from reports
    const sortedReports = [...pdfReports].sort((a, b) => new Date(a.datum) - new Date(b.datum));
    const periodStart = sortedReports.length > 0 ? sortedReports[0].datum : today.toISOString();
    const periodEnd = sortedReports.length > 0 ? sortedReports[sortedReports.length - 1].datum : today.toISOString();

    // ===== HEADER =====
    // Logo or Company name (top left)
    let logoHeight = 0;
    if (organization?.logo_url) {
      try {
        // Load logo image
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = organization.logo_url;
        });

        // Add logo (max height 30mm, proportional width)
        const maxLogoHeight = 30;
        const imgRatio = img.width / img.height;
        logoHeight = maxLogoHeight;
        const logoWidth = logoHeight * imgRatio;

        doc.addImage(img, 'PNG', margin, 15, logoWidth, logoHeight);
      } catch (error) {
        console.error('Error loading logo:', error);
        // Fallback to company name if logo fails
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text(organization?.company_name || 'Företaget AB', margin, 22);
      }
    } else {
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text(organization?.company_name || 'Företaget AB', margin, 22);
    }

    // "Tidsrapport" title (center)
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('Tidsrapport', pageWidth / 2, 30, { align: 'center' });

    // Report details (far right)
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const rightCol = pageWidth - margin - 45;
    doc.text('Rapportdatum', rightCol, 22);
    doc.text(formatDate(today.toISOString()), pageWidth - margin, 22, { align: 'right' });

    doc.text('Rapport-nr', rightCol, 28);
    doc.text(String(reportNr), pageWidth - margin, 28, { align: 'right' });

    doc.text('Period', rightCol, 34);
    if (periodStart === periodEnd) {
      doc.text(formatDate(periodStart), pageWidth - margin, 34, { align: 'right' });
    } else {
      doc.text(`${formatDate(periodStart)} - ${formatDate(periodEnd)}`, pageWidth - margin, 34, { align: 'right' });
    }

    // ===== CUSTOMER INFO (LEFT SIDE) =====
    let yPos = 60;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    doc.text('Kund', margin, yPos);
    doc.text(customer.name || '-', margin + 50, yPos);

    yPos += 6;
    doc.text('Kundnr', margin, yPos);
    doc.text(customer.customer_number || '-', margin + 50, yPos);

    yPos += 6;
    doc.text('Vår referens', margin, yPos);
    doc.text(organization?.our_reference || '-', margin + 50, yPos);

    yPos += 6;
    doc.text('Er referens', margin, yPos);
    doc.text(customer.reference_person || '-', margin + 50, yPos);

    yPos += 6;
    doc.text('Rapporterad av', margin, yPos);
    const reportUser = pdfFilterUser ? users.find(u => u.id === pdfFilterUser) : null;
    doc.text(reportUser?.displayName || reportUser?.email || 'Flera användare', margin + 50, yPos);

    // ===== TABLE =====
    yPos += 15;

    // Format each time report entry
    const tableData = pdfReports.map(report => {
      const timeCode = timeCodes.find(tc => tc.id === report.timeCode);
      const hours = parseFloat(report.antalTimmar || 0);
      const rate = report.hourlyRate || 650;
      const amount = report.fakturerbar !== false ? hours * rate : 0;

      // Get customer name for this report if multiple customers
      const order = orders.find(o => o.id === report.arbetsorder);
      const reportCustomer = order ? customers.find(c => c.id === order.customerId) : null;
      const customerPrefix = isMultipleCustomers && reportCustomer ? `${reportCustomer.name} - ` : '';

      // Format with comma as decimal separator
      const formatSwedish = (num) => num.toFixed(2).replace('.', ',');

      // Build description with optional comment
      const commentPart = pdfShowComments && report.kommentar ? ` - ${report.kommentar}` : '';
      const nonBillablePart = report.fakturerbar === false ? ' (ej fakturerbar)' : '';

      // Return row with or without price columns
      if (pdfShowPrices) {
        return [
          `${customerPrefix}${timeCode?.name || report.timeCodeName || 'Normal tid'}${nonBillablePart}${commentPart}`,
          formatSwedish(hours),
          formatSwedish(rate),
          formatSwedish(amount)
        ];
      } else {
        return [
          `${customerPrefix}${timeCode?.name || report.timeCodeName || 'Normal tid'}${nonBillablePart}${commentPart}`,
          formatSwedish(hours)
        ];
      }
    });

    // Draw gray line above table header
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);

    // Configure table headers and columns based on pdfShowPrices
    const tableHeaders = pdfShowPrices
      ? [['Benämning', 'Timmar', 'Å-pris', 'Summa']]
      : [['Benämning', 'Timmar']];

    const columnStyles = pdfShowPrices
      ? {
          0: { cellWidth: 90, halign: 'left' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 35, halign: 'center' },
          3: { cellWidth: 35, halign: 'center' }
        }
      : {
          0: { cellWidth: 140, halign: 'left' },
          1: { cellWidth: 45, halign: 'center' }
        };

    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: yPos,
      theme: 'plain',
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
        0: { halign: 'left' }  // Keep first column left-aligned in header
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [0, 0, 0],
        fillColor: [255, 255, 255]
      },
      columnStyles: columnStyles,
      styles: {
        lineWidth: 0,
        cellPadding: 2
      },
      didDrawCell: (data) => {
        // Draw gray line below header
        if (data.section === 'head' && data.row.index === 0) {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.5);
          doc.line(margin, data.cell.y + data.cell.height, pageWidth - margin, data.cell.y + data.cell.height);
        }
      }
    });

    // ===== TOTALS (ABOVE FOOTER) =====
    const footerLineY = pageHeight - 35;
    const totalsY = footerLineY - 12;

    // Helper for Swedish number format
    const formatSwedishNumber = (num) => num.toFixed(2).replace('.', ',');

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    if (pdfShowPrices) {
      // Show all price-related totals
      // Left: Moms
      doc.text('Moms', margin, totalsY);
      doc.setFont(undefined, 'bold');
      doc.text(`${formatSwedishNumber(vat)} kr`, margin, totalsY + 6);

      // Center: Total belopp
      doc.setFont(undefined, 'normal');
      doc.text('Total belopp', pageWidth / 2, totalsY, { align: 'center' });
      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.text(`SEK ${formatSwedishNumber(total)}`, pageWidth / 2, totalsY + 6, { align: 'center' });

      // Right: Totalt rapporterade timmar
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text('Totalt rapporterade timmar', pageWidth - margin, totalsY, { align: 'right' });
      doc.setFont(undefined, 'bold');
      doc.text(`${formatSwedishNumber(totalHours)} h`, pageWidth - margin, totalsY + 6, { align: 'right' });
    } else {
      // Only show total hours (right-aligned)
      doc.text('Totalt rapporterade timmar', pageWidth - margin, totalsY, { align: 'right' });
      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.text(`${formatSwedishNumber(totalHours)} h`, pageWidth - margin, totalsY + 6, { align: 'right' });
    }

    // ===== GRAY LINE BEFORE FOOTER =====
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.5);
    doc.line(margin, footerLineY, pageWidth - margin, footerLineY);

    // ===== FOOTER =====
    const footerY = footerLineY + 5;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');

    // Left column - Address
    let footerTextY = footerY;
    doc.text('Adress', margin, footerTextY);
    footerTextY += 5;
    doc.text(organization?.company_name || 'Företaget AB', margin, footerTextY);
    footerTextY += 5;
    if (organization?.address) {
      doc.text(organization.address, margin, footerTextY);
      footerTextY += 5;
    }
    if (organization?.zip_code || organization?.city) {
      doc.text(`${organization?.zip_code || ''} ${organization?.city || ''}`.trim(), margin, footerTextY);
      footerTextY += 5;
    }
    if (organization?.country) {
      doc.text(organization.country, margin, footerTextY);
    } else {
      doc.text('Sverige', margin, footerTextY);
    }

    // Middle column - Contact
    footerTextY = footerY;
    const midCol = margin + 70;
    doc.text('Telefon', midCol, footerTextY);
    footerTextY += 5;
    doc.text(organization?.phone || '-', midCol, footerTextY);
    footerTextY += 10;
    doc.text('E-post', midCol, footerTextY);
    footerTextY += 5;
    doc.text(organization?.email || '-', midCol, footerTextY);

    // Right column - Organization number
    footerTextY = footerY;
    const rightFooterCol = pageWidth - margin - 60;
    doc.text('Organisationsnr', rightFooterCol, footerTextY);
    footerTextY += 5;
    doc.text(organization?.org_nr || '-', rightFooterCol, footerTextY);

    // Page number (bottom right corner)
    doc.text('Sida 1(1)', pageWidth - margin, pageHeight - 5, { align: 'right' });

    doc.save(`tidsrapport_${reportNr}_${customer.name.replace(/\s+/g, '_')}.pdf`);
    showToast("Tidsrapport exporterad!", "success");
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
      padding: isMobile ? spacing[4] : 0,
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
      <div style={{ marginBottom: isMobile ? spacing[6] : spacing[8] }}>
        <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", flexWrap: "wrap", gap: spacing[4], flexDirection: isMobile ? "column" : "row" }}>
          <div>
            <h1 style={{
              fontSize: typography.fontSize['4xl'],
              fontWeight: typography.fontWeight.bold,
              color: '#fff',
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: spacing[3]
            }}>
              <BarChart3 size={32} color={colors.primary[500]} />
              Rapporter & Analys
            </h1>
            <p style={{
              color: '#94a3b8',
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
            color: '#94a3b8'
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
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: borderRadius.lg,
                  cursor: "pointer",
                  backgroundColor: timePeriod === period && !dateRange.start ? "#60a5fa" : 'rgba(15, 23, 42, 0.4)',
                  color: timePeriod === period && !dateRange.start ? "white" : '#94a3b8',
                  fontWeight: typography.fontWeight.semibold,
                  fontSize: typography.fontSize.sm,
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  if (!(timePeriod === period && !dateRange.start)) {
                    e.currentTarget.style.backgroundColor = 'rgba(96, 165, 250, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(timePeriod === period && !dateRange.start)) {
                    e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.4)';
                  }
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
              style={{ ...darkInputStyle, width: "auto", padding: spacing[2] }}
            />
            <span style={{ color: '#94a3b8' }}>-</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              style={{ ...darkInputStyle, width: "auto", padding: spacing[2] }}
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
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(20px)',
        borderRadius: borderRadius.xl,
        padding: spacing[2],
        marginBottom: spacing[6],
        boxShadow: "0 25px 50px rgba(0, 0, 0, 0.3)",
        border: '1px solid rgba(255, 255, 255, 0.1)',
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
          Export
        </TabButton>
      </div>

      {/* Report Time View */}
      {activeView === "report" && (
        <div className="card-enter" style={darkCardStyle}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: spacing[3],
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.semibold,
            color: '#fff',
            marginBottom: spacing[6],
            paddingBottom: spacing[4],
            borderBottom: '2px solid rgba(255, 255, 255, 0.1)'
          }}>
            <FilePlus size={20} color={colors.primary[500]} />
            <span>Rapportera ny tid</span>
          </div>

          {loading ? (
            <div style={{
              textAlign: "center",
              padding: spacing[12],
              color: '#94a3b8'
            }}>
              <Clock size={48} style={{ marginBottom: spacing[4], opacity: 0.5, animation: "spin 2s linear infinite" }} />
              <p style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.medium }}>Laddar data...</p>
            </div>
          ) : orders.length === 0 ? (
            <div style={{
              padding: spacing[8],
              backgroundColor: 'rgba(251, 146, 60, 0.1)',
              border: `2px solid ${colors.warning[500]}`,
              borderRadius: borderRadius.lg,
              marginBottom: spacing[4]
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: spacing[3], marginBottom: spacing[4] }}>
                <AlertCircle size={24} color={colors.warning[400]} />
                <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: '#fff' }}>
                  Inga arbetsordrar tillgängliga
                </div>
              </div>
              <p style={{ color: '#e2e8f0', marginBottom: spacing[4] }}>
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
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: spacing[6], marginBottom: spacing[6] }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <FormField label="Arbetsorder" required>
                    <select
                      name="arbetsorder"
                      value={form.arbetsorder}
                      onChange={handleChange}
                      required
                      style={darkInputStyle}
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
                  style={darkInputStyle}
                />
              </FormField>

              <FormField label="Tidkod" required>
                <select
                  name="timeCode"
                  value={form.timeCode}
                  onChange={handleChange}
                  style={darkInputStyle}
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
                  style={darkInputStyle}
                />
              </FormField>

              <FormField label="Sluttid" helper="Valfritt - beräknar automatiskt timmar">
                <input
                  type="time"
                  name="slutTid"
                  value={form.slutTid}
                  onChange={handleChange}
                  style={darkInputStyle}
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
                  style={darkInputStyle}
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
                  <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: '#e2e8f0' }}>
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
                    style={{ ...darkInputStyle, resize: "vertical" }}
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

      {/* Export View */}
      {activeView === "export" && (
        <div className="card-enter" style={darkCardStyle}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: spacing[3],
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.semibold,
            color: '#fff',
            marginBottom: spacing[6],
            paddingBottom: spacing[4],
            borderBottom: '2px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Download size={20} color={colors.error[500]} />
            <span>Exportera rapporter</span>
          </div>

          <div style={{ marginBottom: spacing[8] }}>
            <p style={{ color: '#94a3b8', marginBottom: spacing[4] }}>
              Välj exportformat och filtrera rapporter. Du kan exportera till PDF, CSV eller Excel.
            </p>

            <div style={{
              display: 'flex',
              gap: spacing[3],
              marginBottom: spacing[6],
              padding: spacing[2],
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: borderRadius.lg,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <button
                onClick={() => setExportType('pdf')}
                style={{
                  flex: 1,
                  padding: `${spacing[3]} ${spacing[4]}`,
                  borderRadius: borderRadius.lg,
                  border: exportType === 'pdf' ? `2px solid ${colors.error[500]}` : '2px solid transparent',
                  backgroundColor: exportType === 'pdf' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  color: exportType === 'pdf' ? colors.error[500] : '#94a3b8',
                  fontSize: typography.fontSize.sm,
                  fontWeight: exportType === 'pdf' ? typography.fontWeight.semibold : typography.fontWeight.normal,
                  cursor: 'pointer',
                  transition: `all ${transitions.base}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: spacing[1]
                }}
                onMouseEnter={(e) => {
                  if (exportType !== 'pdf') {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (exportType !== 'pdf') {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#94a3b8';
                  }
                }}
              >
                <span style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold }}>PDF</span>
                <span style={{ fontSize: typography.fontSize.xs, opacity: 0.7 }}>Professionell tidsrapport</span>
              </button>

              <button
                onClick={() => setExportType('csv')}
                style={{
                  flex: 1,
                  padding: `${spacing[3]} ${spacing[4]}`,
                  borderRadius: borderRadius.lg,
                  border: exportType === 'csv' ? `2px solid ${colors.primary[500]}` : '2px solid transparent',
                  backgroundColor: exportType === 'csv' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  color: exportType === 'csv' ? colors.primary[500] : '#94a3b8',
                  fontSize: typography.fontSize.sm,
                  fontWeight: exportType === 'csv' ? typography.fontWeight.semibold : typography.fontWeight.normal,
                  cursor: 'pointer',
                  transition: `all ${transitions.base}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: spacing[1]
                }}
                onMouseEnter={(e) => {
                  if (exportType !== 'csv') {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (exportType !== 'csv') {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#94a3b8';
                  }
                }}
              >
                <span style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold }}>CSV</span>
                <span style={{ fontSize: typography.fontSize.xs, opacity: 0.7 }}>Kommaseparerade värden</span>
              </button>

              <button
                onClick={() => setExportType('excel')}
                style={{
                  flex: 1,
                  padding: `${spacing[3]} ${spacing[4]}`,
                  borderRadius: borderRadius.lg,
                  border: exportType === 'excel' ? `2px solid ${colors.success[500]}` : '2px solid transparent',
                  backgroundColor: exportType === 'excel' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  color: exportType === 'excel' ? colors.success[500] : '#94a3b8',
                  fontSize: typography.fontSize.sm,
                  fontWeight: exportType === 'excel' ? typography.fontWeight.semibold : typography.fontWeight.normal,
                  cursor: 'pointer',
                  transition: `all ${transitions.base}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: spacing[1]
                }}
                onMouseEnter={(e) => {
                  if (exportType !== 'excel') {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (exportType !== 'excel') {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#94a3b8';
                  }
                }}
              >
                <span style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold }}>Excel</span>
                <span style={{ fontSize: typography.fontSize.xs, opacity: 0.7 }}>Kalkylblad (.xlsx)</span>
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: spacing[4], marginBottom: spacing[6] }}>
              <FormField label="Filtrera per kund">
                <select
                  value={pdfFilterCustomer}
                  onChange={(e) => {
                    setPdfFilterCustomer(e.target.value);
                    setPdfFilterOrder(""); // Reset order when customer changes
                  }}
                  style={darkInputStyle}
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
                  style={darkInputStyle}
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
                  style={darkInputStyle}
                >
                  <option value="">Alla användare</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.displayName || user.email}
                    </option>
                  ))}
                </select>
              </FormField>

              <div style={{ padding: spacing[4] }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  cursor: 'pointer',
                  color: '#fff',
                  marginBottom: spacing[3]
                }}>
                  <input
                    type="checkbox"
                    checked={pdfShowComments}
                    onChange={(e) => setPdfShowComments(e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      accentColor: colors.primary[500]
                    }}
                  />
                  <span style={{ fontSize: typography.fontSize.sm }}>Visa kommentarer</span>
                </label>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  cursor: 'pointer',
                  color: '#fff'
                }}>
                  <input
                    type="checkbox"
                    checked={pdfShowPrices}
                    onChange={(e) => setPdfShowPrices(e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      accentColor: colors.primary[500]
                    }}
                  />
                  <span style={{ fontSize: typography.fontSize.sm }}>Visa priser</span>
                </label>
              </div>
            </div>

            <div style={{
              padding: spacing[4],
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: borderRadius.lg,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: spacing[6]
            }}>
              <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: '#fff', marginBottom: spacing[2] }}>
                Förhandsvisning av export
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: spacing[3] }}>
                <div>
                  <div style={{ fontSize: typography.fontSize.xs, color: '#94a3b8' }}>Period</div>
                  <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: '#fff' }}>{getPeriodLabel()}</div>
                </div>
                <div>
                  <div style={{ fontSize: typography.fontSize.xs, color: '#94a3b8' }}>Antal rapporter</div>
                  <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: '#fff' }}>
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
                    <div style={{ fontSize: typography.fontSize.xs, color: '#94a3b8' }}>Vald kund</div>
                    <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: '#fff' }}>
                      {customers.find(c => c.id === pdfFilterCustomer)?.name}
                    </div>
                  </div>
                )}
                {pdfFilterOrder && (
                  <div>
                    <div style={{ fontSize: typography.fontSize.xs, color: '#94a3b8' }}>Vald order</div>
                    <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: '#fff' }}>
                      #{orders.find(o => o.id === pdfFilterOrder)?.orderNumber}
                    </div>
                  </div>
                )}
                {pdfFilterUser && (
                  <div>
                    <div style={{ fontSize: typography.fontSize.xs, color: '#94a3b8' }}>Vald användare</div>
                    <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: '#fff' }}>
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
                onClick={handleExport}
                icon={<Download size={18} />}
                variant="danger"
              >
                {exportType === 'pdf' ? 'Generera PDF' : exportType === 'csv' ? 'Exportera CSV' : 'Exportera Excel'}
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard View */}
      {activeView === "dashboard" && (
        <div className="fade-in">
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(500px, 1fr))", gap: spacing[6], marginBottom: spacing[6] }}>
            <div className="card-enter" style={darkCardStyle}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: spacing[3],
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.semibold,
                color: '#fff',
                marginBottom: spacing[6],
                paddingBottom: spacing[4],
                borderBottom: '2px solid rgba(255, 255, 255, 0.1)'
              }}>
                <Activity size={20} color={colors.primary[500]} />
                <span>Timmar senaste 7 dagarna</span>
              </div>
              <BarChart data={last7DaysData} maxValue={maxDailyHours} color={colors.primary[500]} />
            </div>

            <div className="card-enter" style={darkCardStyle}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: spacing[3],
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.semibold,
                color: '#fff',
                marginBottom: spacing[6],
                paddingBottom: spacing[4],
                borderBottom: '2px solid rgba(255, 255, 255, 0.1)'
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
                <div style={{ textAlign: "center", padding: spacing[8], color: '#94a3b8' }}>
                  Ingen data att visa för vald period
                </div>
              )}
            </div>
          </div>

          <div className="card-enter" style={darkCardStyle}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[3],
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.semibold,
              color: '#fff',
              marginBottom: spacing[6],
              paddingBottom: spacing[4],
              borderBottom: '2px solid rgba(255, 255, 255, 0.1)'
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
                  <div style={{ fontSize: typography.fontSize.xs, color: '#94a3b8' }}>
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
        <div className="card-enter" style={darkCardStyle}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: spacing[3],
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.semibold,
            color: '#fff',
            marginBottom: spacing[6],
            paddingBottom: spacing[4],
            borderBottom: '2px solid rgba(255, 255, 255, 0.1)'
          }}>
            <FileText size={20} color={colors.primary[500]} />
            <span>Alla tidrapporter</span>
          </div>

          <div style={{ display: "flex", gap: spacing[4], marginBottom: spacing[6], flexWrap: "wrap" }}>
            <div style={{ flex: isMobile ? "1 1 100%" : "1", minWidth: isMobile ? "0" : "250px" }}>
              <div style={{ position: "relative" }}>
                <Search size={18} style={{ position: "absolute", left: spacing[3], top: "50%", transform: "translateY(-50%)", color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Sök efter kund, order, kommentar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ ...darkInputStyle, paddingLeft: spacing[10] }}
                />
              </div>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ ...darkInputStyle, width: isMobile ? "100%" : "auto", minWidth: isMobile ? "0" : "150px", flex: isMobile ? "1 1 100%" : "0 0 auto" }}
            >
              <option value="all">Alla statusar</option>
              <option value="approved">Godkända</option>
              <option value="pending">Väntande</option>
            </select>

            <select
              value={filterBillable}
              onChange={(e) => setFilterBillable(e.target.value)}
              style={{ ...darkInputStyle, width: isMobile ? "100%" : "auto", minWidth: isMobile ? "0" : "150px", flex: isMobile ? "1 1 100%" : "0 0 auto" }}
            >
              <option value="all">Alla typer</option>
              <option value="billable">Fakturerbar</option>
              <option value="internal">Intern</option>
            </select>

            <select
              value={selectedTimeCode}
              onChange={(e) => setSelectedTimeCode(e.target.value)}
              style={{ ...darkInputStyle, width: isMobile ? "100%" : "auto", minWidth: isMobile ? "0" : "150px", flex: isMobile ? "1 1 100%" : "0 0 auto" }}
            >
              <option value="all">Alla tidkoder</option>
              {timeCodes.map(code => (
                <option key={code.id} value={code.id}>{code.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: spacing[4], fontSize: typography.fontSize.sm, color: '#94a3b8' }}>
            Visar {filteredReports.length} av {timeReports.length} rapporter
          </div>

          {filteredReports.length === 0 ? (
            <div style={{ textAlign: "center", padding: spacing[12], color: '#94a3b8' }}>
              <FileText size={48} style={{ marginBottom: spacing[4], opacity: 0.5 }} />
              <p style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.medium }}>Inga rapporter hittades</p>
              <p style={{ fontSize: typography.fontSize.base }}>Försök ändra dina filterinställningar</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>
                    <th style={{ padding: spacing[3], textAlign: "left", fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: '#94a3b8' }}>Datum</th>
                    <th style={{ padding: spacing[3], textAlign: "left", fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: '#94a3b8' }}>Kund</th>
                    <th style={{ padding: spacing[3], textAlign: "left", fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: '#94a3b8' }}>Order</th>
                    <th style={{ padding: spacing[3], textAlign: "left", fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: '#94a3b8' }}>Tidkod</th>
                    <th style={{ padding: spacing[3], textAlign: "right", fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: '#94a3b8' }}>Timmar</th>
                    <th style={{ padding: spacing[3], textAlign: "right", fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: '#94a3b8' }}>Värde</th>
                    <th style={{ padding: spacing[3], textAlign: "left", fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: '#94a3b8' }}>Status</th>
                    <th style={{ padding: spacing[3], textAlign: "left", fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: '#94a3b8' }}>Användare</th>
                    <th style={{ padding: spacing[3], textAlign: "center", fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: '#94a3b8' }}></th>
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
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            backgroundColor: isExpanded ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                            transition: "background-color 0.2s ease"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isExpanded ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)'}
                        >
                          <td style={{ padding: spacing[3], fontSize: typography.fontSize.sm, color: '#fff' }}>
                            {formatDate(report.datum)}
                          </td>
                          <td style={{ padding: spacing[3], fontSize: typography.fontSize.sm, color: '#fff' }}>
                            {customer?.name || "Okänd kund"}
                          </td>
                          <td style={{ padding: spacing[3], fontSize: typography.fontSize.sm, color: '#fff' }}>
                            #{order?.orderNumber || report.arbetsorder?.substring(0, 8) || "N/A"}
                          </td>
                          <td style={{ padding: spacing[3] }}>
                            <Badge variant="neutral">
                              {timeCode?.name || report.timeCodeName || "Normal tid"}
                            </Badge>
                          </td>
                          <td style={{ padding: spacing[3], textAlign: "right", fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: '#fff' }}>
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
                          <td style={{ padding: spacing[3], fontSize: typography.fontSize.sm, color: '#94a3b8' }}>
                            {report.userName || "-"}
                          </td>
                          <td style={{ padding: spacing[3], textAlign: "center" }}>
                            <button
                              onClick={() => setExpandedRows(prev => ({ ...prev, [report.id]: !prev[report.id] }))}
                              style={{
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                                color: '#94a3b8',
                                padding: spacing[1]
                              }}
                            >
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <td colSpan="9" style={{ padding: spacing[4] }}>
                              {editingReport === report.id ? (
                                // Editing mode
                                <div>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing[4] }}>
                                    <div style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: '#fff' }}>
                                      Redigera tidrapport
                                    </div>
                                    <button
                                      onClick={handleCancelEdit}
                                      style={{
                                        border: "none",
                                        background: "none",
                                        cursor: "pointer",
                                        color: '#94a3b8',
                                        padding: spacing[1]
                                      }}
                                    >
                                      <X size={20} />
                                    </button>
                                  </div>

                                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: spacing[4], marginBottom: spacing[4] }}>
                                    <FormField label="Arbetsorder" required>
                                      <select
                                        name="arbetsorder"
                                        value={editForm.arbetsorder}
                                        onChange={handleEditChange}
                                        required
                                        style={darkInputStyle}
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
                                        style={darkInputStyle}
                                      />
                                    </FormField>

                                    <FormField label="Tidkod" required>
                                      <select
                                        name="timeCode"
                                        value={editForm.timeCode}
                                        onChange={handleEditChange}
                                        style={darkInputStyle}
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
                                        style={darkInputStyle}
                                      />
                                    </FormField>

                                    <FormField label="Starttid">
                                      <input
                                        type="time"
                                        name="startTid"
                                        value={editForm.startTid}
                                        onChange={handleEditChange}
                                        style={darkInputStyle}
                                      />
                                    </FormField>

                                    <FormField label="Sluttid">
                                      <input
                                        type="time"
                                        name="slutTid"
                                        value={editForm.slutTid}
                                        onChange={handleEditChange}
                                        style={darkInputStyle}
                                      />
                                    </FormField>

                                    <div style={{ gridColumn: "1 / -1" }}>
                                      <FormField label="Kommentar">
                                        <textarea
                                          name="kommentar"
                                          value={editForm.kommentar}
                                          onChange={handleEditChange}
                                          rows={3}
                                          style={{ ...darkInputStyle, resize: "vertical" }}
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
                                        <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: '#e2e8f0' }}>
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
                                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: spacing[4], marginBottom: spacing[4] }}>
                                    <div>
                                      <div style={{ fontSize: typography.fontSize.xs, color: '#94a3b8', marginBottom: spacing[1] }}>Ordertitel</div>
                                      <div style={{ fontSize: typography.fontSize.sm, color: '#fff', fontWeight: typography.fontWeight.medium }}>{order?.title || "Ingen titel"}</div>
                                    </div>
                                    {report.startTid && report.slutTid && (
                                      <div>
                                        <div style={{ fontSize: typography.fontSize.xs, color: '#94a3b8', marginBottom: spacing[1] }}>Arbetstid</div>
                                        <div style={{ fontSize: typography.fontSize.sm, color: '#fff', fontWeight: typography.fontWeight.medium }}>{report.startTid} - {report.slutTid}</div>
                                      </div>
                                    )}
                                    {report.kommentar && (
                                      <div style={{ gridColumn: "1 / -1" }}>
                                        <div style={{ fontSize: typography.fontSize.xs, color: '#94a3b8', marginBottom: spacing[1] }}>Kommentar</div>
                                        <div style={{ fontSize: typography.fontSize.sm, color: '#cbd5e1', fontStyle: "italic", padding: spacing[2], backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: borderRadius.base }}>
                                          "{report.kommentar}"
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div style={{ display: "flex", gap: spacing[3], justifyContent: "flex-end", paddingTop: spacing[2], borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
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
        <div className="card-enter" style={darkCardStyle}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: spacing[3],
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.semibold,
            color: '#fff',
            marginBottom: spacing[6],
            paddingBottom: spacing[4],
            borderBottom: '2px solid rgba(255, 255, 255, 0.1)'
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
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: borderRadius.lg,
                  marginBottom: spacing[4],
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: spacing[4] }}>
                  <div>
                    <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: '#fff', marginBottom: spacing[1] }}>
                      {customer.name}
                    </div>
                    <div style={{ fontSize: typography.fontSize.sm, color: '#94a3b8' }}>
                      {customerReports.length} rapport{customerReports.length !== 1 ? "er" : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold, color: '#fff' }}>
                      {customerHours.toFixed(1)}h
                    </div>
                    <div style={{ fontSize: typography.fontSize.sm, color: colors.success[600], fontWeight: typography.fontWeight.semibold }}>
                      {customerValue.toLocaleString('sv-SE')} kr
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: spacing[3] }}>
                  <div style={{ padding: spacing[3], backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: borderRadius.base }}>
                    <div style={{ fontSize: typography.fontSize.xs, color: '#94a3b8', marginBottom: spacing[1] }}>Fakturerbart</div>
                    <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colors.success[600] }}>{customerBillableHours.toFixed(1)}h</div>
                  </div>
                  <div style={{ padding: spacing[3], backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: borderRadius.base }}>
                    <div style={{ fontSize: typography.fontSize.xs, color: '#94a3b8', marginBottom: spacing[1] }}>Internt</div>
                    <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: '#94a3b8' }}>{(customerHours - customerBillableHours).toFixed(1)}h</div>
                  </div>
                  <div style={{ padding: spacing[3], backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: borderRadius.base }}>
                    <div style={{ fontSize: typography.fontSize.xs, color: '#94a3b8', marginBottom: spacing[1] }}>Arbetsorder</div>
                    <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colors.primary[600] }}>{customerOrders.length}</div>
                  </div>
                  <div style={{ padding: spacing[3], backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: borderRadius.base }}>
                    <div style={{ fontSize: typography.fontSize.xs, color: '#94a3b8', marginBottom: spacing[1] }}>Snitt/order</div>
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
        <div className="card-enter" style={darkCardStyle}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: spacing[3],
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.semibold,
            color: '#fff',
            marginBottom: spacing[6],
            paddingBottom: spacing[4],
            borderBottom: '2px solid rgba(255, 255, 255, 0.1)'
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
                    <div style={{ fontSize: typography.fontSize.xs, color: '#94a3b8' }}>
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

                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: spacing[3] }}>
                    <div style={{ padding: spacing[3], backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: borderRadius.base }}>
                      <div style={{ fontSize: typography.fontSize.xs, color: '#94a3b8', marginBottom: spacing[1] }}>Rapporter</div>
                      <div style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: '#fff' }}>{codeReports.length}</div>
                    </div>
                    <div style={{ padding: spacing[3], backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: borderRadius.base }}>
                      <div style={{ fontSize: typography.fontSize.xs, color: '#94a3b8', marginBottom: spacing[1] }}>Andel</div>
                      <div style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: '#fff' }}>
                        {totalHours > 0 ? ((codeHours / totalHours) * 100).toFixed(0) : 0}%
                      </div>
                    </div>
                  </div>

                  {codeReports.length > 0 && (
                    <div style={{ marginTop: spacing[4], padding: spacing[3], backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: borderRadius.base }}>
                      <div style={{ fontSize: typography.fontSize.xs, color: '#94a3b8', marginBottom: spacing[1] }}>Snitt per rapport</div>
                      <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: '#fff' }}>
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
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: borderRadius.lg,
            boxShadow: shadows.lg,
            padding: spacing[2],
            zIndex: 9999,
            minWidth: "150px",
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
          {approvalOptions.map((option) => (
            <div
              key={option.label}
              onClick={() => handleChange(option.value)}
              style={{
                padding: spacing[2],
                cursor: "pointer",
                borderRadius: borderRadius.md,
                backgroundColor: approved === option.value ? 'rgba(255, 255, 255, 0.15)' : "transparent",
                transition: "background-color 0.15s",
                display: "flex",
                alignItems: "center",
                gap: spacing[2],
                fontSize: typography.fontSize.sm,
                fontWeight: approved === option.value ? typography.fontWeight.semibold : typography.fontWeight.normal,
                color: '#fff'
              }}
              onMouseEnter={(e) => {
                if (approved !== option.value) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
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
