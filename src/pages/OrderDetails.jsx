import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { doc, getDoc, deleteDoc, updateDoc, collection, getDocs, query, where, addDoc, Timestamp } from "firebase/firestore";
import {
  FileText,
  User,
  DollarSign,
  X,
  Save,
  Edit3,
  Trash2,
  Briefcase,
  ArrowLeft,
  Clock,
  Plus,
  CheckCircle,
  AlertCircle
} from "lucide-react";

// Import shared components
import FormField from "../components/shared/FormField";
import InfoRow from "../components/shared/InfoRow";
import ActionButton from "../components/shared/ActionButton";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import Badge from "../components/shared/Badge";
import Toast from "../components/shared/Toast";
import {
  cardStyle,
  sectionHeaderStyle,
  inputStyle,
  colors,
  spacing,
  shadows,
  borderRadius,
  typography,
  transitions
} from "../components/shared/styles";

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

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userDetails, currentUser } = useAuth();
  const [order, setOrder] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Time reporting state
  const [timeCodes, setTimeCodes] = useState(DEFAULT_TIME_CODES);
  const [timeReports, setTimeReports] = useState([]);
  const [showTimeReportForm, setShowTimeReportForm] = useState(false);
  const [editingTimeReport, setEditingTimeReport] = useState(null);
  const [timeForm, setTimeForm] = useState({
    datum: new Date().toISOString().split('T')[0],
    startTid: "",
    slutTid: "",
    antalTimmar: "",
    timeCode: "normal",
    fakturerbar: true,
    kommentar: ""
  });
  const [timeSuccess, setTimeSuccess] = useState(null);
  const [timeError, setTimeError] = useState(null);

  // Toast state for alerts
  const [toast, setToast] = useState(null);

  // Fetch order and customers on mount
  useEffect(() => {
    let isMounted = true;

    const fetchOrder = async () => {
      if (!isMounted || !userDetails?.organizationId) return;

      try {
        const ref = doc(db, "orders", id);
        const snapshot = await getDoc(ref);
        if (snapshot.exists()) {
          setOrder({ id: snapshot.id, ...snapshot.data() });
        } else {
          setToast({ message: "Arbetsorder hittades inte.", type: "error" });
          setTimeout(() => navigate("/dashboard"), 2000);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      }
    };
    fetchOrder();

    const fetchCustomers = async () => {
      if (!isMounted || !userDetails?.organizationId) return;

      try {
        const q = query(
          collection(db, "customers"),
          where("organizationId", "==", userDetails.organizationId)
        );
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCustomers(list);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };
    fetchCustomers();

    const fetchTimeCodes = async () => {
      if (!isMounted || !userDetails?.organizationId) return;

      try {
        const settingsRef = doc(db, "settings", userDetails.organizationId);
        const settingsDoc = await getDoc(settingsRef);
        if (settingsDoc.exists() && settingsDoc.data().timeCodes) {
          setTimeCodes(settingsDoc.data().timeCodes);
        }
      } catch (error) {
        console.error("Error fetching time codes:", error);
      }
    };
    fetchTimeCodes();

    const fetchTimeReports = async () => {
      if (!isMounted || !userDetails?.organizationId || !id) return;

      try {
        const q = query(
          collection(db, "tidsrapporteringar"),
          where("organizationId", "==", userDetails.organizationId),
          where("arbetsorder", "==", id)
        );
        const snapshot = await getDocs(q);
        const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTimeReports(reports.sort((a, b) => new Date(b.datum) - new Date(a.datum)));
      } catch (error) {
        console.error("Error fetching time reports:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTimeReports();

    return () => {
      isMounted = false;
    };
  }, [id, navigate, userDetails]);

  const handleDelete = async () => {
    if (window.confirm("Är du säker på att du vill radera denna arbetsorder?")) {
      try {
        await deleteDoc(doc(db, "orders", id));
        setToast({ message: "Arbetsorder raderad.", type: "success" });
        setTimeout(() => navigate("/dashboard"), 1500);
      } catch (error) {
        setToast({ message: "Kunde inte radera arbetsorder.", type: "error" });
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOrder((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSave = async () => {
    try {
      const ref = doc(db, "orders", id);
      await updateDoc(ref, order);
      setToast({ message: "Arbetsorder uppdaterad.", type: "success" });
      setIsEditing(false);
    } catch (error) {
      setToast({ message: "Kunde inte uppdatera arbetsorder.", type: "error" });
    }
  };

  const handleQuickStatusChange = async (newStatus) => {
    try {
      const ref = doc(db, "orders", id);
      const updateData = { status: newStatus };

      // If status is "Full fakturerad", automatically mark as closed
      if (newStatus === "Full fakturerad" || newStatus === "Avslutad") {
        updateData.closed = true;
        updateData.closedAt = new Date().toISOString();
      } else {
        updateData.closed = false;
        updateData.closedAt = null;
      }

      await updateDoc(ref, updateData);
      setOrder(prev => ({ ...prev, ...updateData }));
      setToast({ message: `Status uppdaterad till: ${newStatus}`, type: "success" });
    } catch (error) {
      setToast({ message: "Kunde inte uppdatera status.", type: "error" });
      console.error("Error updating status:", error);
    }
  };

  // Validation function for time form
  const validateTimeForm = () => {
    // Check if end time is after start time
    if (timeForm.startTid && timeForm.slutTid) {
      const start = new Date(`2000-01-01T${timeForm.startTid}`);
      const end = new Date(`2000-01-01T${timeForm.slutTid}`);
      if (end <= start) {
        setTimeError("Sluttid måste vara efter starttid");
        setTimeout(() => setTimeError(null), 3000);
        return false;
      }
    }

    // Check for negative hours
    if (parseFloat(timeForm.antalTimmar) <= 0) {
      setTimeError("Antal timmar måste vara större än 0");
      setTimeout(() => setTimeError(null), 3000);
      return false;
    }

    return true;
  };

  // Time reporting handlers
  const handleTimeChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "startTid" || name === "slutTid") {
      setTimeForm(prev => {
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
      setTimeForm({ ...timeForm, [name]: type === "checkbox" ? checked : value });
    }
  };

  const refreshTimeReports = async () => {
    try {
      const q = query(
        collection(db, "tidsrapporteringar"),
        where("organizationId", "==", userDetails.organizationId),
        where("arbetsorder", "==", id)
      );
      const snapshot = await getDocs(q);
      const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTimeReports(reports.sort((a, b) => new Date(b.datum) - new Date(a.datum)));
    } catch (error) {
      console.error("Error refreshing time reports:", error);
    }
  };

  const handleTimeSubmit = async (e) => {
    e.preventDefault();
    setTimeSuccess(null);
    setTimeError(null);

    if (!validateTimeForm()) {
      return;
    }

    try {
      const timeCodeInfo = timeCodes.find(tc => tc.id === timeForm.timeCode);

      if (!userDetails?.organizationId) {
        setTimeError("Du måste vara inloggad för att rapportera tid.");
        return;
      }

      if (editingTimeReport) {
        // Update existing time report
        await updateDoc(doc(db, "tidsrapporteringar", editingTimeReport.id), {
          ...timeForm,
          timeCodeName: timeCodeInfo?.name || "Normal tid",
          timeCodeColor: timeCodeInfo?.color || "#3b82f6",
          hourlyRate: timeCodeInfo?.hourlyRate || 650,
        });
        setTimeSuccess("Tidsrapporten har uppdaterats!");
        setEditingTimeReport(null);
      } else {
        // Create new time report
        await addDoc(collection(db, "tidsrapporteringar"), {
          ...timeForm,
          arbetsorder: id,
          organizationId: userDetails.organizationId,
          userId: currentUser.uid,
          userName: userDetails.displayName || userDetails.email || "Användare",
          godkand: false,
          timeCodeName: timeCodeInfo?.name || "Normal tid",
          timeCodeColor: timeCodeInfo?.color || "#3b82f6",
          hourlyRate: timeCodeInfo?.hourlyRate || 650,
          timestamp: Timestamp.now()
        });
        setTimeSuccess("Tiden har rapporterats!");
      }

      // Reset form
      setTimeForm({
        datum: new Date().toISOString().split('T')[0],
        startTid: "",
        slutTid: "",
        antalTimmar: "",
        timeCode: "normal",
        fakturerbar: true,
        kommentar: ""
      });

      // Refresh time reports
      await refreshTimeReports();

      setTimeout(() => {
        setTimeSuccess(null);
        setShowTimeReportForm(false);
      }, 2000);
    } catch (err) {
      console.error("Fel vid tidsrapportering:", err);
      setTimeError("Ett fel uppstod. Försök igen.");
      setTimeout(() => setTimeError(null), 3000);
    }
  };

  const handleEditTimeReport = (report) => {
    setTimeForm({
      datum: report.datum,
      startTid: report.startTid || "",
      slutTid: report.slutTid || "",
      antalTimmar: report.antalTimmar,
      timeCode: report.timeCode,
      fakturerbar: report.fakturerbar !== false,
      kommentar: report.kommentar || ""
    });
    setEditingTimeReport(report);
    setShowTimeReportForm(true);
  };

  const handleDeleteTimeReport = async (reportId) => {
    if (!window.confirm("Är du säker på att du vill radera denna tidsrapport?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "tidsrapporteringar", reportId));
      setTimeSuccess("Tidsrapporten har raderats!");
      await refreshTimeReports();
      setTimeout(() => setTimeSuccess(null), 2000);
    } catch (error) {
      console.error("Error deleting time report:", error);
      setTimeError("Kunde inte radera tidsrapporten");
      setTimeout(() => setTimeError(null), 3000);
    }
  };

  if (loading || !order) {
    return <LoadingSpinner message="Laddar arbetsorder..." />;
  }

  return (
    <div className="page-enter" style={{
      maxWidth: "1200px",
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: spacing[4] }}>
          <div style={{ display: "flex", alignItems: "center", gap: spacing[4] }}>
            <ActionButton
              onClick={() => navigate("/dashboard")}
              icon={<ArrowLeft size={18} />}
              color={colors.neutral[500]}
              hoverColor={colors.neutral[600]}
            >
              Tillbaka
            </ActionButton>
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
                <FileText size={32} color={colors.primary[500]} />
                Arbetsorder #{order.orderNumber}
              </h1>
              <p style={{
                color: colors.neutral[500],
                fontSize: typography.fontSize.base,
                margin: `${spacing[1]} 0 0 0`,
                paddingLeft: "2.75rem"
              }}>
                {order.title || "Ingen titel"}
              </p>
            </div>
          </div>

          {/* Quick Status Changer */}
          <div style={{ display: "flex", alignItems: "center", gap: spacing[3] }}>
            <label style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.neutral[600]
            }}>
              Status:
            </label>
            <select
              value={order.status}
              onChange={(e) => handleQuickStatusChange(e.target.value)}
              style={{
                ...inputStyle,
                minWidth: "200px",
                padding: `${spacing[2]} ${spacing[4]}`,
                fontWeight: typography.fontWeight.semibold,
                fontSize: typography.fontSize.base,
                cursor: "pointer",
                backgroundColor:
                  order.status === "Pågående" ? colors.primary[50] :
                  order.status === "Klar för fakturering" ? colors.success[50] :
                  order.status === "Full fakturerad" ? colors.success[100] :
                  order.status === "Planerad" ? colors.warning[50] :
                  colors.neutral[50],
                color:
                  order.status === "Pågående" ? colors.primary[700] :
                  order.status === "Klar för fakturering" ? colors.success[700] :
                  order.status === "Full fakturerad" ? colors.success[800] :
                  order.status === "Planerad" ? colors.warning[700] :
                  colors.neutral[700],
                borderColor:
                  order.status === "Pågående" ? colors.primary[300] :
                  order.status === "Klar för fakturering" ? colors.success[300] :
                  order.status === "Full fakturerad" ? colors.success[400] :
                  order.status === "Planerad" ? colors.warning[300] :
                  colors.neutral[300],
              }}
            >
              <option value="Ej påbörjad">Ej påbörjad</option>
              <option value="Planerad">Planerad</option>
              <option value="Pågående">Pågående</option>
              <option value="Klar för fakturering">Klar för fakturering</option>
              <option value="Full fakturerad">Full fakturerad (Avslutas)</option>
              <option value="Avslutad">Avslutad</option>
            </select>
          </div>
        </div>
      </div>

      {/* Order Details */}
      {isEditing ? (
        // EDITING MODE FOR ORDER DETAILS
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[6] }}>
          <div className="card-enter hover-lift" style={cardStyle}>
            <div style={sectionHeaderStyle}>
              <User size={20} color={colors.primary[500]} />
              <span>Kundinformation</span>
            </div>

            <FormField label="Kund" required>
              <select name="customerId" value={order.customerId || ""} onChange={handleChange} style={inputStyle}>
                <option value="">Välj kund</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Adress">
              <input name="address" value={order.address || ""} onChange={handleChange} style={inputStyle} placeholder="Adress" />
            </FormField>

            <FormField label="Deadline">
              <input type="date" name="deadline" value={order.deadline || ""} onChange={handleChange} style={inputStyle} />
            </FormField>

            <div style={sectionHeaderStyle}>
              <Briefcase size={20} color={colors.primary[500]} />
              <span>Arbetsdetaljer</span>
            </div>

            <FormField label="Typ av arbete">
              <select name="workType" value={order.workType || ""} onChange={handleChange} style={inputStyle}>
                <option value="">Välj typ</option>
                <option value="Bygg">Bygg</option>
                <option value="El">El</option>
                <option value="Garanti">Garanti</option>
                <option value="IT">IT</option>
                <option value="Rivning">Rivning</option>
                <option value="VVS">VVS</option>
                <option value="Anläggning">Anläggning</option>
                <option value="Övrigt">Övrigt</option>
              </select>
            </FormField>

            <FormField label="Prioritet">
              <select name="priority" value={order.priority || ""} onChange={handleChange} style={inputStyle}>
                <option value="">Välj prioritet</option>
                <option value="Låg">Låg</option>
                <option value="Mellan">Mellan</option>
                <option value="Hög">Hög</option>
              </select>
            </FormField>

            <FormField label="Uppskattad tid">
              <input name="estimatedTime" value={order.estimatedTime || ""} onChange={handleChange} style={inputStyle} placeholder="T.ex. 4 timmar" />
            </FormField>
          </div>

          <div className="card-enter hover-lift" style={cardStyle}>
            <div style={sectionHeaderStyle}>
              <FileText size={20} color={colors.primary[500]} />
              <span>Orderdetaljer</span>
            </div>

            <FormField label="Titel / Namn på arbetsorder" required>
              <input name="title" value={order.title || ""} onChange={handleChange} style={inputStyle} />
            </FormField>

            <FormField label="Status">
              <select name="status" value={order.status || ""} onChange={handleChange} style={inputStyle}>
                <option value="">Välj status</option>
                <option value="Planerad">Planerad</option>
                <option value="Ej påbörjad">Ej påbörjad</option>
                <option value="Pågående">Pågående</option>
                <option value="Klar för fakturering">Klar för fakturering</option>
                <option value="Full fakturerad">Full fakturerad</option>
              </select>
            </FormField>

            <FormField label="Beskrivning" required>
              <textarea name="description" value={order.description || ""} onChange={handleChange} style={{ ...inputStyle, height: "120px", resize: "vertical" }} />
            </FormField>

            <div style={sectionHeaderStyle}>
              <DollarSign size={20} color={colors.primary[500]} />
              <span>Fakturering</span>
            </div>

            <div style={{ marginBottom: spacing[6] }}>
              <label style={{
                display: "flex",
                alignItems: "center",
                gap: spacing[3],
                cursor: "pointer",
                padding: spacing[4],
                backgroundColor: order.billable ? colors.primary[50] : colors.neutral[50],
                borderRadius: borderRadius.lg,
                border: order.billable ? `2px solid ${colors.primary[500]}` : `1px solid ${colors.neutral[200]}`
              }}>
                <input
                  type="checkbox"
                  name="billable"
                  checked={order.billable || false}
                  onChange={handleChange}
                  style={{ width: "20px", height: "20px", cursor: "pointer" }}
                />
                <span style={{
                  fontWeight: typography.fontWeight.semibold,
                  color: order.billable ? colors.primary[600] : colors.neutral[500],
                  fontSize: typography.fontSize.base
                }}>
                  Faktureringsbar order
                </span>
              </label>
            </div>

            {order.billable && (
              <>
                <FormField label="Faktureringsmetod">
                  <select name="billingType" value={order.billingType || ""} onChange={handleChange} style={inputStyle}>
                    <option value="">Välj metod</option>
                    <option value="Löpande pris">Löpande pris</option>
                    <option value="Fast pris">Fast pris</option>
                  </select>
                </FormField>
                {order.billingType === "Fast pris" && (
                  <FormField label="Pris (SEK)">
                    <input name="fixedPrice" value={order.fixedPrice || ""} onChange={handleChange} placeholder="0" type="number" style={inputStyle} />
                  </FormField>
                )}
              </>
            )}

            <div style={{
              display: "flex",
              gap: spacing[4],
              marginTop: spacing[8],
              paddingTop: spacing[6],
              borderTop: `1px solid ${colors.neutral[200]}`
            }}>
              <div style={{ flex: 1 }}>
                <ActionButton
                  onClick={handleSave}
                  icon={<Save size={20} />}
                  color={colors.success[500]}
                  hoverColor={colors.success[600]}
                  fullWidth
                >
                  Spara ändringar
                </ActionButton>
              </div>
              <ActionButton
                onClick={() => setIsEditing(false)}
                icon={<X size={20} />}
                color={colors.neutral[500]}
                hoverColor={colors.neutral[600]}
              >
                Avbryt
              </ActionButton>
            </div>
          </div>
        </div>
      ) : (
        // VIEWING MODE FOR ORDER DETAILS
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[6] }}>
          <div className="card-enter hover-lift" style={cardStyle}>
            <div style={sectionHeaderStyle}>
              <User size={20} color={colors.primary[500]} />
              <span>Kundinformation</span>
            </div>
            <InfoRow label="Kund" value={customers.find(c => c.id === order.customerId)?.name || "—"} />
            <InfoRow label="Adress" value={order.address || "—"} />
            <InfoRow label="Deadline" value={order.deadline ? new Date(order.deadline).toLocaleDateString('sv-SE') : "—"} />

            <div style={{ ...sectionHeaderStyle, marginTop: spacing[8] }}>
              <Briefcase size={20} color={colors.primary[500]} />
              <span>Arbetsdetaljer</span>
            </div>
            <InfoRow label="Typ av arbete" value={order.workType || "—"} />
            <InfoRow label="Prioritet" value={order.priority || "—"} />
            <InfoRow label="Uppskattad tid" value={order.estimatedTime || "—"} />

            <div style={{ ...sectionHeaderStyle, marginTop: spacing[8] }}>
              <DollarSign size={20} color={colors.primary[500]} />
              <span>Fakturering</span>
            </div>
            <InfoRow label="Faktureringsbar" value={order.billable ? "Ja" : "Nej"} />
            {order.billable && (
              <>
                <InfoRow label="Faktureringsmetod" value={order.billingType || "—"} />
                {order.billingType === "Fast pris" && (
                  <InfoRow label="Fast pris" value={`${order.fixedPrice || "0"} SEK`} />
                )}
              </>
            )}
          </div>

          <div className="card-enter hover-lift" style={cardStyle}>
            <div style={sectionHeaderStyle}>
              <FileText size={20} color={colors.primary[500]} />
              <span>Beskrivning</span>
            </div>
            <p style={{
              whiteSpace: "pre-wrap",
              color: colors.neutral[600],
              lineHeight: typography.lineHeight.relaxed,
              fontSize: typography.fontSize.base,
              margin: 0
            }}>
              {order.description || "Ingen beskrivning tillgänglig."}
            </p>

            <div style={{
              marginTop: spacing[8],
              paddingTop: spacing[6],
              borderTop: `1px solid ${colors.neutral[200]}`,
              display: "flex",
              gap: spacing[4],
              flexWrap: "wrap"
            }}>
              <ActionButton
                onClick={() => setIsEditing(true)}
                icon={<Edit3 size={18} />}
                color={colors.primary[500]}
                hoverColor={colors.primary[600]}
              >
                Redigera Order
              </ActionButton>
              <ActionButton
                onClick={handleDelete}
                icon={<Trash2 size={18} />}
                color={colors.error[500]}
                hoverColor={colors.error[600]}
              >
                Radera Order
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* Time Reporting Section */}
      {!isEditing && (
        <div style={{ marginTop: spacing[8] }}>
          <div className="card-enter" style={cardStyle}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: spacing[6]
            }}>
              <div style={{ ...sectionHeaderStyle, marginBottom: 0, paddingBottom: 0, border: "none" }}>
                <Clock size={20} color={colors.success[500]} />
                <span>Tidsrapportering</span>
              </div>
              {!showTimeReportForm && (
                <ActionButton
                  onClick={() => {
                    setEditingTimeReport(null);
                    setShowTimeReportForm(true);
                  }}
                  icon={<Plus size={18} />}
                  color={colors.success[500]}
                  hoverColor={colors.success[600]}
                >
                  Rapportera tid
                </ActionButton>
              )}
            </div>

            {/* Success/Error Messages */}
            {timeSuccess && (
              <div style={{
                backgroundColor: colors.success[100],
                border: `2px solid ${colors.success[500]}`,
                color: colors.success[800],
                padding: spacing[3],
                borderRadius: borderRadius.lg,
                marginBottom: spacing[4],
                display: "flex",
                alignItems: "center",
                gap: spacing[2]
              }}>
                <CheckCircle size={18} />
                <span style={{ fontWeight: typography.fontWeight.medium }}>{timeSuccess}</span>
              </div>
            )}

            {timeError && (
              <div style={{
                backgroundColor: colors.error[100],
                border: `2px solid ${colors.error[500]}`,
                color: colors.error[800],
                padding: spacing[3],
                borderRadius: borderRadius.lg,
                marginBottom: spacing[4],
                display: "flex",
                alignItems: "center",
                gap: spacing[2]
              }}>
                <AlertCircle size={18} />
                <span style={{ fontWeight: typography.fontWeight.medium }}>{timeError}</span>
              </div>
            )}

            {/* Time Report Form */}
            {showTimeReportForm && (
              <div style={{
                marginBottom: spacing[8],
                padding: spacing[6],
                backgroundColor: colors.neutral[50],
                borderRadius: borderRadius.lg,
                border: `1px solid ${colors.neutral[200]}`
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: spacing[4]
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.neutral[900]
                  }}>
                    {editingTimeReport ? "Redigera tidsrapport" : "Ny tidsrapport"}
                  </h3>
                  <button
                    onClick={() => {
                      setShowTimeReportForm(false);
                      setEditingTimeReport(null);
                      setTimeError(null);
                      setTimeSuccess(null);
                      setTimeForm({
                        datum: new Date().toISOString().split('T')[0],
                        startTid: "",
                        slutTid: "",
                        antalTimmar: "",
                        timeCode: "normal",
                        fakturerbar: true,
                        kommentar: ""
                      });
                    }}
                    style={{
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      color: colors.neutral[500],
                      padding: spacing[1],
                      display: "flex",
                      alignItems: "center",
                      borderRadius: borderRadius.base,
                      transition: `all ${transitions.base}`
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.neutral[200]}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleTimeSubmit}>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: spacing[4],
                    marginBottom: spacing[4]
                  }}>
                    <FormField label="Datum" required>
                      <input
                        type="date"
                        name="datum"
                        value={timeForm.datum}
                        onChange={handleTimeChange}
                        required
                        style={inputStyle}
                      />
                    </FormField>

                    <FormField label="Tidkod" required>
                      <select
                        name="timeCode"
                        value={timeForm.timeCode}
                        onChange={handleTimeChange}
                        style={inputStyle}
                      >
                        {timeCodes.map(code => (
                          <option key={code.id} value={code.id}>
                            {code.name} {!code.billable ? "(Ej fakturerbar)" : ""}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Starttid">
                      <input
                        type="time"
                        name="startTid"
                        value={timeForm.startTid}
                        onChange={handleTimeChange}
                        style={inputStyle}
                      />
                    </FormField>

                    <FormField label="Sluttid">
                      <input
                        type="time"
                        name="slutTid"
                        value={timeForm.slutTid}
                        onChange={handleTimeChange}
                        style={inputStyle}
                      />
                    </FormField>

                    <FormField label="Antal timmar" required>
                      <input
                        type="number"
                        name="antalTimmar"
                        value={timeForm.antalTimmar}
                        onChange={handleTimeChange}
                        required
                        step="0.25"
                        min="0.01"
                        placeholder="0.00"
                        style={inputStyle}
                      />
                    </FormField>

                    <div style={{ display: "flex", alignItems: "center", marginTop: spacing[6] }}>
                      <label style={{ display: "flex", alignItems: "center", gap: spacing[2], cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          name="fakturerbar"
                          checked={timeForm.fakturerbar}
                          onChange={handleTimeChange}
                          style={{ width: "18px", height: "18px", cursor: "pointer" }}
                        />
                        <span style={{
                          fontSize: typography.fontSize.sm,
                          fontWeight: typography.fontWeight.semibold,
                          color: colors.neutral[700]
                        }}>
                          Fakturerbar tid
                        </span>
                      </label>
                    </div>

                    <div style={{ gridColumn: "1 / -1" }}>
                      <FormField label="Kommentar">
                        <textarea
                          name="kommentar"
                          value={timeForm.kommentar}
                          onChange={handleTimeChange}
                          rows={3}
                          placeholder="Beskriv arbetet som utfördes..."
                          style={{ ...inputStyle, resize: "vertical" }}
                        />
                      </FormField>
                    </div>
                  </div>

                  {timeForm.antalTimmar && timeForm.fakturerbar && (
                    <div style={{
                      padding: spacing[4],
                      background: colors.gradients.blue,
                      borderRadius: borderRadius.lg,
                      marginBottom: spacing[4],
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      boxShadow: shadows.md
                    }}>
                      <span style={{
                        color: "white",
                        fontWeight: typography.fontWeight.semibold
                      }}>
                        Beräknat värde (ex. moms):
                      </span>
                      <span style={{
                        fontSize: typography.fontSize['2xl'],
                        fontWeight: typography.fontWeight.bold,
                        color: "white"
                      }}>
                        {(() => {
                          const selectedTimeCode = timeCodes.find(tc => tc.id === timeForm.timeCode);
                          const rate = selectedTimeCode?.hourlyRate || 650;
                          return (parseFloat(timeForm.antalTimmar) * rate).toLocaleString('sv-SE');
                        })()} kr
                      </span>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: spacing[3] }}>
                    <ActionButton
                      onClick={() => {
                        setShowTimeReportForm(false);
                        setEditingTimeReport(null);
                        setTimeError(null);
                        setTimeSuccess(null);
                        setTimeForm({
                          datum: new Date().toISOString().split('T')[0],
                          startTid: "",
                          slutTid: "",
                          antalTimmar: "",
                          timeCode: "normal",
                          fakturerbar: true,
                          kommentar: ""
                        });
                      }}
                      icon={<X size={18} />}
                      color={colors.neutral[500]}
                      hoverColor={colors.neutral[600]}
                    >
                      Avbryt
                    </ActionButton>
                    <button
                      type="submit"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: spacing[2],
                        background: colors.gradients.success,
                        color: "#fff",
                        padding: `${spacing[3]} ${spacing[8]}`,
                        border: "none",
                        borderRadius: borderRadius.lg,
                        fontSize: typography.fontSize.base,
                        fontWeight: typography.fontWeight.semibold,
                        cursor: "pointer",
                        transition: `all ${transitions.base}`,
                        boxShadow: shadows.md
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                    >
                      <Save size={18} />
                      {editingTimeReport ? "Uppdatera" : "Rapportera tid"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Time Reports List */}
            <div>
              <h3 style={{
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                color: colors.neutral[500],
                marginBottom: spacing[4]
              }}>
                Rapporterad tid ({timeReports.length})
              </h3>
              {timeReports.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: spacing[12],
                  color: colors.neutral[500]
                }}>
                  <Clock size={48} style={{ marginBottom: spacing[4], opacity: 0.5 }} />
                  <p style={{
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.medium,
                    margin: 0,
                    marginBottom: spacing[2]
                  }}>
                    Ingen tid rapporterad än
                  </p>
                  <p style={{
                    fontSize: typography.fontSize.sm,
                    margin: 0
                  }}>
                    Klicka på "Rapportera tid" för att börja
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: spacing[3] }}>
                  {timeReports.map(report => {
                    const timeCode = timeCodes.find(tc => tc.id === report.timeCode);
                    const reportValue = parseFloat(report.antalTimmar || 0) * (report.hourlyRate || 650);

                    return (
                      <div
                        key={report.id}
                        className="hover-lift"
                        style={{
                          padding: spacing[4],
                          backgroundColor: "white",
                          borderRadius: borderRadius.lg,
                          border: `1px solid ${colors.neutral[200]}`,
                          display: "grid",
                          gridTemplateColumns: "auto 1fr auto",
                          gap: spacing[4],
                          alignItems: "center",
                          transition: `all ${transitions.base}`
                        }}
                      >
                        <div style={{
                          width: "4px",
                          height: "60px",
                          backgroundColor: timeCode?.color || colors.primary[500],
                          borderRadius: borderRadius.sm
                        }} />

                        <div>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: spacing[3],
                            marginBottom: spacing[2]
                          }}>
                            <Badge variant="info">
                              {timeCode?.name || "Normal tid"}
                            </Badge>
                            <span style={{
                              fontSize: typography.fontSize.sm,
                              color: colors.neutral[500]
                            }}>
                              {new Date(report.datum).toLocaleDateString('sv-SE')}
                            </span>
                            <span style={{
                              fontSize: typography.fontSize.sm,
                              color: colors.neutral[500]
                            }}>
                              {report.userName || "Okänd"}
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: spacing[4] }}>
                            <span style={{
                              fontSize: typography.fontSize.sm,
                              color: colors.neutral[900],
                              fontWeight: typography.fontWeight.semibold
                            }}>
                              {report.antalTimmar}h
                            </span>
                            {report.fakturerbar !== false && (
                              <span style={{
                                fontSize: typography.fontSize.sm,
                                color: colors.success[600],
                                fontWeight: typography.fontWeight.semibold
                              }}>
                                {reportValue.toLocaleString('sv-SE')} kr (ex. moms)
                              </span>
                            )}
                          </div>

                          {report.kommentar && (
                            <p style={{
                              fontSize: typography.fontSize.sm,
                              color: colors.neutral[500],
                              margin: `${spacing[2]} 0 0 0`,
                              fontStyle: "italic"
                            }}>
                              "{report.kommentar}"
                            </p>
                          )}
                        </div>

                        <div style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: spacing[2],
                          alignItems: "flex-end"
                        }}>
                          <Badge
                            variant={report.godkand ? "success" : "warning"}
                            icon={report.godkand ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                          >
                            {report.godkand ? "Godkänd" : "Väntande"}
                          </Badge>

                          <div style={{ display: "flex", gap: spacing[2] }}>
                            <ActionButton
                              onClick={() => handleEditTimeReport(report)}
                              icon={<Edit3 size={12} />}
                              color={colors.primary[500]}
                              hoverColor={colors.primary[600]}
                              size="sm"
                            >
                              Redigera
                            </ActionButton>
                            <ActionButton
                              onClick={() => handleDeleteTimeReport(report.id)}
                              icon={<Trash2 size={12} />}
                              color={colors.error[500]}
                              hoverColor={colors.error[600]}
                              size="sm"
                            >
                              Radera
                            </ActionButton>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Summary */}
                  {timeReports.length > 0 && (
                    <div style={{
                      marginTop: spacing[4],
                      padding: spacing[6],
                      background: colors.gradients.primary,
                      borderRadius: borderRadius.xl,
                      boxShadow: shadows.lg
                    }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: spacing[6] }}>
                        <div>
                          <div style={{
                            fontSize: typography.fontSize.xs,
                            color: "rgba(255, 255, 255, 0.9)",
                            marginBottom: spacing[1],
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            fontWeight: typography.fontWeight.semibold
                          }}>
                            Totalt timmar
                          </div>
                          <div style={{
                            fontSize: typography.fontSize['2xl'],
                            fontWeight: typography.fontWeight.bold,
                            color: "white"
                          }}>
                            {timeReports.reduce((sum, r) => sum + parseFloat(r.antalTimmar || 0), 0).toFixed(2)}h
                          </div>
                        </div>
                        <div>
                          <div style={{
                            fontSize: typography.fontSize.xs,
                            color: "rgba(255, 255, 255, 0.9)",
                            marginBottom: spacing[1],
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            fontWeight: typography.fontWeight.semibold
                          }}>
                            Fakturerbara timmar
                          </div>
                          <div style={{
                            fontSize: typography.fontSize['2xl'],
                            fontWeight: typography.fontWeight.bold,
                            color: "white"
                          }}>
                            {timeReports
                              .filter(r => r.fakturerbar !== false)
                              .reduce((sum, r) => sum + parseFloat(r.antalTimmar || 0), 0)
                              .toFixed(2)}h
                          </div>
                        </div>
                        <div>
                          <div style={{
                            fontSize: typography.fontSize.xs,
                            color: "rgba(255, 255, 255, 0.9)",
                            marginBottom: spacing[1],
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            fontWeight: typography.fontWeight.semibold
                          }}>
                            Totalt värde (ex. moms)
                          </div>
                          <div style={{
                            fontSize: typography.fontSize['2xl'],
                            fontWeight: typography.fontWeight.bold,
                            color: "white"
                          }}>
                            {timeReports
                              .filter(r => r.fakturerbar !== false)
                              .reduce((sum, r) => sum + (parseFloat(r.antalTimmar || 0) * (r.hourlyRate || 650)), 0)
                              .toLocaleString('sv-SE')} kr
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
