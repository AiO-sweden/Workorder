import { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
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
  colors,
  spacing,
  borderRadius,
  typography,
  transitions
} from "../components/shared/styles";

// Dark input style
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
    timeCode: "",
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
      if (!isMounted) return;

      if (!userDetails) {
        console.log('⏳ OrderDetails: Waiting for userDetails to load...');
        return;
      }

      console.log('🔍 OrderDetails: Fetching order...');

      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          // Convert snake_case to camelCase
          setOrder({
            id: data.id,
            orderNumber: data.order_number,
            customerId: data.customer_id,
            organizationId: data.organization_id,
            title: data.title,
            description: data.description,
            address: data.address,
            workType: data.work_type,
            status: data.status,
            priority: data.priority,
            billingType: data.billing_type,
            deadline: data.deadline,
            estimatedTime: data.estimated_time,
            assignedTo: data.assigned_to,
            billable: data.billable,
            fixedPrice: data.fixed_price,
            closed: data.closed,
            closedAt: data.closed_at,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          });
          console.log('✅ OrderDetails: Order fetched:', data.title);
        } else {
          setToast({ message: "Arbetsorder hittades inte.", type: "error" });
          setTimeout(() => navigate("/dashboard"), 2000);
        }
      } catch (error) {
        console.error("❌ OrderDetails: Error fetching order:", error);
      }
    };
    fetchOrder();

    const fetchCustomers = async () => {
      if (!isMounted) return;

      if (!userDetails) {
        console.log('⏳ OrderDetails: Waiting for userDetails to load customers...');
        return;
      }

      if (!userDetails.organizationId) {
        console.log('⚠️ OrderDetails: No organizationId, skipping customers fetch');
        return;
      }

      console.log('🔍 OrderDetails: Fetching customers...');

      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('organization_id', userDetails.organizationId);

        if (error) throw error;

        const list = (data || []).map(customer => ({
          id: customer.id,
          name: customer.name,
          customerNumber: customer.customer_number,
          address: customer.address,
          phone: customer.phone,
          email: customer.email,
          organizationId: customer.organization_id,
          invoiceBy: customer.invoice_by,
          paymentTerms: customer.payment_terms,
          referencePerson: customer.reference_person
        }));
        setCustomers(list);
        console.log('✅ OrderDetails: Fetched', list.length, 'customers');
      } catch (error) {
        console.error("❌ OrderDetails: Error fetching customers:", error);
      }
    };
    fetchCustomers();

    const fetchTimeCodes = async () => {
      if (!isMounted) return;

      if (!userDetails) {
        console.log('⏳ OrderDetails: Waiting for userDetails to load time codes...');
        return;
      }

      if (!userDetails.organizationId) {
        console.log('⚠️ OrderDetails: No organizationId, using default time codes');
        return;
      }

      console.log('🔍 OrderDetails: Fetching time codes...');

      try {
        const { data, error } = await supabase
          .from('time_codes')
          .select('*')
          .eq('organization_id', userDetails.organizationId)
          .order('code', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          // Convert time_codes table format to component format and filter duplicates
          const convertedTimeCodes = data.map(tc => ({
            id: tc.code || tc.id,
            name: tc.name,
            color: "#3b82f6", // Default color, could be added to time_codes table later
            billable: tc.type === 'Arbetstid',
            hourlyRate: tc.rate || 0
          }));

          // Remove duplicates based on id using a Map
          const uniqueTimeCodes = Array.from(
            new Map(convertedTimeCodes.map(tc => [tc.id, tc])).values()
          );

          setTimeCodes(uniqueTimeCodes);
          console.log('✅ OrderDetails: Fetched', uniqueTimeCodes.length, 'unique time codes');
        }
      } catch (error) {
        console.error("❌ OrderDetails: Error fetching time codes:", error);
        // Fallback to default time codes if settings don't exist
      }
    };
    fetchTimeCodes();

    const fetchTimeReports = async () => {
      if (!isMounted || !id) return;

      if (!userDetails) {
        console.log('⏳ OrderDetails: Waiting for userDetails to load time reports...');
        setLoading(false);
        return;
      }

      if (!userDetails.organizationId) {
        console.log('⚠️ OrderDetails: No organizationId, skipping time reports fetch');
        setLoading(false);
        return;
      }

      console.log('🔍 OrderDetails: Fetching time reports...');

      try {
        const { data, error } = await supabase
          .from('tidsrapporteringar')
          .select('*')
          .eq('organization_id', userDetails.organizationId)
          .eq('arbetsorder', id);

        if (error) throw error;

        const reports = (data || []).map(report => ({
          id: report.id,
          arbetsorder: report.arbetsorder,
          datum: report.datum,
          startTid: report.start_tid,
          slutTid: report.slut_tid,
          antalTimmar: report.antal_timmar,
          timeCode: report.time_code,
          timeCodeName: report.time_code_name,
          timeCodeColor: report.time_code_color,
          fakturerbar: report.fakturerbar,
          kommentar: report.kommentar,
          organizationId: report.organization_id,
          userId: report.user_id,
          userName: report.user_name,
          godkand: report.godkand,
          hourlyRate: report.hourly_rate,
          timestamp: report.timestamp
        }));
        setTimeReports(reports.sort((a, b) => new Date(b.datum) - new Date(a.datum)));
        console.log('✅ OrderDetails: Fetched', reports.length, 'time reports');
      } catch (error) {
        console.error("❌ OrderDetails: Error fetching time reports:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTimeReports();

    return () => {
      isMounted = false;
    };
  }, [id, navigate, userDetails]);

  // Real-time listener for time_codes changes
  useEffect(() => {
    if (!userDetails?.organizationId) return;

    console.log('🔄 OrderDetails: Setting up real-time listener for time_codes');

    const channel = supabase
      .channel('order_details_time_codes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_codes',
          filter: `organization_id=eq.${userDetails.organizationId}`
        },
        async (payload) => {
          console.log('🔔 OrderDetails: Time codes changed:', payload);

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

            const uniqueTimeCodes = Array.from(
              new Map(convertedTimeCodes.map(tc => [tc.id, tc])).values()
            );

            setTimeCodes(uniqueTimeCodes);
            console.log("✅ OrderDetails: Time codes updated from real-time:", uniqueTimeCodes.length);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 OrderDetails: Cleaning up time_codes listener');
      supabase.removeChannel(channel);
    };
  }, [userDetails?.organizationId]);

  // Set default timeCode when timeCodes are loaded
  useEffect(() => {
    if (timeCodes.length > 0 && !timeForm.timeCode) {
      setTimeForm(prev => ({
        ...prev,
        timeCode: timeCodes[0].id
      }));
    }
  }, [timeCodes, timeForm.timeCode]);

  const handleDelete = async () => {
    if (window.confirm("Är du säker på att du vill radera denna arbetsorder?")) {
      try {
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('id', id);

        if (error) throw error;

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
      // Convert camelCase to snake_case for database
      const updateData = {
        order_number: order.orderNumber,
        customer_id: order.customerId,
        title: order.title,
        description: order.description,
        address: order.address,
        work_type: order.workType,
        status: order.status,
        priority: order.priority,
        billing_type: order.billingType,
        deadline: order.deadline,
        estimated_time: order.estimatedTime,
        assigned_to: order.assignedTo,
        billable: order.billable,
        fixed_price: order.fixedPrice,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setToast({ message: "Arbetsorder uppdaterad.", type: "success" });
      setIsEditing(false);
    } catch (error) {
      setToast({ message: "Kunde inte uppdatera arbetsorder.", type: "error" });
    }
  };

  const handleQuickStatusChange = async (newStatus) => {
    try {
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      // If status is "Full fakturerad", automatically mark as closed
      if (newStatus === "Full fakturerad" || newStatus === "Avslutad") {
        updateData.closed = true;
        updateData.closed_at = new Date().toISOString();
      } else {
        updateData.closed = false;
        updateData.closed_at = null;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Update local state with camelCase
      setOrder(prev => ({
        ...prev,
        status: newStatus,
        closed: updateData.closed,
        closedAt: updateData.closed_at
      }));
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
      const { data, error } = await supabase
        .from('tidsrapporteringar')
        .select('*')
        .eq('organization_id', userDetails.organizationId)
        .eq('arbetsorder', id);

      if (error) throw error;

      const reports = (data || []).map(report => ({
        id: report.id,
        arbetsorder: report.arbetsorder,
        datum: report.datum,
        startTid: report.start_tid,
        slutTid: report.slut_tid,
        antalTimmar: report.antal_timmar,
        timeCode: report.time_code,
        timeCodeName: report.time_code_name,
        timeCodeColor: report.time_code_color,
        fakturerbar: report.fakturerbar,
        kommentar: report.kommentar,
        organizationId: report.organization_id,
        userId: report.user_id,
        userName: report.user_name,
        godkand: report.godkand,
        hourlyRate: report.hourly_rate,
        timestamp: report.timestamp
      }));
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
        // Update existing time report - convert to snake_case
        const updateData = {
          datum: timeForm.datum,
          start_tid: timeForm.startTid || null,
          slut_tid: timeForm.slutTid || null,
          antal_timmar: parseFloat(timeForm.antalTimmar) || 0,
          time_code: timeForm.timeCode,
          time_code_name: timeCodeInfo?.name || "Normal tid",
          time_code_color: timeCodeInfo?.color || "#3b82f6",
          hourly_rate: timeCodeInfo?.hourlyRate || 650,
          fakturerbar: timeForm.fakturerbar,
          kommentar: timeForm.kommentar
        };

        const { error } = await supabase
          .from('tidsrapporteringar')
          .update(updateData)
          .eq('id', editingTimeReport.id);

        if (error) throw error;

        setTimeSuccess("Tidsrapporten har uppdaterats!");
        setEditingTimeReport(null);
      } else {
        // Create new time report - convert to snake_case
        const insertData = {
          datum: timeForm.datum,
          start_tid: timeForm.startTid || null,
          slut_tid: timeForm.slutTid || null,
          antal_timmar: parseFloat(timeForm.antalTimmar) || 0,
          time_code: timeForm.timeCode,
          time_code_name: timeCodeInfo?.name || "Normal tid",
          time_code_color: timeCodeInfo?.color || "#3b82f6",
          hourly_rate: timeCodeInfo?.hourlyRate || 650,
          fakturerbar: timeForm.fakturerbar,
          kommentar: timeForm.kommentar,
          arbetsorder: id,
          organization_id: userDetails.organizationId,
          user_id: currentUser.id,
          user_name: userDetails.displayName || userDetails.email || "Användare",
          godkand: true,
          timestamp: new Date().toISOString()
        };

        const { error } = await supabase
          .from('tidsrapporteringar')
          .insert([insertData]);

        if (error) throw error;

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
      const { error } = await supabase
        .from('tidsrapporteringar')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      setTimeSuccess("Tidsrapporten har raderats!");
      await refreshTimeReports();
      setTimeout(() => setTimeSuccess(null), 2000);
    } catch (error) {
      console.error("Error deleting time report:", error);
      setTimeError("Kunde inte radera tidsrapporten");
      setTimeout(() => setTimeError(null), 3000);
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

      setTimeSuccess(`Rapporten ${newApproval ? 'godkänd' : 'nekad'}!`);
      setTimeout(() => setTimeSuccess(null), 2000);
    } catch (err) {
      console.error("Fel vid uppdatering av godkännandestatus:", err);
      setTimeError("Fel vid uppdatering. Försök igen.");
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
      fontFamily: typography.fontFamily.sans,
      padding: '2rem 0'
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
                color: '#fff',
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: spacing[3]
              }}>
                <FileText size={32} color="#60a5fa" />
                Arbetsorder #{order.orderNumber}
              </h1>
              <p style={{
                color: '#cbd5e1',
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
              color: '#cbd5e1'
            }}>
              Status:
            </label>
            <select
              value={order.status}
              onChange={(e) => handleQuickStatusChange(e.target.value)}
              style={{
                minWidth: "200px",
                padding: `${spacing[2]} ${spacing[4]}`,
                fontWeight: typography.fontWeight.semibold,
                fontSize: typography.fontSize.base,
                cursor: "pointer",
                borderRadius: borderRadius.lg,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                outline: 'none'
              }}
            >
              <option value="Ej påbörjad" style={{ backgroundColor: '#1a1a2e' }}>Ej påbörjad</option>
              <option value="Planerad" style={{ backgroundColor: '#1a1a2e' }}>Planerad</option>
              <option value="Pågående" style={{ backgroundColor: '#1a1a2e' }}>Pågående</option>
              <option value="Klar för fakturering" style={{ backgroundColor: '#1a1a2e' }}>Klar för fakturering</option>
              <option value="Full fakturerad" style={{ backgroundColor: '#1a1a2e' }}>Full fakturerad (Avslutas)</option>
              <option value="Avslutad" style={{ backgroundColor: '#1a1a2e' }}>Avslutad</option>
            </select>
          </div>
        </div>
      </div>

      {/* Order Details */}
      {isEditing ? (
        // EDITING MODE FOR ORDER DETAILS
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[6] }}>
          <div className="card-enter hover-lift" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            borderRadius: borderRadius.xl,
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: spacing[6]
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[3],
              marginBottom: spacing[6],
              paddingBottom: spacing[4],
              borderBottom: '2px solid rgba(255, 255, 255, 0.1)'
            }}>
              <User size={20} color="#60a5fa" />
              <span style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: '#fff'
              }}>Kundinformation</span>
            </div>

            <FormField label="Kund" required>
              <select name="customerId" value={order.customerId || ""} onChange={handleChange} style={darkInputStyle}>
                <option value="" style={{ backgroundColor: '#1a1a2e' }}>Välj kund</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id} style={{ backgroundColor: '#1a1a2e' }}>{customer.name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Adress">
              <input name="address" value={order.address || ""} onChange={handleChange} style={darkInputStyle} placeholder="Adress" />
            </FormField>

            <FormField label="Deadline">
              <input type="date" name="deadline" value={order.deadline || ""} onChange={handleChange} style={darkInputStyle} />
            </FormField>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[3],
              marginBottom: spacing[6],
              paddingBottom: spacing[4],
              borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
              marginTop: spacing[8]
            }}>
              <Briefcase size={20} color="#60a5fa" />
              <span style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: '#fff'
              }}>Arbetsdetaljer</span>
            </div>

            <FormField label="Typ av arbete">
              <select name="workType" value={order.workType || ""} onChange={handleChange} style={darkInputStyle}>
                <option value="" style={{ backgroundColor: '#1a1a2e' }}>Välj typ</option>
                <option value="Bygg" style={{ backgroundColor: '#1a1a2e' }}>Bygg</option>
                <option value="El" style={{ backgroundColor: '#1a1a2e' }}>El</option>
                <option value="Garanti" style={{ backgroundColor: '#1a1a2e' }}>Garanti</option>
                <option value="IT" style={{ backgroundColor: '#1a1a2e' }}>IT</option>
                <option value="Rivning" style={{ backgroundColor: '#1a1a2e' }}>Rivning</option>
                <option value="VVS" style={{ backgroundColor: '#1a1a2e' }}>VVS</option>
                <option value="Anläggning" style={{ backgroundColor: '#1a1a2e' }}>Anläggning</option>
                <option value="Övrigt" style={{ backgroundColor: '#1a1a2e' }}>Övrigt</option>
              </select>
            </FormField>

            <FormField label="Prioritet">
              <select name="priority" value={order.priority || ""} onChange={handleChange} style={darkInputStyle}>
                <option value="" style={{ backgroundColor: '#1a1a2e' }}>Välj prioritet</option>
                <option value="Låg" style={{ backgroundColor: '#1a1a2e' }}>Låg</option>
                <option value="Mellan" style={{ backgroundColor: '#1a1a2e' }}>Mellan</option>
                <option value="Hög" style={{ backgroundColor: '#1a1a2e' }}>Hög</option>
              </select>
            </FormField>

            <FormField label="Uppskattad tid">
              <input name="estimatedTime" value={order.estimatedTime || ""} onChange={handleChange} style={darkInputStyle} placeholder="T.ex. 4 timmar" />
            </FormField>
          </div>

          <div className="card-enter hover-lift" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            borderRadius: borderRadius.xl,
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: spacing[6]
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[3],
              marginBottom: spacing[6],
              paddingBottom: spacing[4],
              borderBottom: '2px solid rgba(255, 255, 255, 0.1)'
            }}>
              <FileText size={20} color="#60a5fa" />
              <span style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: '#fff'
              }}>Orderdetaljer</span>
            </div>

            <FormField label="Titel / Namn på arbetsorder" required>
              <input name="title" value={order.title || ""} onChange={handleChange} style={darkInputStyle} />
            </FormField>

            <FormField label="Status">
              <select name="status" value={order.status || ""} onChange={handleChange} style={darkInputStyle}>
                <option value="" style={{ backgroundColor: '#1a1a2e' }}>Välj status</option>
                <option value="Planerad" style={{ backgroundColor: '#1a1a2e' }}>Planerad</option>
                <option value="Ej påbörjad" style={{ backgroundColor: '#1a1a2e' }}>Ej påbörjad</option>
                <option value="Pågående" style={{ backgroundColor: '#1a1a2e' }}>Pågående</option>
                <option value="Klar för fakturering" style={{ backgroundColor: '#1a1a2e' }}>Klar för fakturering</option>
                <option value="Full fakturerad" style={{ backgroundColor: '#1a1a2e' }}>Full fakturerad</option>
              </select>
            </FormField>

            <FormField label="Beskrivning" required>
              <textarea name="description" value={order.description || ""} onChange={handleChange} style={{ ...darkInputStyle, height: "120px", resize: "vertical" }} />
            </FormField>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[3],
              marginBottom: spacing[6],
              paddingBottom: spacing[4],
              borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
              marginTop: spacing[8]
            }}>
              <DollarSign size={20} color="#60a5fa" />
              <span style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: '#fff'
              }}>Fakturering</span>
            </div>

            <div style={{ marginBottom: spacing[6] }}>
              <label style={{
                display: "flex",
                alignItems: "center",
                gap: spacing[3],
                cursor: "pointer",
                padding: spacing[4],
                backgroundColor: order.billable ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                borderRadius: borderRadius.lg,
                border: order.billable ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)'
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
                  color: order.billable ? '#60a5fa' : '#94a3b8',
                  fontSize: typography.fontSize.base
                }}>
                  Faktureringsbar order
                </span>
              </label>
            </div>

            {order.billable && (
              <>
                <FormField label="Faktureringsmetod">
                  <select name="billingType" value={order.billingType || ""} onChange={handleChange} style={{
                    width: "100%",
                    padding: `${spacing[3]} ${spacing[4]}`,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: borderRadius.lg,
                    fontSize: typography.fontSize.base,
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}>
                    <option value="" style={{ backgroundColor: '#1a1a2e' }}>Välj metod</option>
                    <option value="Löpande pris" style={{ backgroundColor: '#1a1a2e' }}>Löpande pris</option>
                    <option value="Fast pris" style={{ backgroundColor: '#1a1a2e' }}>Fast pris</option>
                  </select>
                </FormField>
                {order.billingType === "Fast pris" && (
                  <FormField label="Pris (SEK)">
                    <input name="fixedPrice" value={order.fixedPrice || ""} onChange={handleChange} placeholder="0" type="number" style={{
                      width: "100%",
                      padding: `${spacing[3]} ${spacing[4]}`,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: borderRadius.lg,
                      fontSize: typography.fontSize.base,
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      color: '#fff',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }} />
                  </FormField>
                )}
              </>
            )}

            <div style={{
              display: "flex",
              gap: spacing[4],
              marginTop: spacing[8],
              paddingTop: spacing[6],
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ flex: 1 }}>
                <ActionButton
                  onClick={handleSave}
                  icon={<Save size={20} />}
                  variant="success"
                  fullWidth
                >
                  Spara ändringar
                </ActionButton>
              </div>
              <ActionButton
                onClick={() => setIsEditing(false)}
                icon={<X size={20} />}
                variant="secondary"
              >
                Avbryt
              </ActionButton>
            </div>
          </div>
        </div>
      ) : (
        // VIEWING MODE FOR ORDER DETAILS
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[6] }}>
          <div className="card-enter hover-lift" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            borderRadius: borderRadius.xl,
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: spacing[6]
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[3],
              marginBottom: spacing[6],
              paddingBottom: spacing[4],
              borderBottom: '2px solid rgba(255, 255, 255, 0.1)'
            }}>
              <User size={20} color="#60a5fa" />
              <span style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: '#fff'
              }}>Kundinformation</span>
            </div>
            <InfoRow label="Kund" value={customers.find(c => c.id === order.customerId)?.name || "—"} />
            <InfoRow label="Adress" value={order.address || "—"} />
            <InfoRow label="Deadline" value={order.deadline ? new Date(order.deadline).toLocaleDateString('sv-SE') : "—"} />

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[3],
              marginBottom: spacing[6],
              paddingBottom: spacing[4],
              borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
              marginTop: spacing[8]
            }}>
              <Briefcase size={20} color="#60a5fa" />
              <span style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: '#fff'
              }}>Arbetsdetaljer</span>
            </div>
            <InfoRow label="Typ av arbete" value={order.workType || "—"} />
            <InfoRow label="Prioritet" value={order.priority || "—"} />
            <InfoRow label="Uppskattad tid" value={order.estimatedTime || "—"} />

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[3],
              marginBottom: spacing[6],
              paddingBottom: spacing[4],
              borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
              marginTop: spacing[8]
            }}>
              <DollarSign size={20} color="#60a5fa" />
              <span style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: '#fff'
              }}>Fakturering</span>
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

          <div className="card-enter hover-lift" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            borderRadius: borderRadius.xl,
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: spacing[6]
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[3],
              marginBottom: spacing[6],
              paddingBottom: spacing[4],
              borderBottom: '2px solid rgba(255, 255, 255, 0.1)'
            }}>
              <FileText size={20} color="#60a5fa" />
              <span style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: '#fff'
              }}>Beskrivning</span>
            </div>
            <p style={{
              whiteSpace: "pre-wrap",
              color: '#cbd5e1',
              lineHeight: typography.lineHeight.relaxed,
              fontSize: typography.fontSize.base,
              margin: 0
            }}>
              {order.description || "Ingen beskrivning tillgänglig."}
            </p>

            <div style={{
              marginTop: spacing[8],
              paddingTop: spacing[6],
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
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
          <div className="card-enter" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            borderRadius: borderRadius.xl,
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: spacing[6]
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: spacing[6]
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: spacing[3]
              }}>
                <Clock size={20} color="#10b981" />
                <span style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  color: '#fff'
                }}>Tidsrapportering</span>
              </div>
              {!showTimeReportForm && (
                <ActionButton
                  onClick={() => {
                    setEditingTimeReport(null);
                    setShowTimeReportForm(true);
                  }}
                  icon={<Plus size={18} />}
                  variant="success"
                >
                  Rapportera tid
                </ActionButton>
              )}
            </div>

            {/* Success/Error Messages */}
            {timeSuccess && (
              <div style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid #10b981',
                color: '#34d399',
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
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '2px solid #ef4444',
                color: '#f87171',
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
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: borderRadius.lg,
                border: '1px solid rgba(255, 255, 255, 0.1)'
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
                    color: '#fff'
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
                      color: '#94a3b8',
                      padding: spacing[1],
                      display: "flex",
                      alignItems: "center",
                      borderRadius: borderRadius.base,
                      transition: `all ${transitions.base}`
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
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
                        style={{
                          width: "100%",
                          padding: `${spacing[3]} ${spacing[4]}`,
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: borderRadius.lg,
                          fontSize: typography.fontSize.base,
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          color: '#fff',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </FormField>

                    <FormField label="Tidkod" required>
                      <select
                        name="timeCode"
                        value={timeForm.timeCode}
                        onChange={handleTimeChange}
                        style={{
                          width: "100%",
                          padding: `${spacing[3]} ${spacing[4]}`,
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: borderRadius.lg,
                          fontSize: typography.fontSize.base,
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          color: '#fff',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      >
                        {timeCodes.map(code => (
                          <option key={code.id} value={code.id} style={{ backgroundColor: '#1a1a2e' }}>
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
                        style={{
                          width: "100%",
                          padding: `${spacing[3]} ${spacing[4]}`,
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: borderRadius.lg,
                          fontSize: typography.fontSize.base,
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          color: '#fff',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </FormField>

                    <FormField label="Sluttid">
                      <input
                        type="time"
                        name="slutTid"
                        value={timeForm.slutTid}
                        onChange={handleTimeChange}
                        style={{
                          width: "100%",
                          padding: `${spacing[3]} ${spacing[4]}`,
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: borderRadius.lg,
                          fontSize: typography.fontSize.base,
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          color: '#fff',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </FormField>

                    <FormField label="Antal timmar" required>
                      <input
                        type="text"
                        inputMode="decimal"
                        name="antalTimmar"
                        value={timeForm.antalTimmar}
                        onChange={handleTimeChange}
                        required
                        placeholder="0.00"
                        style={{
                          width: "100%",
                          padding: `${spacing[3]} ${spacing[4]}`,
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: borderRadius.lg,
                          fontSize: typography.fontSize.base,
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          color: '#fff',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
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
                          color: '#cbd5e1'
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
                          style={{ ...darkInputStyle, resize: "vertical" }}
                        />
                      </FormField>
                    </div>
                  </div>

                  {timeForm.antalTimmar && timeForm.fakturerbar && (
                    <div style={{
                      padding: spacing[4],
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      borderRadius: borderRadius.lg,
                      marginBottom: spacing[4],
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)'
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
                      variant="secondary"
                    >
                      Avbryt
                    </ActionButton>
                    <button
                      type="submit"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: spacing[2],
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: "#fff",
                        padding: `${spacing[3]} ${spacing[8]}`,
                        border: "none",
                        borderRadius: borderRadius.lg,
                        fontSize: typography.fontSize.base,
                        fontWeight: typography.fontWeight.semibold,
                        cursor: "pointer",
                        transition: `all ${transitions.base}`,
                        boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)'
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
                color: '#94a3b8',
                marginBottom: spacing[4]
              }}>
                Rapporterad tid ({timeReports.length})
              </h3>
              {timeReports.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: spacing[12],
                  color: '#94a3b8'
                }}>
                  <Clock size={48} style={{ marginBottom: spacing[4], opacity: 0.5, color: '#94a3b8' }} />
                  <p style={{
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.medium,
                    margin: 0,
                    marginBottom: spacing[2],
                    color: '#cbd5e1'
                  }}>
                    Ingen tid rapporterad än
                  </p>
                  <p style={{
                    fontSize: typography.fontSize.sm,
                    margin: 0,
                    color: '#94a3b8'
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
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: borderRadius.lg,
                          border: '1px solid rgba(255, 255, 255, 0.1)',
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
                          backgroundColor: timeCode?.color || '#3b82f6',
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
                              {timeCode?.name || report.timeCodeName || "Normal tid"}
                            </Badge>
                            <span style={{
                              fontSize: typography.fontSize.sm,
                              color: '#94a3b8'
                            }}>
                              {new Date(report.datum).toLocaleDateString('sv-SE')}
                            </span>
                            <span style={{
                              fontSize: typography.fontSize.sm,
                              color: '#94a3b8'
                            }}>
                              {report.userName || "Okänd"}
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: spacing[4] }}>
                            <span style={{
                              fontSize: typography.fontSize.sm,
                              color: '#fff',
                              fontWeight: typography.fontWeight.semibold
                            }}>
                              {report.antalTimmar}h
                            </span>
                            {report.fakturerbar !== false && (
                              <span style={{
                                fontSize: typography.fontSize.sm,
                                color: '#34d399',
                                fontWeight: typography.fontWeight.semibold
                              }}>
                                {reportValue.toLocaleString('sv-SE')} kr (ex. moms)
                              </span>
                            )}
                          </div>

                          {report.kommentar && (
                            <p style={{
                              fontSize: typography.fontSize.sm,
                              color: '#94a3b8',
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
                          <ApprovalBadge
                            approved={report.godkand}
                            reportId={report.id}
                            onChange={handleApprovalChange}
                          />

                          <div style={{ display: "flex", gap: spacing[2] }}>
                            <ActionButton
                              onClick={() => handleEditTimeReport(report)}
                              icon={<Edit3 size={12} />}
                              variant="primary"
                              size="sm"
                            >
                              Redigera
                            </ActionButton>
                            <ActionButton
                              onClick={() => handleDeleteTimeReport(report.id)}
                              icon={<Trash2 size={12} />}
                              variant="danger"
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
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      borderRadius: borderRadius.xl,
                      boxShadow: '0 25px 50px rgba(59, 130, 246, 0.4)'
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
                              .filter(r => r.fakturerbar !== false && r.godkand === true)
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
                              .filter(r => r.fakturerbar !== false && r.godkand === true)
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

// ApprovalBadge component for changing approval status
function ApprovalBadge({ approved, reportId, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);

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

  useEffect(() => {
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
            backgroundColor: 'rgba(30, 41, 59, 0.98)',
            backdropFilter: 'blur(20px)',
            borderRadius: borderRadius.lg,
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
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
                backgroundColor: approved === option.value ? 'rgba(255, 255, 255, 0.1)' : "transparent",
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
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
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
