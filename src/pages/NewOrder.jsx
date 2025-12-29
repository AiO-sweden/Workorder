import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  FileText,
  User,
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  DollarSign,
  CheckCircle,
  X,
  Save,
  Plus,
  Building2,
  Phone,
  Mail,
  Briefcase,
  Tag,
  FileCheck,
  UserCircle,
  Hammer,
  Zap,
  Shield,
  Cpu,
  Home,
  Wrench,
  Building,
  MoreHorizontal,
  Settings
} from "lucide-react";

// Import shared components and styles
import {
  cardStyle,
  inputStyle,
  sectionHeaderStyle,
  colors,
  spacing,
  shadows,
  borderRadius,
  typography,
  transitions
} from '../components/shared/styles';
import ActionButton from '../components/shared/ActionButton';
import FormField from '../components/shared/FormField';
import Toast from '../components/shared/Toast';

// Available icons for work types
const AVAILABLE_ICONS = {
  Hammer, Zap, Shield, Cpu, Home, Wrench, Building, MoreHorizontal,
  Briefcase, User, Settings, DollarSign, Clock
};

// Default work types fallback
const DEFAULT_WORK_TYPES = [
  { id: "bygg", name: "Bygg", icon: "Hammer", color: "#f59e0b" },
  { id: "el", name: "El", icon: "Zap", color: "#eab308" },
  { id: "garanti", name: "Garanti", icon: "Shield", color: "#10b981" },
  { id: "it", name: "IT", icon: "Cpu", color: "#3b82f6" },
  { id: "rivning", name: "Rivning", icon: "Home", color: "#ef4444" },
  { id: "vvs", name: "VVS", icon: "Wrench", color: "#06b6d4" },
  { id: "anlaggning", name: "Anläggning", icon: "Building", color: "#8b5cf6" },
  { id: "ovrigt", name: "Övrigt", icon: "MoreHorizontal", color: "#64748b" }
];

export default function NewOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userDetails } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [workTypes, setWorkTypes] = useState(DEFAULT_WORK_TYPES);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    orderNumber: "",
    customerId: "",
    address: "",
    title: "",
    description: "",
    workType: "",
    estimatedTime: "",
    billable: true,
    billingType: "Löpande pris",
    fixedPrice: "",
    status: "Planerad",
    priority: "Mellan",
    deadline: "",
    assignedTo: "",
    materials: "",
    notes: ""
  });

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!userDetails) {
        console.log('⏳ NewOrder: Waiting for userDetails to load...');
        return;
      }

      if (!userDetails.organizationId) {
        console.log('⚠️ NewOrder: No organizationId, skipping customer fetch');
        return;
      }

      console.log('🔍 NewOrder: Fetching customers...');

      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('organization_id', userDetails.organizationId);

        if (error) throw error;

        // Convert from snake_case to camelCase
        const list = (data || []).map(customer => ({
          id: customer.id,
          customerNumber: customer.customer_number,
          name: customer.name,
          address: customer.address,
          orgNr: customer.org_nr
        }));

        setCustomers(list);
        console.log('✅ NewOrder: Fetched', list.length, 'customers');

        // Check if customerId is in URL params and pre-select customer
        const preselectedCustomerId = searchParams.get('customerId');
        if (preselectedCustomerId) {
          const preselectedCustomer = list.find(c => c.id === preselectedCustomerId);
          if (preselectedCustomer) {
            setForm(prev => ({
              ...prev,
              customerId: preselectedCustomer.id,
              address: preselectedCustomer.address || ""
            }));
          }
        }
      } catch (error) {
        console.error("❌ NewOrder: Error fetching customers:", error);
        setToast({ message: "Kunde inte hämta kundlista", type: "error" });
      }
    };

    const fetchWorkTypes = async () => {
      if (!userDetails) {
        console.log('⏳ NewOrder: Waiting for userDetails to load work types...');
        return;
      }

      if (!userDetails.organizationId) {
        console.log('⚠️ NewOrder: No organizationId, using default work types');
        return;
      }

      console.log('🔍 NewOrder: Fetching work types...');

      try {
        const { data, error } = await supabase
          .from('settings')
          .select('work_types')
          .eq('organization_id', userDetails.organizationId)
          .single();

        if (error) throw error;

        if (data && data.work_types) {
          setWorkTypes(data.work_types);
          console.log('✅ NewOrder: Fetched', data.work_types.length, 'work types');
        }
      } catch (error) {
        console.error("❌ NewOrder: Error fetching work types:", error);
        // Keep using default work types on error
      }
    };

    const generateOrderNumber = async () => {
      if (!userDetails) {
        console.log('⏳ NewOrder: Waiting for userDetails to generate order number...');
        return;
      }

      if (!userDetails.organizationId) {
        console.log('⚠️ NewOrder: No organizationId, using default order number');
        setForm(prev => ({ ...prev, orderNumber: '0001' }));
        return;
      }

      console.log('🔍 NewOrder: Generating order number...');

      try {
        const { data, error } = await supabase
          .from('orders')
          .select('id')
          .eq('organization_id', userDetails.organizationId);

        if (error) throw error;

        const nextNumber = (data?.length || 0) + 1;
        const paddedNumber = nextNumber.toString().padStart(4, '0');
        setForm(prev => ({ ...prev, orderNumber: paddedNumber }));
        console.log('✅ NewOrder: Generated order number:', paddedNumber);
      } catch (error) {
        console.error("❌ NewOrder: Error generating order number:", error);
        setForm(prev => ({ ...prev, orderNumber: '0001' }));
      }
    };

    fetchCustomers();
    fetchWorkTypes();
    generateOrderNumber();
  }, [searchParams, userDetails]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleWorkTypeChange = (type) => {
    // Om Garanti väljs, sätt billable till false automatiskt
    if (type.toLowerCase() === "garanti") {
      setForm({
        ...form,
        workType: type,
        billable: false
      });
    } else {
      setForm({ ...form, workType: type });
    }
    if (errors.workType) {
      setErrors({ ...errors, workType: "" });
    }
  };

  const handleCustomerChange = (e) => {
    const selected = customers.find(c => c.id === e.target.value);
    if (!selected) {
      setForm(prev => ({ ...prev, customerId: "", address: "" }));
      return;
    }
    setForm({
      ...form,
      customerId: selected.id,
      address: selected.address || ""
    });
    if (errors.customerId) {
      setErrors({ ...errors, customerId: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.customerId) newErrors.customerId = "Vänligen välj en kund";
    if (!form.title) newErrors.title = "Titel är obligatorisk";
    if (!form.workType) newErrors.workType = "Välj typ av arbete";
    if (!form.description) newErrors.description = "Beskrivning är obligatorisk";
    if (form.billable && form.billingType === "Fast pris" && !form.fixedPrice) {
      newErrors.fixedPrice = "Ange pris för fast pris";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setToast({ message: "Vänligen fyll i alla obligatoriska fält", type: "error" });
      return;
    }

    if (!userDetails?.organizationId) {
      setToast({ message: "Du måste vara inloggad för att skapa en order", type: "error" });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          order_number: form.orderNumber,
          customer_id: form.customerId,
          address: form.address,
          title: form.title,
          description: form.description,
          work_type: form.workType,
          estimated_time: form.estimatedTime ? parseFloat(form.estimatedTime) : null,
          billable: form.billable,
          billing_type: form.billingType,
          fixed_price: form.fixedPrice ? parseFloat(form.fixedPrice) : null,
          status: form.status,
          priority: form.priority,
          deadline: form.deadline || null,
          assigned_to: form.assignedTo ? [form.assignedTo] : [],
          organization_id: userDetails.organizationId,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      setToast({ message: "Arbetsorder skapad!", type: "success" });

      // Reset form and navigate
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);

    } catch (error) {
      console.error("Error creating order:", error);
      setToast({ message: "Ett fel uppstod när ordern skulle sparas", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = () => customers.find(c => c.id === form.customerId);

  // Kontrollera om fakturering ska vara disabled (för Garanti-jobb)
  const isBillingDisabled = form.workType.toLowerCase() === "garanti";

  return (
    <div className="page-enter" style={{
      maxWidth: "1000px",
      margin: "0 auto",
      fontFamily: typography.fontFamily.sans
    }}>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: spacing[8] }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: spacing[2] }}>
          <h1 style={{
            fontSize: typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.neutral[900],
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: spacing[3]
          }}>
            <FileText size={32} color={colors.primary[500]} />
            Ny arbetsorder
          </h1>
          <ActionButton
            variant="secondary"
            icon={<X size={18} />}
            onClick={() => navigate("/dashboard")}
          >
            Avbryt
          </ActionButton>
        </div>
        <p style={{ color: colors.neutral[600], fontSize: typography.fontSize.base, margin: 0 }}>
          Fyll i informationen nedan för att skapa en ny arbetsorder
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Order Number Card */}
        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <Tag size={20} color={colors.primary[500]} />
            <span>Ordernummer</span>
          </div>
          <input
            name="orderNumber"
            value={form.orderNumber}
            readOnly
            style={{
              ...inputStyle,
              backgroundColor: colors.neutral[50],
              color: colors.neutral[600],
              fontWeight: typography.fontWeight.semibold,
              fontSize: typography.fontSize.lg
            }}
          />
        </div>

        {/* Customer Selection Card */}
        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <User size={20} color={colors.primary[500]} />
            <span>Kundinformation</span>
          </div>

          <FormField label="Kund" required>
            <div style={{ position: "relative" }}>
              <User size={18} style={iconInInputStyle} />
              <select
                name="customerId"
                value={form.customerId}
                onChange={handleCustomerChange}
                style={{
                  ...inputStyle,
                  paddingLeft: spacing[10],
                  ...getInputErrorStyle(errors.customerId)
                }}
                required
              >
                <option value="">Välj kund</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.customerNumber ? `(#${c.customerNumber})` : ''}
                  </option>
                ))}
              </select>
            </div>
            {errors.customerId && <ErrorMessage message={errors.customerId} />}
          </FormField>

          {!form.customerId && (
            <ActionButton
              variant="secondary"
              icon={<Plus size={18} />}
              onClick={() => navigate("/customers/new")}
              fullWidth
            >
              Lägg till ny kund
            </ActionButton>
          )}

          <FormField label="Adress">
            <div style={{ position: "relative" }}>
              <MapPin size={18} style={iconInInputStyle} />
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                style={{ ...inputStyle, paddingLeft: spacing[10] }}
                placeholder="Adress fylls i automatiskt"
              />
            </div>
          </FormField>

          {/* Customer Details Display */}
          {form.customerId && selectedCustomer() && (
            <div style={{
              backgroundColor: colors.neutral[50],
              padding: spacing[5],
              borderRadius: borderRadius.xl,
              border: `1px solid ${colors.neutral[200]}`,
              marginTop: spacing[4]
            }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: spacing[4]
              }}>
                <InfoItem
                  icon={<Phone size={16} />}
                  label="Telefon"
                  value={selectedCustomer()?.phone || "—"}
                />
                <InfoItem
                  icon={<Mail size={16} />}
                  label="E-post"
                  value={selectedCustomer()?.email || "—"}
                />
                <InfoItem
                  icon={<DollarSign size={16} />}
                  label="Faktureringsmetod"
                  value={selectedCustomer()?.invoiceBy || "—"}
                />
                <InfoItem
                  icon={<FileCheck size={16} />}
                  label="Betalningsvillkor"
                  value={selectedCustomer()?.paymentTerms || "—"}
                />
              </div>
            </div>
          )}
        </div>

        {/* Order Details Card */}
        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <Briefcase size={20} color={colors.primary[500]} />
            <span>Orderdetaljer</span>
          </div>

          <FormField label="Titel / Namn på arbetsorder" required>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              style={{ ...inputStyle, ...getInputErrorStyle(errors.title) }}
              placeholder="T.ex. Installation av värmepump"
              required
            />
            {errors.title && <ErrorMessage message={errors.title} />}
          </FormField>

          <FormField label="Typ av arbete" required>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: spacing[3],
              marginBottom: spacing[4]
            }}>
              {workTypes.map(type => (
                <WorkTypeButton
                  key={type.id}
                  type={type}
                  selected={form.workType === type.name}
                  onClick={() => handleWorkTypeChange(type.name)}
                />
              ))}
            </div>
            {errors.workType && <ErrorMessage message={errors.workType} />}
          </FormField>

          <FormField label="Beskrivning" required>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              style={{
                ...inputStyle,
                minHeight: "120px",
                resize: "vertical",
                ...getInputErrorStyle(errors.description)
              }}
              placeholder="Beskriv arbetet som ska utföras..."
              required
            />
            {errors.description && <ErrorMessage message={errors.description} />}
          </FormField>

          <FormField label="Uppskattad tid">
            <div style={{ position: "relative" }}>
              <Clock size={18} style={iconInInputStyle} />
              <input
                name="estimatedTime"
                value={form.estimatedTime}
                onChange={handleChange}
                style={{ ...inputStyle, paddingLeft: spacing[10] }}
                placeholder="T.ex. 4 timmar"
              />
            </div>
          </FormField>

          <FormField label="Tilldelad till">
            <div style={{ position: "relative" }}>
              <UserCircle size={18} style={iconInInputStyle} />
              <input
                name="assignedTo"
                value={form.assignedTo}
                onChange={handleChange}
                style={{ ...inputStyle, paddingLeft: spacing[10] }}
                placeholder="Namn på ansvarig"
              />
            </div>
          </FormField>

          <FormField label="Material / Utrustning">
            <textarea
              name="materials"
              value={form.materials}
              onChange={handleChange}
              style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
              placeholder="Lista material eller utrustning som behövs..."
            />
          </FormField>

          <FormField label="Interna anteckningar">
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
              placeholder="Anteckningar som endast är synliga internt..."
            />
          </FormField>
        </div>

        {/* Status & Priority Card */}
        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <AlertCircle size={20} color={colors.primary[500]} />
            <span>Status & Prioritet</span>
          </div>

          <FormField label="Status">
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="Planerad">Planerad</option>
              <option value="Ej påbörjad">Ej påbörjad</option>
              <option value="Pågående">Pågående</option>
              <option value="Klar för fakturering">Klar för fakturering</option>
              <option value="Full fakturerad">Full fakturerad</option>
            </select>
          </FormField>

          <FormField label="Prioritet">
            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="Låg">Låg</option>
              <option value="Mellan">Mellan</option>
              <option value="Hög">Hög</option>
            </select>
          </FormField>

          <FormField label="Deadline">
            <input
              type="date"
              name="deadline"
              value={form.deadline}
              onChange={handleChange}
              style={inputStyle}
            />
          </FormField>
        </div>

        {/* Billing Card */}
        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <DollarSign size={20} color={colors.primary[500]} />
            <span>Fakturering</span>
          </div>

          {isBillingDisabled && (
            <div style={{
              backgroundColor: colors.warning[50],
              border: `1px solid ${colors.warning[500]}`,
              borderRadius: borderRadius.lg,
              padding: spacing[4],
              marginBottom: spacing[4],
              display: "flex",
              alignItems: "center",
              gap: spacing[3]
            }}>
              <AlertCircle size={20} color={colors.warning[600]} />
              <span style={{ color: colors.warning[900], fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium }}>
                Garantijobb är inte fakturerbara och fakturering är därför inaktiverad
              </span>
            </div>
          )}

          <div style={{ marginBottom: spacing[6] }}>
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[3],
              cursor: isBillingDisabled ? "not-allowed" : "pointer",
              padding: spacing[4],
              backgroundColor: form.billable ? colors.primary[50] : colors.neutral[50],
              borderRadius: borderRadius.lg,
              border: `2px solid ${form.billable ? colors.primary[500] : colors.neutral[200]}`,
              transition: `all ${transitions.base}`,
              opacity: isBillingDisabled ? 0.6 : 1
            }}>
              <input
                type="checkbox"
                name="billable"
                checked={form.billable}
                onChange={handleChange}
                disabled={isBillingDisabled}
                style={{
                  width: "20px",
                  height: "20px",
                  cursor: isBillingDisabled ? "not-allowed" : "pointer"
                }}
              />
              <span style={{
                fontWeight: typography.fontWeight.semibold,
                color: form.billable ? colors.primary[700] : colors.neutral[600],
                fontSize: typography.fontSize.base
              }}>
                Faktureringsbar order
              </span>
            </label>
          </div>

          {form.billable && !isBillingDisabled && (
            <>
              <FormField label="Faktureringsmetod">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[3] }}>
                  <BillingTypeButton
                    label="Löpande pris"
                    selected={form.billingType === "Löpande pris"}
                    onClick={() => setForm({ ...form, billingType: "Löpande pris" })}
                  />
                  <BillingTypeButton
                    label="Fast pris"
                    selected={form.billingType === "Fast pris"}
                    onClick={() => setForm({ ...form, billingType: "Fast pris" })}
                  />
                </div>
              </FormField>

              {form.billingType === "Fast pris" && (
                <FormField label="Pris (SEK)" required>
                  <div style={{ position: "relative" }}>
                    <DollarSign size={18} style={iconInInputStyle} />
                    <input
                      name="fixedPrice"
                      value={form.fixedPrice}
                      onChange={handleChange}
                      style={{ ...inputStyle, paddingLeft: spacing[10], ...getInputErrorStyle(errors.fixedPrice) }}
                      type="number"
                      placeholder="0"
                    />
                  </div>
                  {errors.fixedPrice && <ErrorMessage message={errors.fixedPrice} />}
                </FormField>
              )}
            </>
          )}
        </div>

        {/* Submit Buttons */}
        <div style={{
          display: "flex",
          gap: spacing[4],
          justifyContent: "flex-end",
          marginTop: spacing[8],
          paddingBottom: spacing[8]
        }}>
          <ActionButton
            variant="secondary"
            icon={<X size={20} />}
            onClick={() => navigate("/dashboard")}
          >
            Avbryt
          </ActionButton>

          <ActionButton
            variant="primary"
            icon={<Save size={20} />}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Sparar..." : "Spara arbetsorder"}
          </ActionButton>
        </div>
      </form>

      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          .page-enter {
            animation: fadeIn 0.3s ease-in;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .hover-lift {
            transition: all ${transitions.base};
          }

          .hover-lift:hover {
            transform: translateY(-2px);
          }
        `}
      </style>
    </div>
  );
}

// Helper Components
function InfoItem({ icon, label, value }) {
  return (
    <div>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: spacing[2],
        color: colors.neutral[600],
        fontSize: typography.fontSize.xs,
        marginBottom: spacing[1]
      }}>
        {icon}
        <span>{label}</span>
      </div>
      <div style={{
        color: colors.neutral[900],
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium
      }}>
        {value}
      </div>
    </div>
  );
}

function ErrorMessage({ message }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: spacing[2],
      color: colors.error[600],
      fontSize: typography.fontSize.sm,
      marginTop: spacing[2]
    }}>
      <AlertCircle size={14} />
      <span>{message}</span>
    </div>
  );
}

function WorkTypeButton({ type, selected, onClick }) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = AVAILABLE_ICONS[type.icon] || MoreHorizontal;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: spacing[3],
        borderRadius: borderRadius.lg,
        border: `2px solid ${selected ? type.color : colors.neutral[200]}`,
        backgroundColor: selected ? `${type.color}20` : (isHovered ? colors.neutral[50] : "white"),
        color: selected ? type.color : colors.neutral[600],
        cursor: "pointer",
        transition: `all ${transitions.base}`,
        fontSize: typography.fontSize.sm,
        fontWeight: selected ? typography.fontWeight.semibold : typography.fontWeight.medium,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: spacing[1],
        boxShadow: selected ? shadows.sm : "none"
      }}
    >
      <Icon size={24} color={selected ? type.color : colors.neutral[500]} />
      <span>{type.name}</span>
    </button>
  );
}

function BillingTypeButton({ label, selected, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: spacing[3],
        borderRadius: borderRadius.lg,
        border: `2px solid ${selected ? colors.primary[500] : colors.neutral[200]}`,
        backgroundColor: selected ? colors.primary[50] : (isHovered ? colors.neutral[50] : "white"),
        color: selected ? colors.primary[700] : colors.neutral[600],
        cursor: "pointer",
        transition: `all ${transitions.base}`,
        fontSize: typography.fontSize.sm,
        fontWeight: selected ? typography.fontWeight.semibold : typography.fontWeight.medium,
        boxShadow: selected ? shadows.sm : "none"
      }}
    >
      {label}
    </button>
  );
}

// Styles
const iconInInputStyle = {
  position: "absolute",
  left: spacing[3],
  top: "50%",
  transform: "translateY(-50%)",
  color: colors.neutral[400],
  pointerEvents: "none"
};

const getInputErrorStyle = (error) => {
  return error ? {
    borderColor: colors.error[500],
    backgroundColor: colors.error[50]
  } : {};
};
