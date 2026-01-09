import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  User,
  MapPin,
  Phone,
  Mail,
  Building2,
  FileText,
  CreditCard,
  Home,
  Save,
  Trash2,
  ArrowLeft,
  Edit3,
  CheckCircle,
  X,
  ShoppingCart,
  DollarSign,
  Clock
} from "lucide-react";
import ActionButton from "../components/shared/ActionButton";
import Badge from "../components/shared/Badge";
import Toast from "../components/shared/Toast";
import FormField from "../components/shared/FormField";
import { spacing, borderRadius, typography, transitions } from "../components/shared/theme";

// Dark theme styles
const darkCardStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(20px)',
  borderRadius: borderRadius.xl,
  padding: spacing[8],
  marginBottom: spacing[6],
  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  transition: `all ${transitions.base}`,
};

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

const darkSectionHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: spacing[3],
  fontSize: typography.fontSize.xl,
  fontWeight: typography.fontWeight.semibold,
  color: '#fff',
  marginBottom: spacing[6],
  paddingBottom: spacing[4],
  borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
};

// Helper Components
function StatCard({ icon, label, value, color }) {
  return (
    <div
      className="card-enter hover-lift"
      style={{
        ...darkCardStyle,
        display: "flex",
        alignItems: "center",
        gap: spacing[4],
        marginBottom: 0,
      }}
    >
      <div style={{
        width: "56px",
        height: "56px",
        borderRadius: borderRadius.xl,
        backgroundColor: `${color}20`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        {React.cloneElement(icon, { size: 28, color: color })}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: typography.fontSize.sm,
          color: '#94a3b8',
          marginBottom: spacing[1]
        }}>
          {label}
        </div>
        <div style={{
          fontSize: typography.fontSize['3xl'],
          fontWeight: typography.fontWeight.bold,
          color: '#fff'
        }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children, icon }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: `${spacing[3]} ${spacing[6]}`,
        border: "none",
        borderBottom: active ? '3px solid #60a5fa' : "3px solid transparent",
        backgroundColor: "transparent",
        cursor: "pointer",
        fontWeight: active ? typography.fontWeight.semibold : typography.fontWeight.medium,
        fontSize: typography.fontSize.base,
        color: active ? '#60a5fa' : '#94a3b8',
        transition: `all ${transitions.base}`,
        display: "flex",
        alignItems: "center",
        gap: spacing[2]
      }}
    >
      {icon && React.cloneElement(icon, { size: 18 })}
      {children}
    </button>
  );
}

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userDetails, currentUser } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("details"); // "details" or "orders"
  const [toast, setToast] = useState(null);
  const [orderFilter, setOrderFilter] = useState("all"); // "all", "Planerad", "Pågående", "Färdig"

  useEffect(() => {
    const fetchData = async () => {
      // Wait for BOTH currentUser AND userDetails to ensure auth session is ready
      if (!currentUser) {
        console.log('⏳ CustomerDetails: Waiting for currentUser (auth session) to load...');
        return;
      }

      if (!userDetails) {
        console.log('⏳ CustomerDetails: Waiting for userDetails to load...');
        return;
      }

      console.log('🔍 CustomerDetails: Fetching customer details for ID:', id);

      try {
        // Fetch customer
        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("*")
          .eq("id", id)
          .single();

        if (customerError) {
          console.error("❌ Error fetching customer:", customerError);
          setToast({ message: "Kunden hittades inte.", type: "error" });
          return;
        }

        console.log('✅ Customer fetched successfully:', customerData.name);

        // Convert snake_case to camelCase
        const camelCaseCustomer = {
          name: customerData.name,
          customerNumber: customerData.customer_number,
          orgNr: customerData.org_nr,
          address: customerData.address,
          zipCity: customerData.zip_city,
          country: customerData.country,
          phone: customerData.phone,
          email: customerData.email,
          vatNr: customerData.vat_nr,
          paymentTerms: customerData.payment_terms,
          invoiceBy: customerData.invoice_by,
          invoiceEmail: customerData.invoice_email,
          invoiceAddress: customerData.invoice_address,
          rotCustomer: customerData.rot_customer,
          rotPersonnummer: customerData.rot_personnummer,
          propertyId: customerData.property_id,
          rutCustomer: customerData.rut_customer,
          rutPersonnummer: customerData.rut_personnummer,
          organizationId: customerData.organization_id,
          createdAt: customerData.created_at,
          updatedAt: customerData.updated_at
        };
        setCustomer(camelCaseCustomer);

        // Fetch orders for this customer
        // If organizationId is available, filter by it; otherwise fetch all orders for customer
        let ordersQuery = supabase
          .from("orders")
          .select("*")
          .eq("customer_id", id);

        if (userDetails.organizationId) {
          ordersQuery = ordersQuery.eq("organization_id", userDetails.organizationId);
        }

        const { data: ordersData, error: ordersError } = await ordersQuery;

        if (ordersError) {
          console.error("❌ Error fetching orders:", ordersError);
          setToast({ message: "Kunde inte hämta ordrar.", type: "error" });
          return;
        }

        console.log('✅ Orders fetched successfully:', ordersData?.length || 0, 'orders');

        // Convert snake_case to camelCase for orders
        const camelCaseOrders = (ordersData || []).map(order => ({
          id: order.id,
          orderNumber: order.order_number,
          customerId: order.customer_id,
          title: order.title,
          description: order.description,
          status: order.status,
          priority: order.priority,
          workType: order.work_type,
          billingType: order.billing_type,
          fixedPrice: order.fixed_price,
          deadline: order.deadline,
          estimatedTime: order.estimated_time,
          assignedTo: order.assigned_to,
          billable: order.billable,
          organizationId: order.organization_id,
          createdAt: order.created_at,
          updatedAt: order.updated_at
        }));
        setOrders(camelCaseOrders);
      } catch (err) {
        console.error("❌ Error fetching data:", err);
        setToast({ message: "Kunde inte hämta data.", type: "error" });
      }
    };
    fetchData();
  }, [id, userDetails, currentUser]);

  const handleChange = (e) => {
    setCustomer(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    try {
      console.log('💾 Saving customer:', customer);

      // Convert camelCase to snake_case for database
      // Only include fields that exist in the database schema
      const snakeCaseData = {
        name: customer.name || '',
        customer_number: customer.customerNumber || '',
        org_nr: customer.orgNr || '',
        address: customer.address || '',
        zip_code: customer.zipCode || '',
        city: customer.city || '',
        phone: customer.phone || '',
        email: customer.email || '',
        payment_terms: customer.paymentTerms || '',
        invoice_by: customer.invoiceBy || '',
        reference_person: customer.referencePerson || '',
        rot_customer: customer.rotCustomer || 'Nej',
        rut_customer: customer.rutCustomer || 'Nej',
        updated_at: new Date().toISOString()
      };

      console.log('💾 Data to save:', snakeCaseData);

      const { error } = await supabase
        .from("customers")
        .update(snakeCaseData)
        .eq("id", id);

      if (error) {
        console.error('❌ Save error:', error);
        throw error;
      }

      console.log('✅ Customer saved successfully');
      setToast({ message: "Kund sparad!", type: "success" });
      setIsEditing(false);
    } catch (err) {
      console.error('❌ Error saving customer:', err);
      setToast({ message: "Fel vid sparande: " + err.message, type: "error" });
    }
  };

  const handleDelete = async () => {
    if (orders.length > 0) {
      if (!window.confirm(`Kunden har ${orders.length} arbetsordrar. Vill du verkligen ta bort kunden?`)) {
        return;
      }
    } else {
      if (!window.confirm("Vill du verkligen ta bort kunden?")) {
        return;
      }
    }

    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      setToast({ message: "Kund borttagen!", type: "success" });
      setTimeout(() => navigate("/customers"), 1000);
    } catch (err) {
      setToast({ message: "Fel vid borttagning: " + err.message, type: "error" });
    }
  };

  if (!customer) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <div style={{ textAlign: "center", color: '#94a3b8' }}>
          Laddar kunddata...
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === "Färdig").length;
  const totalValue = orders.reduce((sum, o) => sum + (parseFloat(o.fixedPrice) || 0), 0);
  const avgValue = totalOrders > 0 ? totalValue / totalOrders : 0;

  return (
    <div className="page-enter" style={{ maxWidth: "1200px", margin: "0 auto", padding: spacing[8] }}>
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: spacing[8] }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: spacing[2]
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: spacing[3] }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: borderRadius.xl,
              backgroundColor: customer.orgNr ? 'rgba(251, 191, 36, 0.2)' : 'rgba(96, 165, 250, 0.2)',
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {customer.orgNr ? (
                <Building2 size={24} color="#fbbf24" />
              ) : (
                <User size={24} color="#60a5fa" />
              )}
            </div>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: typography.fontSize['4xl'],
                fontWeight: typography.fontWeight.bold,
                color: '#fff'
              }}>
                {customer.name}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: spacing[4], marginTop: spacing[1] }}>
                <p style={{ color: '#94a3b8', fontSize: typography.fontSize.base, margin: 0 }}>
                  Kundnummer: #{customer.customerNumber}
                </p>
                {(customer.rotCustomer === "Ja" || customer.rutCustomer === "Ja") && (
                  <div style={{ display: "flex", gap: spacing[2] }}>
                    {customer.rotCustomer === "Ja" && (
                      <Badge variant="success">ROT</Badge>
                    )}
                    {customer.rutCustomer === "Ja" && (
                      <Badge variant="info">RUT</Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <ActionButton
            onClick={() => navigate("/customers")}
            icon={<ArrowLeft size={18} />}
            variant="secondary"
          >
            Tillbaka
          </ActionButton>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: spacing[6],
        marginBottom: spacing[8]
      }}>
        <StatCard
          icon={<ShoppingCart />}
          label="Totalt antal ordrar"
          value={totalOrders}
          color="#60a5fa"
        />
        <StatCard
          icon={<CheckCircle />}
          label="Färdiga ordrar"
          value={completedOrders}
          color="#10b981"
        />
        <StatCard
          icon={<DollarSign />}
          label="Totalt värde"
          value={`${totalValue.toLocaleString('sv-SE')} kr`}
          color="#fbbf24"
        />
        <StatCard
          icon={<Clock />}
          label="Snitt per order"
          value={`${avgValue.toLocaleString('sv-SE')} kr`}
          color="#3b82f6"
        />
      </div>

      {/* Tabs */}
      <div className="card-enter" style={{ ...darkCardStyle, padding: spacing[2], marginBottom: 0 }}>
        <div style={{ display: "flex", gap: spacing[2] }}>
          <TabButton
            active={activeTab === "details"}
            onClick={() => setActiveTab("details")}
            icon={<User />}
          >
            Kunddetaljer
          </TabButton>
          <TabButton
            active={activeTab === "orders"}
            onClick={() => setActiveTab("orders")}
            icon={<ShoppingCart />}
          >
            Arbetsordrar ({totalOrders})
          </TabButton>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "details" && (
        <>
          {/* Action Buttons */}
          <div className="card-enter" style={{ ...darkCardStyle, padding: spacing[4] }}>
            <div style={{ display: "flex", gap: spacing[4], justifyContent: "flex-end", flexWrap: "wrap" }}>
              {!isEditing ? (
                <ActionButton
                  onClick={() => setIsEditing(true)}
                  icon={<Edit3 size={18} />}
                  variant="primary"
                >
                  Redigera
                </ActionButton>
              ) : (
                <>
                  <ActionButton
                    onClick={handleSave}
                    icon={<Save size={18} />}
                    variant="success"
                  >
                    Spara ändringar
                  </ActionButton>
                  <ActionButton
                    onClick={() => {
                      setIsEditing(false);
                      setToast(null);
                    }}
                    icon={<X size={18} />}
                    variant="secondary"
                  >
                    Avbryt
                  </ActionButton>
                </>
              )}
              <ActionButton
                onClick={handleDelete}
                icon={<Trash2 size={18} />}
                variant="danger"
              >
                Radera kund
              </ActionButton>
            </div>
          </div>

          {/* Customer Details Forms */}
          <div className="card-enter" style={darkCardStyle}>
            <div style={darkSectionHeaderStyle}>
              <User size={20} color="#60a5fa" />
              Allmän information
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[6] }}>
              <FormField label="Kundnamn" icon={<User size={16} />}>
                <input
                  name="name"
                  value={customer.name || ""}
                  onChange={handleChange}
                  style={darkInputStyle}
                  disabled={!isEditing}
                />
              </FormField>

              <FormField label="Kundnummer" icon={<FileText size={16} />}>
                <input
                  value={customer.customerNumber || ""}
                  readOnly
                  style={{
                    ...darkInputStyle,
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    color: '#94a3b8',
                    cursor: "not-allowed"
                  }}
                />
              </FormField>
            </div>

            <FormField label="Organisationsnummer" icon={<Building2 size={16} />}>
              <input
                name="orgNr"
                value={customer.orgNr || ""}
                onChange={handleChange}
                style={darkInputStyle}
                disabled={!isEditing}
                placeholder="XXXXXX-XXXX"
              />
            </FormField>

            <FormField label="Adress" icon={<MapPin size={16} />}>
              <input
                name="address"
                value={customer.address || ""}
                onChange={handleChange}
                style={darkInputStyle}
                disabled={!isEditing}
              />
            </FormField>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[6] }}>
              <FormField label="Postnummer & Ort" icon={<MapPin size={16} />}>
                <input
                  name="zipCity"
                  value={customer.zipCity || ""}
                  onChange={handleChange}
                  style={darkInputStyle}
                  disabled={!isEditing}
                />
              </FormField>

              <FormField label="Land" icon={<MapPin size={16} />}>
                <input
                  name="country"
                  value={customer.country || ""}
                  onChange={handleChange}
                  style={darkInputStyle}
                  disabled={!isEditing}
                />
              </FormField>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[6] }}>
              <FormField label="Telefon" icon={<Phone size={16} />}>
                <input
                  name="phone"
                  value={customer.phone || ""}
                  onChange={handleChange}
                  style={darkInputStyle}
                  disabled={!isEditing}
                />
              </FormField>

              <FormField label="E-post" icon={<Mail size={16} />}>
                <input
                  type="email"
                  name="email"
                  value={customer.email || ""}
                  onChange={handleChange}
                  style={darkInputStyle}
                  disabled={!isEditing}
                />
              </FormField>
            </div>
          </div>

          {/* Invoicing */}
          <div className="card-enter" style={darkCardStyle}>
            <div style={darkSectionHeaderStyle}>
              <CreditCard size={20} color="#60a5fa" />
              Fakturering
            </div>

            <FormField label="Momsregistreringsnummer (VAT)" icon={<FileText size={16} />}>
              <input
                name="vatNr"
                value={customer.vatNr || ""}
                onChange={handleChange}
                style={darkInputStyle}
                disabled={!isEditing}
              />
            </FormField>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[6] }}>
              <FormField label="Betalningsvillkor" icon={<CreditCard size={16} />}>
                <select
                  name="paymentTerms"
                  value={customer.paymentTerms || ""}
                  onChange={handleChange}
                  style={darkInputStyle}
                  disabled={!isEditing}
                >
                  <option value="" style={{ backgroundColor: '#1a1a2e' }}>Välj...</option>
                  <option value="10 dagar" style={{ backgroundColor: '#1a1a2e' }}>10 dagar</option>
                  <option value="15 dagar" style={{ backgroundColor: '#1a1a2e' }}>15 dagar</option>
                  <option value="20 dagar" style={{ backgroundColor: '#1a1a2e' }}>20 dagar</option>
                  <option value="25 dagar" style={{ backgroundColor: '#1a1a2e' }}>25 dagar</option>
                  <option value="30 dagar" style={{ backgroundColor: '#1a1a2e' }}>30 dagar</option>
                </select>
              </FormField>

              <FormField label="Fakturor skickas med" icon={<Mail size={16} />}>
                <select
                  name="invoiceBy"
                  value={customer.invoiceBy || ""}
                  onChange={handleChange}
                  style={darkInputStyle}
                  disabled={!isEditing}
                >
                  <option value="" style={{ backgroundColor: '#1a1a2e' }}>Välj metod</option>
                  <option value="E-post" style={{ backgroundColor: '#1a1a2e' }}>E-post</option>
                  <option value="Brev" style={{ backgroundColor: '#1a1a2e' }}>Brev</option>
                </select>
              </FormField>
            </div>

            <FormField label="E-post för fakturor" icon={<Mail size={16} />}>
              <input
                type="email"
                name="invoiceEmail"
                value={customer.invoiceEmail || ""}
                onChange={handleChange}
                style={darkInputStyle}
                disabled={!isEditing}
              />
            </FormField>

            <FormField label="Fakturaadress" icon={<MapPin size={16} />}>
              <input
                name="invoiceAddress"
                value={customer.invoiceAddress || ""}
                onChange={handleChange}
                style={darkInputStyle}
                disabled={!isEditing}
              />
            </FormField>
          </div>

          {/* ROT & RUT */}
          <div className="card-enter" style={darkCardStyle}>
            <div style={darkSectionHeaderStyle}>
              <Home size={20} color="#60a5fa" />
              ROT & RUT-avdrag
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[6], marginBottom: spacing[6] }}>
              <FormField label="ROT-kund" icon={<Home size={16} />}>
                <select
                  name="rotCustomer"
                  value={customer.rotCustomer || "Nej"}
                  onChange={handleChange}
                  style={darkInputStyle}
                  disabled={!isEditing}
                >
                  <option value="Nej" style={{ backgroundColor: '#1a1a2e' }}>Nej</option>
                  <option value="Ja" style={{ backgroundColor: '#1a1a2e' }}>Ja</option>
                </select>
              </FormField>

              <FormField label="RUT-kund" icon={<Home size={16} />}>
                <select
                  name="rutCustomer"
                  value={customer.rutCustomer || "Nej"}
                  onChange={handleChange}
                  style={darkInputStyle}
                  disabled={!isEditing}
                >
                  <option value="Nej" style={{ backgroundColor: '#1a1a2e' }}>Nej</option>
                  <option value="Ja" style={{ backgroundColor: '#1a1a2e' }}>Ja</option>
                </select>
              </FormField>
            </div>

            {customer.rotCustomer === "Ja" && (
              <div style={{
                padding: spacing[6],
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '2px solid rgba(16, 185, 129, 0.3)',
                borderRadius: borderRadius.lg,
                marginBottom: spacing[6]
              }}>
                <h4 style={{
                  margin: `0 0 ${spacing[4]} 0`,
                  color: '#10b981',
                  fontWeight: typography.fontWeight.semibold,
                  fontSize: typography.fontSize.lg
                }}>
                  ROT-uppgifter
                </h4>
                <FormField label="Personnummer" icon={<User size={16} />}>
                  <input
                    name="rotPersonnummer"
                    value={customer.rotPersonnummer || ""}
                    onChange={handleChange}
                    style={darkInputStyle}
                    disabled={!isEditing}
                  />
                </FormField>
                <FormField label="Fastighetsbeteckning" icon={<MapPin size={16} />}>
                  <input
                    name="propertyId"
                    value={customer.propertyId || ""}
                    onChange={handleChange}
                    style={darkInputStyle}
                    disabled={!isEditing}
                  />
                </FormField>
              </div>
            )}

            {customer.rutCustomer === "Ja" && (
              <div style={{
                padding: spacing[6],
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '2px solid rgba(59, 130, 246, 0.3)',
                borderRadius: borderRadius.lg
              }}>
                <h4 style={{
                  margin: `0 0 ${spacing[4]} 0`,
                  color: '#60a5fa',
                  fontWeight: typography.fontWeight.semibold,
                  fontSize: typography.fontSize.lg
                }}>
                  RUT-uppgifter
                </h4>
                <FormField label="Personnummer" icon={<User size={16} />}>
                  <input
                    name="rutPersonnummer"
                    value={customer.rutPersonnummer || ""}
                    onChange={handleChange}
                    style={darkInputStyle}
                    disabled={!isEditing}
                  />
                </FormField>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "orders" && (
        <div className="card-enter" style={darkCardStyle}>
          {/* Filter and Create Button */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: spacing[6],
            flexWrap: "wrap",
            gap: spacing[4]
          }}>
            <div style={{ display: "flex", gap: spacing[2], flexWrap: "wrap" }}>
              <button
                onClick={() => setOrderFilter("all")}
                style={{
                  padding: `${spacing[2]} ${spacing[4]}`,
                  border: `2px solid ${orderFilter === "all" ? '#60a5fa' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: borderRadius.lg,
                  cursor: "pointer",
                  backgroundColor: orderFilter === "all" ? '#60a5fa' : 'rgba(255, 255, 255, 0.05)',
                  color: orderFilter === "all" ? "white" : '#94a3b8',
                  fontWeight: typography.fontWeight.semibold,
                  fontSize: typography.fontSize.sm,
                  transition: "all 0.2s ease"
                }}
              >
                Alla ({orders.length})
              </button>
              <button
                onClick={() => setOrderFilter("Planerad")}
                style={{
                  padding: `${spacing[2]} ${spacing[4]}`,
                  border: `2px solid ${orderFilter === "Planerad" ? '#60a5fa' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: borderRadius.lg,
                  cursor: "pointer",
                  backgroundColor: orderFilter === "Planerad" ? '#60a5fa' : 'rgba(255, 255, 255, 0.05)',
                  color: orderFilter === "Planerad" ? "white" : '#94a3b8',
                  fontWeight: typography.fontWeight.semibold,
                  fontSize: typography.fontSize.sm,
                  transition: "all 0.2s ease"
                }}
              >
                Planerad ({orders.filter(o => o.status === "Planerad").length})
              </button>
              <button
                onClick={() => setOrderFilter("Pågående")}
                style={{
                  padding: `${spacing[2]} ${spacing[4]}`,
                  border: `2px solid ${orderFilter === "Pågående" ? '#60a5fa' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: borderRadius.lg,
                  cursor: "pointer",
                  backgroundColor: orderFilter === "Pågående" ? '#60a5fa' : 'rgba(255, 255, 255, 0.05)',
                  color: orderFilter === "Pågående" ? "white" : '#94a3b8',
                  fontWeight: typography.fontWeight.semibold,
                  fontSize: typography.fontSize.sm,
                  transition: "all 0.2s ease"
                }}
              >
                Pågående ({orders.filter(o => o.status === "Pågående").length})
              </button>
              <button
                onClick={() => setOrderFilter("Färdig")}
                style={{
                  padding: `${spacing[2]} ${spacing[4]}`,
                  border: `2px solid ${orderFilter === "Färdig" ? '#60a5fa' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: borderRadius.lg,
                  cursor: "pointer",
                  backgroundColor: orderFilter === "Färdig" ? '#60a5fa' : 'rgba(255, 255, 255, 0.05)',
                  color: orderFilter === "Färdig" ? "white" : '#94a3b8',
                  fontWeight: typography.fontWeight.semibold,
                  fontSize: typography.fontSize.sm,
                  transition: "all 0.2s ease"
                }}
              >
                Färdig ({orders.filter(o => o.status === "Färdig").length})
              </button>
            </div>
            <Link
              to={`/orders/new?customerId=${id}`}
              style={{ textDecoration: "none" }}
            >
              <ActionButton icon={<ShoppingCart size={18} />} variant="primary">
                Skapa ny order
              </ActionButton>
            </Link>
          </div>

          {orders.filter(o => orderFilter === "all" || o.status === orderFilter).length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                    <th style={thStyle}>Ordernr</th>
                    <th style={thStyle}>Titel</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Pris</th>
                    <th style={thStyle}>Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.filter(o => orderFilter === "all" || o.status === orderFilter).map((order) => (
                    <tr key={order.id} style={trStyle}>
                      <td style={tdStyle}>
                        <Link to={`/orders/${order.id}`} style={linkStyle}>
                          #{order.orderNumber || "-"}
                        </Link>
                      </td>
                      <td style={tdStyle}>
                        <Link to={`/orders/${order.id}`} style={{ ...linkStyle, fontWeight: "600" }}>
                          {order.title || "-"}
                        </Link>
                      </td>
                      <td style={tdStyle}>
                        <Badge variant={getStatusVariant(order.status)}>
                          {order.status || "Okänd"}
                        </Badge>
                      </td>
                      <td style={tdStyle}>
                        {order.fixedPrice ? `${parseFloat(order.fixedPrice).toLocaleString('sv-SE')} kr` : "-"}
                      </td>
                      <td style={tdStyle}>
                        {order.deadline ? new Date(order.deadline).toLocaleDateString('sv-SE') : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{
              textAlign: "center",
              padding: spacing[12],
              color: '#94a3b8'
            }}>
              <ShoppingCart size={48} color="#475569" style={{ marginBottom: spacing[4] }} />
              <p style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.semibold,
                marginBottom: spacing[2],
                color: '#e2e8f0'
              }}>
                {orderFilter === "all" ? "Inga arbetsordrar ännu" : `Inga ordrar med status "${orderFilter}"`}
              </p>
              <p style={{
                fontSize: typography.fontSize.base,
                marginBottom: spacing[6],
                color: '#94a3b8'
              }}>
                {orderFilter === "all"
                  ? "Denna kund har inga arbetsordrar registrerade"
                  : `Filtrera till "Alla" för att se alla ordrar`}
              </p>
              {orderFilter === "all" && (
                <Link to={`/orders/new?customerId=${id}`} style={{ textDecoration: "none" }}>
                  <ActionButton icon={<ShoppingCart size={18} />} variant="primary">
                    Skapa ny order
                  </ActionButton>
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper functions
function getStatusVariant(status) {
  switch (status) {
    case "Färdig":
      return "success";
    case "Pågående":
      return "info";
    case "Planerad":
      return "warning";
    default:
      return "neutral";
  }
}

// Table styles
const thStyle = {
  padding: spacing[4],
  textAlign: "left",
  fontSize: typography.fontSize.xs,
  fontWeight: typography.fontWeight.bold,
  color: '#94a3b8',
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  backgroundColor: 'rgba(255, 255, 255, 0.03)'
};

const tdStyle = {
  padding: spacing[4],
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  color: '#fff',
  fontSize: typography.fontSize.sm
};

const trStyle = {
  transition: "background-color 0.2s ease"
};

const linkStyle = {
  color: '#60a5fa',
  textDecoration: "none",
  transition: "color 0.2s ease",
  fontWeight: typography.fontWeight.medium
};
