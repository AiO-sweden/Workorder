import React, { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
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
import { cardStyle, inputStyle, sectionHeaderStyle } from "../components/shared/styles";
import { colors, spacing, borderRadius, typography } from "../components/shared/theme";

// Helper Components
function StatCard({ icon, label, value, color }) {
  return (
    <div
      className="card-enter hover-lift"
      style={{
        ...cardStyle,
        display: "flex",
        alignItems: "center",
        gap: spacing[4],
        marginBottom: 0,
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{
        width: "56px",
        height: "56px",
        borderRadius: borderRadius.xl,
        backgroundColor: `${color}15`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        {React.cloneElement(icon, { size: 28, color: color })}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: typography.fontSize.sm,
          color: colors.neutral[500],
          marginBottom: spacing[1]
        }}>
          {label}
        </div>
        <div style={{
          fontSize: typography.fontSize['3xl'],
          fontWeight: typography.fontWeight.bold,
          color: colors.neutral[900]
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
        borderBottom: active ? `3px solid ${colors.primary[500]}` : "3px solid transparent",
        backgroundColor: "transparent",
        cursor: "pointer",
        fontWeight: active ? typography.fontWeight.semibold : typography.fontWeight.medium,
        fontSize: typography.fontSize.base,
        color: active ? colors.primary[600] : colors.neutral[500],
        transition: "all 0.2s ease",
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
  const { userDetails } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("details"); // "details" or "orders"
  const [toast, setToast] = useState(null);
  const [orderFilter, setOrderFilter] = useState("all"); // "all", "Planerad", "Pågående", "Färdig"

  useEffect(() => {
    const fetchData = async () => {
      if (!userDetails?.organizationId) return;

      try {
        // Fetch customer
        const docRef = doc(db, "customers", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCustomer(docSnap.data());
        } else {
          setToast({ message: "Kunden hittades inte.", type: "error" });
          return;
        }

        // Fetch orders for this customer with organizationId filter
        const ordersQuery = query(
          collection(db, "orders"),
          where("customerId", "==", id),
          where("organizationId", "==", userDetails.organizationId)
        );
        const ordersSnap = await getDocs(ordersQuery);
        const ordersList = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOrders(ordersList);
      } catch (err) {
        console.error("Error fetching data:", err);
        setToast({ message: "Kunde inte hämta data.", type: "error" });
      }
    };
    fetchData();
  }, [id, userDetails]);

  const handleChange = (e) => {
    setCustomer(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    // Validation
    if (customer.rotCustomer === "Ja" && (!customer.rotPersonnummer?.trim() || !customer.propertyId?.trim())) {
      setToast({ message: "Fyll i både personnummer och fastighetsbeteckning för ROT-kund.", type: "error" });
      return;
    }

    if (customer.rutCustomer === "Ja" && !customer.rutPersonnummer?.trim()) {
      setToast({ message: "Fyll i personnummer för RUT-kund.", type: "error" });
      return;
    }

    try {
      const docRef = doc(db, "customers", id);
      await updateDoc(docRef, customer);
      setToast({ message: "Kund sparad!", type: "success" });
      setIsEditing(false);
    } catch (err) {
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
      await deleteDoc(doc(db, "customers", id));
      setToast({ message: "Kund borttagen!", type: "success" });
      setTimeout(() => navigate("/customers"), 1000);
    } catch (err) {
      setToast({ message: "Fel vid borttagning: " + err.message, type: "error" });
    }
  };

  if (!customer) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <div style={{ textAlign: "center", color: colors.neutral[500] }}>
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
              backgroundColor: customer.orgNr ? `${colors.warning[500]}15` : `${colors.primary[500]}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {customer.orgNr ? (
                <Building2 size={24} color={colors.warning[500]} />
              ) : (
                <User size={24} color={colors.primary[500]} />
              )}
            </div>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: typography.fontSize['4xl'],
                fontWeight: typography.fontWeight.bold,
                color: colors.neutral[900]
              }}>
                {customer.name}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: spacing[4], marginTop: spacing[1] }}>
                <p style={{ color: colors.neutral[500], fontSize: typography.fontSize.base, margin: 0 }}>
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
          color={colors.primary[500]}
        />
        <StatCard
          icon={<CheckCircle />}
          label="Färdiga ordrar"
          value={completedOrders}
          color={colors.success[500]}
        />
        <StatCard
          icon={<DollarSign />}
          label="Totalt värde"
          value={`${totalValue.toLocaleString('sv-SE')} kr`}
          color={colors.warning[500]}
        />
        <StatCard
          icon={<Clock />}
          label="Snitt per order"
          value={`${avgValue.toLocaleString('sv-SE')} kr`}
          color={colors.primary[600]}
        />
      </div>

      {/* Tabs */}
      <div className="card-enter" style={{ ...cardStyle, padding: spacing[2], marginBottom: 0 }}>
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
          <div className="card-enter" style={{ ...cardStyle, padding: spacing[4] }}>
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
          <div className="card-enter" style={cardStyle}>
            <div style={sectionHeaderStyle}>
              <User size={20} />
              Allmän information
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[6] }}>
              <FormField label="Kundnamn" icon={<User size={16} />}>
                <input
                  name="name"
                  value={customer.name || ""}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={!isEditing}
                />
              </FormField>

              <FormField label="Kundnummer" icon={<FileText size={16} />}>
                <input
                  value={customer.customerNumber || ""}
                  readOnly
                  style={{
                    ...inputStyle,
                    backgroundColor: colors.neutral[50],
                    color: colors.neutral[500],
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
                style={inputStyle}
                disabled={!isEditing}
                placeholder="XXXXXX-XXXX"
              />
            </FormField>

            <FormField label="Adress" icon={<MapPin size={16} />}>
              <input
                name="address"
                value={customer.address || ""}
                onChange={handleChange}
                style={inputStyle}
                disabled={!isEditing}
              />
            </FormField>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[6] }}>
              <FormField label="Postnummer & Ort" icon={<MapPin size={16} />}>
                <input
                  name="zipCity"
                  value={customer.zipCity || ""}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={!isEditing}
                />
              </FormField>

              <FormField label="Land" icon={<MapPin size={16} />}>
                <input
                  name="country"
                  value={customer.country || ""}
                  onChange={handleChange}
                  style={inputStyle}
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
                  style={inputStyle}
                  disabled={!isEditing}
                />
              </FormField>

              <FormField label="E-post" icon={<Mail size={16} />}>
                <input
                  type="email"
                  name="email"
                  value={customer.email || ""}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={!isEditing}
                />
              </FormField>
            </div>
          </div>

          {/* Invoicing */}
          <div className="card-enter" style={cardStyle}>
            <div style={sectionHeaderStyle}>
              <CreditCard size={20} />
              Fakturering
            </div>

            <FormField label="Momsregistreringsnummer (VAT)" icon={<FileText size={16} />}>
              <input
                name="vatNr"
                value={customer.vatNr || ""}
                onChange={handleChange}
                style={inputStyle}
                disabled={!isEditing}
              />
            </FormField>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[6] }}>
              <FormField label="Betalningsvillkor" icon={<CreditCard size={16} />}>
                <select
                  name="paymentTerms"
                  value={customer.paymentTerms || ""}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={!isEditing}
                >
                  <option value="">Välj...</option>
                  <option value="10 dagar">10 dagar</option>
                  <option value="15 dagar">15 dagar</option>
                  <option value="20 dagar">20 dagar</option>
                  <option value="25 dagar">25 dagar</option>
                  <option value="30 dagar">30 dagar</option>
                </select>
              </FormField>

              <FormField label="Fakturor skickas med" icon={<Mail size={16} />}>
                <select
                  name="invoiceBy"
                  value={customer.invoiceBy || ""}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={!isEditing}
                >
                  <option value="">Välj metod</option>
                  <option value="E-post">E-post</option>
                  <option value="Brev">Brev</option>
                </select>
              </FormField>
            </div>

            <FormField label="E-post för fakturor" icon={<Mail size={16} />}>
              <input
                type="email"
                name="invoiceEmail"
                value={customer.invoiceEmail || ""}
                onChange={handleChange}
                style={inputStyle}
                disabled={!isEditing}
              />
            </FormField>

            <FormField label="Fakturaadress" icon={<MapPin size={16} />}>
              <input
                name="invoiceAddress"
                value={customer.invoiceAddress || ""}
                onChange={handleChange}
                style={inputStyle}
                disabled={!isEditing}
              />
            </FormField>
          </div>

          {/* ROT & RUT */}
          <div className="card-enter" style={cardStyle}>
            <div style={sectionHeaderStyle}>
              <Home size={20} />
              ROT & RUT-avdrag
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[6], marginBottom: spacing[6] }}>
              <FormField label="ROT-kund" icon={<Home size={16} />}>
                <select
                  name="rotCustomer"
                  value={customer.rotCustomer || "Nej"}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={!isEditing}
                >
                  <option value="Nej">Nej</option>
                  <option value="Ja">Ja</option>
                </select>
              </FormField>

              <FormField label="RUT-kund" icon={<Home size={16} />}>
                <select
                  name="rutCustomer"
                  value={customer.rutCustomer || "Nej"}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={!isEditing}
                >
                  <option value="Nej">Nej</option>
                  <option value="Ja">Ja</option>
                </select>
              </FormField>
            </div>

            {customer.rotCustomer === "Ja" && (
              <div style={{
                padding: spacing[6],
                backgroundColor: colors.success[50],
                border: `2px solid ${colors.success[200]}`,
                borderRadius: borderRadius.lg,
                marginBottom: spacing[6]
              }}>
                <h4 style={{
                  margin: `0 0 ${spacing[4]} 0`,
                  color: colors.success[700],
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
                    style={inputStyle}
                    disabled={!isEditing}
                  />
                </FormField>
                <FormField label="Fastighetsbeteckning" icon={<MapPin size={16} />}>
                  <input
                    name="propertyId"
                    value={customer.propertyId || ""}
                    onChange={handleChange}
                    style={inputStyle}
                    disabled={!isEditing}
                  />
                </FormField>
              </div>
            )}

            {customer.rutCustomer === "Ja" && (
              <div style={{
                padding: spacing[6],
                backgroundColor: colors.primary[50],
                border: `2px solid ${colors.primary[200]}`,
                borderRadius: borderRadius.lg
              }}>
                <h4 style={{
                  margin: `0 0 ${spacing[4]} 0`,
                  color: colors.primary[700],
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
                    style={inputStyle}
                    disabled={!isEditing}
                  />
                </FormField>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "orders" && (
        <div className="card-enter" style={cardStyle}>
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
                  border: `2px solid ${colors.neutral[200]}`,
                  borderRadius: borderRadius.lg,
                  cursor: "pointer",
                  backgroundColor: orderFilter === "all" ? colors.primary[500] : "white",
                  color: orderFilter === "all" ? "white" : colors.neutral[600],
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
                  border: `2px solid ${colors.neutral[200]}`,
                  borderRadius: borderRadius.lg,
                  cursor: "pointer",
                  backgroundColor: orderFilter === "Planerad" ? colors.primary[500] : "white",
                  color: orderFilter === "Planerad" ? "white" : colors.neutral[600],
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
                  border: `2px solid ${colors.neutral[200]}`,
                  borderRadius: borderRadius.lg,
                  cursor: "pointer",
                  backgroundColor: orderFilter === "Pågående" ? colors.primary[500] : "white",
                  color: orderFilter === "Pågående" ? "white" : colors.neutral[600],
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
                  border: `2px solid ${colors.neutral[200]}`,
                  borderRadius: borderRadius.lg,
                  cursor: "pointer",
                  backgroundColor: orderFilter === "Färdig" ? colors.primary[500] : "white",
                  color: orderFilter === "Färdig" ? "white" : colors.neutral[600],
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
              color: colors.neutral[500]
            }}>
              <ShoppingCart size={48} color={colors.neutral[300]} style={{ marginBottom: spacing[4] }} />
              <p style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.semibold,
                marginBottom: spacing[2],
                color: colors.neutral[700]
              }}>
                {orderFilter === "all" ? "Inga arbetsordrar ännu" : `Inga ordrar med status "${orderFilter}"`}
              </p>
              <p style={{
                fontSize: typography.fontSize.base,
                marginBottom: spacing[6],
                color: colors.neutral[500]
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
  color: colors.neutral[600],
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  backgroundColor: colors.neutral[50]
};

const tdStyle = {
  padding: spacing[4],
  borderBottom: `1px solid ${colors.neutral[100]}`,
  color: colors.neutral[900],
  fontSize: typography.fontSize.sm
};

const trStyle = {
  transition: "background-color 0.2s ease"
};

const linkStyle = {
  color: colors.primary[600],
  textDecoration: "none",
  transition: "color 0.2s ease",
  fontWeight: typography.fontWeight.medium
};
