import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
  query,
  where,
  orderBy,
  deleteDoc
} from "firebase/firestore";
import * as XLSX from 'xlsx';
import {
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Edit3,
  Trash2,
  X,
  Save,
  Search,
  ArrowLeft,
  DollarSign,
  Download,
  PlayCircle,
  StopCircle,
  PauseCircle,
  Users,
  Filter,
  BarChart3,
  CheckSquare,
  Grid3x3,
  List
} from "lucide-react";

// Styles
const cardStyle = {
  backgroundColor: "white",
  borderRadius: "12px",
  padding: "1.5rem",
  marginBottom: "1.5rem",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  border: "1px solid #e2e8f0"
};

const sectionHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  fontSize: "1.1rem",
  fontWeight: "600",
  color: "#0f172a",
  marginBottom: "1.5rem",
  paddingBottom: "0.75rem",
  borderBottom: "2px solid #f1f5f9"
};

const inputStyle = {
  width: "100%",
  padding: "0.75rem",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  fontSize: "0.95rem",
  color: "#0f172a",
  outline: "none",
  transition: "all 0.2s ease",
  backgroundColor: "white",
  fontFamily: "inherit"
};

const buttonStyle = {
  padding: "0.75rem 1.5rem",
  borderRadius: "8px",
  border: "none",
  fontWeight: "600",
  fontSize: "0.95rem",
  cursor: "pointer",
  transition: "all 0.2s ease",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  justifyContent: "center"
};

// Time codes configuration
const TIME_CODES = [
  { id: "normal", name: "Normal tid", color: "#3b82f6", billable: true },
  { id: "overtime", name: "Övertid", color: "#f59e0b", billable: true },
  { id: "oncall", name: "Jour", color: "#8b5cf6", billable: true },
  { id: "travel", name: "Restid", color: "#06b6d4", billable: true },
  { id: "internal", name: "Intern tid", color: "#64748b", billable: false },
  { id: "vacation", name: "Semester", color: "#10b981", billable: false },
  { id: "sick", name: "Sjuk", color: "#ef4444", billable: false }
];

// Helper Components
function TabButton({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.75rem 1.25rem",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        backgroundColor: active ? "#3b82f6" : "transparent",
        color: active ? "white" : "#64748b",
        fontWeight: active ? "600" : "500",
        fontSize: "0.95rem",
        transition: "all 0.2s ease"
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = "#f8fafc";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = "transparent";
        }
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function FormField({ label, required, children, helper }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{
        display: "block",
        fontSize: "0.875rem",
        fontWeight: "600",
        color: "#374151",
        marginBottom: "0.5rem"
      }}>
        {label}
        {required && <span style={{ color: "#ef4444", marginLeft: "0.25rem" }}>*</span>}
      </label>
      {children}
      {helper && (
        <div style={{ marginTop: "0.25rem", fontSize: "0.75rem", color: "#64748b" }}>
          {helper}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color, subValue, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
      ...cardStyle,
      display: "flex",
      alignItems: "center",
      gap: "1rem",
        marginBottom: 0,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease"
    }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
        }
      }}
    >
      <div style={{
        width: "56px",
        height: "56px",
        borderRadius: "12px",
        backgroundColor: `${color}15`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        {React.cloneElement(icon, { size: 28, color: color })}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.25rem" }}>
          {label}
        </div>
        <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a" }}>
          {value}
        </div>
        {subValue && (
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
            {subValue}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RapporteraTid() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userDetails, currentUser } = useAuth();

  const [form, setForm] = useState({
    arbetsorder: id || "",
    datum: new Date().toISOString().split('T')[0],
    startTid: "",
    slutTid: "",
    antalTimmar: "",
    timeCode: "normal",
    fakturerbar: true,
    kommentar: ""
  });

  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState({});
  const [tidsrapporter, setTidsrapporter] = useState([]);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [editingReportId, setEditingReportId] = useState(null);
  const [activeView, setActiveView] = useState("form"); // "form", "reports", "week", "calendar"
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [timePeriod, setTimePeriod] = useState("week");
  const [selectedReports, setSelectedReports] = useState([]);
  const [viewMode, setViewMode] = useState("list"); // "list" or "grid"

  // Timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStart, setTimerStart] = useState(null);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedTime, setPausedTime] = useState(0);

  // Date range for custom filtering
  const [dateRange, setDateRange] = useState({
    start: "",
    end: ""
  });

  const HOURLY_RATE = 650; // Updated rate

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE');
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Timer effect
  useEffect(() => {
    let interval;
    if (isTimerRunning && !isPaused) {
      interval = setInterval(() => {
        setTimerElapsed(Math.floor((Date.now() - timerStart) / 1000) + pausedTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, isPaused, timerStart, pausedTime]);

  const startTimer = () => {
    setIsTimerRunning(true);
    setTimerStart(Date.now());
    setTimerElapsed(0);
    setPausedTime(0);
    setIsPaused(false);
  };

  const pauseTimer = () => {
    if (!isPaused) {
      setPausedTime(timerElapsed);
      setIsPaused(true);
    } else {
      setTimerStart(Date.now());
      setIsPaused(false);
    }
  };

  const stopTimer = () => {
    const hours = (timerElapsed / 3600).toFixed(2);
    setForm(prev => ({ ...prev, antalTimmar: hours }));
    setIsTimerRunning(false);
    setTimerElapsed(0);
    setPausedTime(0);
    setIsPaused(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!userDetails?.organizationId) return;

      try {
        // Fetch orders
        const orderQuery = query(
          collection(db, "orders"),
          where("organizationId", "==", userDetails.organizationId)
        );
        const orderSnapshot = await getDocs(orderQuery);

        // Fetch customers
        const customerQuery = query(
          collection(db, "customers"),
          where("organizationId", "==", userDetails.organizationId)
        );
        const customerSnapshot = await getDocs(customerQuery);

        const customersMap = {};
        customerSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          customersMap[doc.id] = data.name || data.namn || "Okänd kund";
        });
        setCustomers(customersMap);

        const orderList = orderSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            ordernummer: data.orderNumber || doc.id,
            kundnamn: customersMap[data.customerId] || "Okänd kund"
          };
        });
        setOrders(orderList);

        // Fetch time reports
        const rapportQuery = id
          ? query(
              collection(db, "tidsrapporteringar"),
              where("arbetsorder", "==", id),
              where("organizationId", "==", userDetails.organizationId),
              orderBy("timestamp", "desc")
            )
          : query(
              collection(db, "tidsrapporteringar"),
              where("organizationId", "==", userDetails.organizationId),
              orderBy("timestamp", "desc")
            );

        const rapportSnapshot = await getDocs(rapportQuery);
        const rapportList = rapportSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setTidsrapporter(rapportList);
      } catch (err) {
        console.error("Fel vid hämtning:", err);
        setError("Kunde inte hämta data. Kontrollera din anslutning.");
      }
    };

    fetchData();
  }, [success, id, userDetails]);

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
    setSuccess(null);
    setError(null);
    try {
      const timeCodeInfo = TIME_CODES.find(tc => tc.id === form.timeCode);

      if (editingReportId) {
        const rapportRef = doc(db, "tidsrapporteringar", editingReportId);
        await updateDoc(rapportRef, {
          ...form,
          timeCodeName: timeCodeInfo?.name || "Normal tid",
          timeCodeColor: timeCodeInfo?.color || "#3b82f6"
        });
        setSuccess("Tidsrapporten har uppdaterats.");
        cancelEdit();
      } else {
        if (!userDetails?.organizationId) {
          setError("Du måste vara inloggad för att rapportera tid.");
          return;
        }
        await addDoc(collection(db, "tidsrapporteringar"), {
          ...form,
          organizationId: userDetails.organizationId,
          userId: currentUser.uid,
          userName: userDetails.displayName || userDetails.email || "Användare",
          godkand: false,
          timeCodeName: timeCodeInfo?.name || "Normal tid",
          timeCodeColor: timeCodeInfo?.color || "#3b82f6",
          timestamp: Timestamp.now()
        });
        setSuccess("Tiden har rapporterats.");
        setForm({
          arbetsorder: id || "",
          datum: new Date().toISOString().split('T')[0],
          startTid: "",
          slutTid: "",
          antalTimmar: "",
          timeCode: "normal",
          fakturerbar: true,
          kommentar: ""
        });
      }
    } catch (err) {
      console.error("Fel vid submit:", err);
      setError("Ett fel uppstod. Försök igen.");
    }
  };

  const godkannTid = async (reportId) => {
    try {
      const rapportRef = doc(db, "tidsrapporteringar", reportId);
      await updateDoc(rapportRef, { godkand: true });
      setSuccess("Rapport godkänd.");
    } catch (err) {
      setError("Kunde inte godkänna rapporten.");
    }
  };

  const batchApprove = async () => {
    if (selectedReports.length === 0) return;

    try {
      for (const reportId of selectedReports) {
        const rapportRef = doc(db, "tidsrapporteringar", reportId);
        await updateDoc(rapportRef, { godkand: true });
      }
      setSuccess(`${selectedReports.length} rapporter godkända.`);
      setSelectedReports([]);
    } catch (err) {
      setError("Kunde inte godkänna rapporterna.");
    }
  };

  const startEdit = (rapport) => {
    setEditingReportId(rapport.id);
    setForm({
      arbetsorder: rapport.arbetsorder,
      datum: rapport.datum,
      startTid: rapport.startTid || "",
      slutTid: rapport.slutTid || "",
      antalTimmar: rapport.antalTimmar,
      timeCode: rapport.timeCode || "normal",
      fakturerbar: rapport.fakturerbar !== false,
      kommentar: rapport.kommentar
    });
    setSuccess(null);
    setError(null);
    setActiveView("form");
  };

  const cancelEdit = () => {
    setEditingReportId(null);
    setForm({
      arbetsorder: id || "",
      datum: new Date().toISOString().split('T')[0],
      startTid: "",
      slutTid: "",
      antalTimmar: "",
      timeCode: "normal",
      fakturerbar: true,
      kommentar: ""
    });
    setSuccess(null);
    setError(null);
  };

  const angraGodkannande = async (reportId) => {
    try {
      const rapportRef = doc(db, "tidsrapporteringar", reportId);
      await updateDoc(rapportRef, { godkand: false });
      setSuccess("Godkännande ångrat.");
    } catch (err) {
      setError("Kunde inte ångra godkännandet.");
    }
  };

  const taBortRapport = async (reportId) => {
    if (window.confirm("Är du säker på att du vill ta bort denna tidrapport?")) {
      try {
        const rapportRef = doc(db, "tidsrapporteringar", reportId);
        await deleteDoc(rapportRef);
        setSuccess("Rapporten har tagits bort.");
        setSelectedReports(prev => prev.filter(id => id !== reportId));
      } catch (err) {
        setError("Kunde inte ta bort rapporten.");
      }
    }
  };

  const exportToExcel = () => {
    const exportData = filteredReports.map(rapport => {
      const order = orders.find(o => o.id === rapport.arbetsorder);
      const timeCode = TIME_CODES.find(tc => tc.id === rapport.timeCode);
      return {
        'Datum': formatDate(rapport.datum),
        'Arbetsorder': order?.ordernummer || '-',
        'Kund': order?.kundnamn || '-',
        'Titel': order?.title || '-',
        'Timmar': rapport.antalTimmar,
        'Tidkod': timeCode?.name || 'Normal tid',
        'Fakturerbar': rapport.fakturerbar !== false ? 'Ja' : 'Nej',
        'Värde (kr)': parseFloat(rapport.antalTimmar || 0) * HOURLY_RATE,
        'Status': rapport.godkand ? 'Godkänd' : 'Väntande',
        'Användare': rapport.userName || '-',
        'Kommentar': rapport.kommentar || '-'
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tidrapporter");
    XLSX.writeFile(wb, `tidrapporter_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Filter reports by time period for statistics
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
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        return reports.filter(r => {
          const reportDate = new Date(r.datum);
          return reportDate >= weekStart && reportDate <= weekEnd;
        });

      case "month":
        return reports.filter(r => {
          const reportDate = new Date(r.datum);
          return reportDate.getMonth() === now.getMonth() &&
                 reportDate.getFullYear() === now.getFullYear();
        });

      case "all":
      default:
        return reports;
    }
  };

  // Calculate statistics
  const periodReports = getDateRangeReports(tidsrapporter);
  const billableReports = periodReports.filter(r => r.fakturerbar !== false);
  const totalHours = periodReports.reduce((sum, r) => sum + parseFloat(r.antalTimmar || 0), 0);
  const billableHours = billableReports.reduce((sum, r) => sum + parseFloat(r.antalTimmar || 0), 0);
  const totalValue = billableHours * HOURLY_RATE;
  const approvedReports = periodReports.filter(r => r.godkand).length;
  const pendingReports = periodReports.filter(r => !r.godkand).length;

  // Get period label
  const getPeriodLabel = () => {
    if (dateRange.start && dateRange.end) {
      return `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;
    }
    switch (timePeriod) {
      case "today": return "Idag";
      case "week": return "Denna vecka";
      case "month": return "Denna månad";
      case "all": return "Totalt";
      default: return "Totalt";
    }
  };

  // Filter reports
  const filteredReports = tidsrapporter.filter(rapport => {
    const matchesStatus =
      filterStatus === "all" ? true :
      filterStatus === "approved" ? rapport.godkand :
      filterStatus === "pending" ? !rapport.godkand :
      filterStatus === "billable" ? rapport.fakturerbar !== false :
      filterStatus === "internal" ? rapport.fakturerbar === false : true;

    const order = orders.find(o => o.id === rapport.arbetsorder);
    const searchString = `${order?.ordernummer || ""} ${order?.title || ""} ${order?.kundnamn || ""} ${rapport.kommentar || ""} ${rapport.userName || ""}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());

    // Date range filter
    let matchesDateRange = true;
    if (dateRange.start && dateRange.end) {
      const reportDate = new Date(rapport.datum);
      matchesDateRange = reportDate >= new Date(dateRange.start) && reportDate <= new Date(dateRange.end);
    }

    return matchesStatus && matchesSearch && matchesDateRange;
  });

  // Toggle report selection
  const toggleReportSelection = (reportId) => {
    setSelectedReports(prev =>
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  return (
    <div style={{
      maxWidth: "1400px",
      margin: "0 auto",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {id && (
              <button
                onClick={() => navigate(`/orders/${id}`)}
                style={{
                  ...buttonStyle,
                  backgroundColor: "white",
                  color: "#64748b",
                  border: "1px solid #e2e8f0",
                  padding: "0.65rem 1rem"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "white";
                }}
              >
                <ArrowLeft size={18} />
                Tillbaka till order
              </button>
            )}
            <div>
              <h1 style={{
                fontSize: "2rem",
                fontWeight: "700",
                color: "#0f172a",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "0.75rem"
              }}>
                <Clock size={32} color="#3b82f6" />
                Tidrapportering
              </h1>
              <p style={{ color: "#64748b", fontSize: "0.9rem", margin: "0.25rem 0 0 0", paddingLeft: "2.75rem" }}>
                {id ? `Tidrapportering för order #${orders.find(o => o.id === id)?.ordernummer || id.substring(0, 8)}` : "Hantera alla tidrapporter"}
              </p>
            </div>
          </div>

          {/* Timer Widget */}
          <div style={{
            ...cardStyle,
            marginBottom: 0,
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            padding: "1rem 1.5rem"
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem" }}>
                Timer
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", fontFamily: "monospace" }}>
                {formatTime(timerElapsed)}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {!isTimerRunning ? (
                <button
                  onClick={startTimer}
                  style={{
                    ...buttonStyle,
                    backgroundColor: "#10b981",
                    color: "white",
                    padding: "0.5rem 1rem"
                  }}
                  title="Starta timer"
                >
                  <PlayCircle size={18} />
                  Start
                </button>
              ) : (
                <>
                  <button
                    onClick={pauseTimer}
                    style={{
                      ...buttonStyle,
                      backgroundColor: "#f59e0b",
                      color: "white",
                      padding: "0.5rem 1rem"
                    }}
                    title={isPaused ? "Återuppta" : "Pausa"}
                  >
                    <PauseCircle size={18} />
                    {isPaused ? "Återuppta" : "Pausa"}
                  </button>
                  <button
                    onClick={stopTimer}
                    style={{
                      ...buttonStyle,
                      backgroundColor: "#ef4444",
                      color: "white",
                      padding: "0.5rem 1rem"
                    }}
                    title="Stoppa och använd tid"
                  >
                    <StopCircle size={18} />
                    Stoppa
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Time Period Filter and Export */}
      <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#64748b" }}>Period:</span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {["today", "week", "month", "all"].map(period => (
              <button
                key={period}
                onClick={() => {
                  setTimePeriod(period);
                  setDateRange({ start: "", end: "" });
                }}
                style={{
                  padding: "0.5rem 1rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  cursor: "pointer",
                  backgroundColor: timePeriod === period && !dateRange.start ? "#3b82f6" : "white",
                  color: timePeriod === period && !dateRange.start ? "white" : "#64748b",
                  fontWeight: "600",
                  fontSize: "0.875rem",
                  transition: "all 0.2s ease"
                }}
              >
                {period === "today" ? "Idag" : period === "week" ? "Vecka" : period === "month" ? "Månad" : "Alla"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              style={{ ...inputStyle, width: "auto", padding: "0.5rem" }}
            />
            <span style={{ color: "#64748b" }}>-</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              style={{ ...inputStyle, width: "auto", padding: "0.5rem" }}
            />
          </div>
        </div>

        <button
          onClick={exportToExcel}
          style={{
            ...buttonStyle,
            backgroundColor: "#10b981",
            color: "white"
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#059669"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#10b981"}
        >
          <Download size={18} />
          Exportera till Excel
        </button>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <StatCard
          icon={<Clock />}
          label={`${getPeriodLabel()} - Timmar`}
          value={totalHours.toFixed(1)}
          color="#3b82f6"
          subValue={`${billableHours.toFixed(1)}h fakturerbar`}
        />
        <StatCard
          icon={<DollarSign />}
          label={`${getPeriodLabel()} - Värde`}
          value={`${totalValue.toLocaleString('sv-SE')} kr`}
          color="#10b981"
          subValue={`${HOURLY_RATE} kr/tim`}
        />
        <StatCard
          icon={<CheckCircle />}
          label="Status"
          value={approvedReports}
          color="#10b981"
          subValue={`${pendingReports} väntande`}
          onClick={() => setFilterStatus(filterStatus === "pending" ? "all" : "pending")}
        />
        <StatCard
          icon={<TrendingUp />}
          label="Snitt per rapport"
          value={periodReports.length > 0 ? (totalHours / periodReports.length).toFixed(1) : "0.0"}
          color="#f59e0b"
          subValue={`${periodReports.length} rapporter`}
        />
      </div>

      {/* Tabs Navigation */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "0.5rem",
        marginBottom: "1.5rem",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        display: "inline-flex",
        gap: "0.5rem"
      }}>
        <TabButton
          active={activeView === "form"}
          onClick={() => setActiveView("form")}
          icon={<FileText size={18} />}
        >
          {editingReportId ? "Redigera" : "Ny rapport"}
        </TabButton>
        <TabButton
          active={activeView === "reports"}
          onClick={() => setActiveView("reports")}
          icon={<List size={18} />}
        >
          Alla rapporter
        </TabButton>
        <TabButton
          active={activeView === "week"}
          onClick={() => setActiveView("week")}
          icon={<Calendar size={18} />}
        >
          Veckoöversikt
        </TabButton>
      </div>

      {activeView === "form" && (
        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <FileText size={20} color="#3b82f6" />
            <span>{editingReportId ? "Redigera tidrapport" : "Rapportera ny tid"}</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <FormField label="Arbetsorder" required>
                  <select
                    name="arbetsorder"
                    value={form.arbetsorder}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                    disabled={Boolean(id) && !editingReportId}
                  >
                    <option value="">Välj arbetsorder</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>
                        #{order.ordernummer} – {order.title || "(Ingen titel)"} ({order.kundnamn})
                      </option>
                    ))}
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
                  {TIME_CODES.map(code => (
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

              <div style={{ display: "flex", alignItems: "center", marginTop: "1.5rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    name="fakturerbar"
                    checked={form.fakturerbar}
                    onChange={handleChange}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>
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

            {/* Calculated value display */}
            {form.antalTimmar && form.fakturerbar && (
              <div style={{
                padding: "1rem",
                backgroundColor: "#f0f9ff",
                border: "1px solid #3b82f6",
                borderRadius: "8px",
                marginBottom: "1rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span style={{ color: "#0369a1", fontWeight: "600" }}>
                  Beräknat värde:
                </span>
                <span style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0369a1" }}>
                  {(parseFloat(form.antalTimmar) * HOURLY_RATE).toLocaleString('sv-SE')} kr
                </span>
              </div>
            )}

            {success && (
              <div style={{
                backgroundColor: "#d1fae5",
                border: "1px solid #10b981",
                color: "#065f46",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <CheckCircle size={18} />
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div style={{
                backgroundColor: "#fee2e2",
                border: "1px solid #ef4444",
                color: "#991b1b",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
              {editingReportId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  style={{
                    ...buttonStyle,
                    backgroundColor: "white",
                    color: "#64748b",
                    border: "1px solid #e2e8f0"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                >
                  <X size={18} />
                  Avbryt
                </button>
              )}
              <button
                type="submit"
                style={{
                  ...buttonStyle,
                  background: editingReportId ? "#10b981" : "#3b82f6",
                  color: "#fff",
                  padding: "0.75rem 2rem",
                  boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {editingReportId ? <><Save size={18} /> Spara ändringar</> : <><Clock size={18} /> Rapportera tid</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeView === "reports" && (
        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <Clock size={20} color="#3b82f6" />
            <span>Tidrapporter</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
                style={{
                  ...buttonStyle,
                  backgroundColor: "white",
                  color: "#64748b",
                  border: "1px solid #e2e8f0",
                  padding: "0.5rem 1rem"
                }}
              >
                {viewMode === "list" ? <Grid3x3 size={18} /> : <List size={18} />}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <div style={{ flex: "1", minWidth: "250px" }}>
              <div style={{ position: "relative" }}>
                <Search size={18} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                <input
                  type="text"
                  placeholder="Sök efter order, kund, användare, kommentar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    ...inputStyle,
                    paddingLeft: "2.5rem"
                  }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {[
                { id: "all", label: "Alla", count: tidsrapporter.length },
                { id: "approved", label: "Godkända", count: approvedReports },
                { id: "pending", label: "Väntande", count: pendingReports },
                { id: "billable", label: "Fakturerbar", count: tidsrapporter.filter(r => r.fakturerbar !== false).length },
                { id: "internal", label: "Intern", count: tidsrapporter.filter(r => r.fakturerbar === false).length }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setFilterStatus(filter.id)}
                  style={{
                    padding: "0.75rem 1.25rem",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    cursor: "pointer",
                    backgroundColor: filterStatus === filter.id ?
                      (filter.id === "approved" ? "#10b981" : filter.id === "pending" ? "#f59e0b" : "#3b82f6") :
                      "white",
                    color: filterStatus === filter.id ? "white" : "#64748b",
                    fontWeight: "600",
                    fontSize: "0.875rem",
                    transition: "all 0.2s ease",
                    whiteSpace: "nowrap"
                  }}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </div>

          {/* Batch Actions */}
          {selectedReports.length > 0 && (
            <div style={{
              padding: "1rem",
              backgroundColor: "#f0f9ff",
              border: "1px solid #3b82f6",
              borderRadius: "8px",
              marginBottom: "1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span style={{ color: "#0369a1", fontWeight: "600" }}>
                {selectedReports.length} rapport{selectedReports.length > 1 ? "er" : ""} valda
              </span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={batchApprove}
                  style={{
                    ...buttonStyle,
                    backgroundColor: "#10b981",
                    color: "white",
                    padding: "0.5rem 1rem"
                  }}
                >
                  <CheckSquare size={18} />
                  Godkänn alla
                </button>
                <button
                  onClick={() => setSelectedReports([])}
                  style={{
                    ...buttonStyle,
                    backgroundColor: "white",
                    color: "#64748b",
                    border: "1px solid #e2e8f0",
                    padding: "0.5rem 1rem"
                  }}
                >
                  <X size={18} />
                  Avmarkera
                </button>
              </div>
            </div>
          )}

          {/* Reports List/Grid */}
          {filteredReports.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "3rem",
              color: "#64748b"
            }}>
              <Clock size={48} style={{ marginBottom: "1rem", opacity: 0.5 }} />
              <p style={{ fontSize: "1.1rem", fontWeight: "500" }}>Inga tidrapporter hittades</p>
              <p style={{ fontSize: "0.9rem" }}>
                {searchTerm || filterStatus !== "all"
                  ? "Försök ändra dina filterinställningar"
                  : "Skapa din första tidrapport genom att fylla i formuläret"}
              </p>
            </div>
          ) : (
            <div style={{
              display: viewMode === "grid" ? "grid" : "flex",
              gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(350px, 1fr))" : undefined,
              flexDirection: viewMode === "list" ? "column" : undefined,
              gap: "1rem"
            }}>
              {filteredReports.map((rapport) => {
                const order = orders.find((o) => o.id === rapport.arbetsorder);
                const timeCodeInfo = TIME_CODES.find(tc => tc.id === rapport.timeCode);
                const isSelected = selectedReports.includes(rapport.id);

                return (
                  <div
                    key={rapport.id}
                    style={{
                      padding: "1.25rem",
                      backgroundColor: isSelected ? "#f0f9ff" : "#f8fafc",
                      borderRadius: "8px",
                      border: `1px solid ${isSelected ? "#3b82f6" : "#e2e8f0"}`,
                      transition: "all 0.2s ease",
                      cursor: "pointer"
                    }}
                    onClick={() => toggleReportSelection(rapport.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#cbd5e1";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isSelected ? "#3b82f6" : "#e2e8f0";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.75rem" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "0.25rem 0.75rem",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            backgroundColor: rapport.godkand ? "#d1fae5" : "#fef3c7",
                            color: rapport.godkand ? "#065f46" : "#92400e"
                          }}>
                            {rapport.godkand ? "Godkänd" : "Väntande"}
                          </span>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "0.25rem 0.75rem",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            backgroundColor: `${timeCodeInfo?.color || "#3b82f6"}15`,
                            color: timeCodeInfo?.color || "#3b82f6"
                          }}>
                            {timeCodeInfo?.name || "Normal tid"}
                          </span>
                          {rapport.fakturerbar === false && (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "0.25rem 0.75rem",
                              borderRadius: "6px",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              backgroundColor: "#f1f5f9",
                              color: "#64748b"
                            }}>
                              Intern
                            </span>
                          )}
                        </div>
                        <div style={{ fontWeight: "600", color: "#0f172a", marginBottom: "0.25rem" }}>
                          AO #{order?.ordernummer || rapport.arbetsorder.substring(0,5)}
                        </div>
                        <div style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                          {order?.kundnamn || "Okänd kund"}
                        </div>
                        {order?.title && (
                          <div style={{ fontSize: "0.875rem", color: "#475569", marginBottom: "0.5rem" }}>
                            {order.title}
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a" }}>
                          {rapport.antalTimmar}h
                        </div>
                        {rapport.fakturerbar !== false && (
                          <div style={{ fontSize: "0.875rem", color: "#10b981", fontWeight: "600" }}>
                            {(parseFloat(rapport.antalTimmar || 0) * HOURLY_RATE).toLocaleString('sv-SE')} kr
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.875rem", color: "#64748b", marginBottom: "0.75rem" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Calendar size={14} />
                        {formatDate(rapport.datum)}
                      </span>
                      {rapport.startTid && rapport.slutTid && (
                        <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <Clock size={14} />
                          {rapport.startTid} - {rapport.slutTid}
                        </span>
                      )}
                      {rapport.userName && (
                        <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <Users size={14} />
                          {rapport.userName}
                        </span>
                      )}
                    </div>

                    {rapport.kommentar && (
                      <div style={{ marginBottom: "0.75rem", fontSize: "0.875rem", color: "#475569", fontStyle: "italic", padding: "0.5rem", backgroundColor: "white", borderRadius: "6px" }}>
                        "{rapport.kommentar}"
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }} onClick={(e) => e.stopPropagation()}>
                      {rapport.godkand ? (
                        <>
                          <button
                            onClick={() => angraGodkannande(rapport.id)}
                            style={{
                              ...buttonStyle,
                              padding: "0.5rem 0.75rem",
                              backgroundColor: "#f59e0b",
                              color: "white",
                              fontSize: "0.85rem"
                            }}
                            title="Ångra godkännande"
                          >
                            Ångra
                          </button>
                          <button
                            onClick={() => taBortRapport(rapport.id)}
                            style={{
                              ...buttonStyle,
                              padding: "0.5rem",
                              backgroundColor: "#ef4444",
                              color: "white"
                            }}
                            title="Ta bort"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => godkannTid(rapport.id)}
                            style={{
                              ...buttonStyle,
                              padding: "0.5rem 0.75rem",
                              backgroundColor: "#10b981",
                              color: "white",
                              fontSize: "0.85rem"
                            }}
                          >
                            <CheckCircle size={14} />
                            Godkänn
                          </button>
                          <button
                            onClick={() => startEdit(rapport)}
                            style={{
                              ...buttonStyle,
                              padding: "0.5rem",
                              backgroundColor: "#3b82f6",
                              color: "white"
                            }}
                            title="Redigera"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => taBortRapport(rapport.id)}
                            style={{
                              ...buttonStyle,
                              padding: "0.5rem",
                              backgroundColor: "#ef4444",
                              color: "white"
                            }}
                            title="Ta bort"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeView === "week" && (
        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <BarChart3 size={20} color="#3b82f6" />
            <span>Veckoöversikt</span>
          </div>

          {/* Week summary by time code */}
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#0f172a", marginBottom: "1rem" }}>
              Fördelning per tidkod
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              {TIME_CODES.map(timeCode => {
                const codeReports = periodReports.filter(r => r.timeCode === timeCode.id);
                const codeHours = codeReports.reduce((sum, r) => sum + parseFloat(r.antalTimmar || 0), 0);

                if (codeHours === 0) return null;

                return (
                  <div
                    key={timeCode.id}
                    style={{
                      padding: "1rem",
                      backgroundColor: `${timeCode.color}10`,
                      border: `2px solid ${timeCode.color}`,
                      borderRadius: "8px"
                    }}
                  >
                    <div style={{ fontSize: "0.875rem", color: timeCode.color, fontWeight: "600", marginBottom: "0.5rem" }}>
                      {timeCode.name}
                    </div>
                    <div style={{ fontSize: "1.75rem", fontWeight: "700", color: timeCode.color }}>
                      {codeHours.toFixed(1)}h
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                      {codeReports.length} rapport{codeReports.length !== 1 ? "er" : ""}
                    </div>
                    {timeCode.billable && (
                      <div style={{ fontSize: "0.875rem", color: timeCode.color, fontWeight: "600", marginTop: "0.5rem" }}>
                        {(codeHours * HOURLY_RATE).toLocaleString('sv-SE')} kr
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily breakdown */}
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#0f172a", marginBottom: "1rem" }}>
              Daglig fördelning
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[...Array(7)].map((_, index) => {
                const date = new Date();
                date.setDate(date.getDate() - date.getDay() + 1 + index); // Monday = 1
                const dateStr = date.toISOString().split('T')[0];
                const dayReports = periodReports.filter(r => r.datum === dateStr);
                const dayHours = dayReports.reduce((sum, r) => sum + parseFloat(r.antalTimmar || 0), 0);
                const dayValue = dayReports.filter(r => r.fakturerbar !== false).reduce((sum, r) => sum + parseFloat(r.antalTimmar || 0) * HOURLY_RATE, 0);

                return (
                  <div
                    key={dateStr}
                    style={{
                      padding: "1rem",
                      backgroundColor: dayHours > 0 ? "#f8fafc" : "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "600", color: "#0f172a" }}>
                        {date.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'short' })}
                      </div>
                      {dayReports.length > 0 && (
                        <div style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.25rem" }}>
                          {dayReports.length} rapport{dayReports.length !== 1 ? "er" : ""}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "1.25rem", fontWeight: "700", color: dayHours > 0 ? "#0f172a" : "#cbd5e1" }}>
                          {dayHours.toFixed(1)}h
                        </div>
                        {dayValue > 0 && (
                          <div style={{ fontSize: "0.875rem", color: "#10b981", fontWeight: "600" }}>
                            {dayValue.toLocaleString('sv-SE')} kr
                          </div>
                        )}
                      </div>
                      {/* Visual bar */}
                      <div style={{ width: "100px", height: "8px", backgroundColor: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{
                          width: `${Math.min((dayHours / 10) * 100, 100)}%`,
                          height: "100%",
                          backgroundColor: "#3b82f6",
                          transition: "width 0.3s ease"
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
