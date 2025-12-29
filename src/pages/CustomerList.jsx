import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ImportCustomers from "../components/ImportCustomers";
import {
  Users,
  Search,
  Plus,
  Building2,
  Home,
  Mail,
  Phone,
  MapPin,
  Filter,
  X,
  ArrowUpDown,
  Upload
} from "lucide-react";
import { cardStyle, inputStyle, tableHeaderStyle, tableCellStyle } from "../components/shared/styles";
import { colors, spacing, shadows, borderRadius, transitions } from "../components/shared/theme";
import ActionButton from "../components/shared/ActionButton";
import StatsCard from "../components/shared/StatsCard";
import Badge from "../components/shared/Badge";
import "../components/shared/animations.css";

// Custom input style for search with icon
const searchInputStyle = {
  ...inputStyle,
  paddingLeft: "2.5rem",
};

// Helper Components
function FilterButton({ active, onClick, children, icon }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: `${spacing[2]} ${spacing[4]}`,
        border: `2px solid ${active ? colors.primary[500] : colors.neutral[200]}`,
        borderRadius: borderRadius.lg,
        cursor: "pointer",
        backgroundColor: active ? colors.primary[500] : "white",
        color: active ? "white" : colors.neutral[600],
        fontWeight: 600,
        fontSize: "0.875rem",
        transition: `all ${transitions.base}`,
        display: "flex",
        alignItems: "center",
        gap: spacing[2],
        boxShadow: active ? shadows.md : shadows.sm,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = colors.neutral[50];
          e.currentTarget.style.borderColor = colors.primary[300];
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = "white";
          e.currentTarget.style.borderColor = colors.neutral[200];
        }
      }}
    >
      {icon && React.cloneElement(icon, { size: 16 })}
      {children}
    </button>
  );
}

export default function CustomerList() {
  const { userDetails, currentUser } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // "all", "rot", "rut", "company", "private"
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const fetchingRef = React.useRef(false);
  const mountedRef = React.useRef(true);

  const fetchCustomers = React.useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (fetchingRef.current) {
      console.log('⏸️ Fetch already in progress, skipping...');
      return;
    }

    fetchingRef.current = true;
    console.log('📋 fetchCustomers called');
    try {
      // Fetch customers filtered by organization
      if (!userDetails?.organizationId) {
        console.log('⚠️ No organization ID, skipping customer fetch');
        fetchingRef.current = false;
        return;
      }

      console.log('🔍 Fetching customers for organization:', userDetails.organizationId);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('organization_id', userDetails.organizationId);

      console.log('🔍 Query completed. Error:', error, 'Data length:', data?.length);

      if (error) throw error;

      // Convert from snake_case to camelCase
      const list = (data || []).map(customer => ({
        id: customer.id,
        customerNumber: customer.customer_number,
        name: customer.name,
        orgNr: customer.org_nr,
        address: customer.address,
        zipCode: customer.zip_code,
        city: customer.city,
        phone: customer.phone,
        email: customer.email,
        invoiceBy: customer.invoice_by,
        paymentTerms: customer.payment_terms,
        referencePerson: customer.reference_person,
        rotCustomer: customer.rot_customer,
        rutCustomer: customer.rut_customer,
        createdAt: customer.created_at,
        updatedAt: customer.updated_at
      }));

      // Only update state if component is still mounted
      if (mountedRef.current) {
        console.log('💾 Setting', list.length, 'customers (component is mounted)');
        setCustomers(list);
      } else {
        console.log('⚠️ Component unmounted, skipping setCustomers');
      }
    } catch (error) {
      console.error("❌ ERROR fetching customers:", error);
    } finally {
      fetchingRef.current = false;
    }
  }, [userDetails]); // Depend on userDetails for organization filtering

  useEffect(() => {
    mountedRef.current = true;

    // Wait for BOTH currentUser AND userDetails to be loaded
    // This ensures Supabase auth session is fully established before querying
    if (!currentUser) {
      console.log('⏳ Waiting for currentUser (auth session) to load...');
      return;
    }

    if (!userDetails) {
      console.log('⏳ Waiting for userDetails to load before fetching customers...');
      return;
    }

    console.log('🚀 CustomerList: Both currentUser and userDetails loaded, fetching customers...');

    // Small delay to ensure auth.uid() is fully propagated to RLS policies
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 100);

    // Cleanup
    return () => {
      console.log('🧹 CustomerList unmounting');
      mountedRef.current = false;
      clearTimeout(timer);
      // DON'T reset fetchingRef here - let the fetch complete naturally
      // fetchingRef will be reset in the finally block of fetchCustomers
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, userDetails]); // Fetch when BOTH are available

  // Filter and search customers
  console.log('🔍 Filtering customers:', {
    totalCustomers: customers.length,
    searchTerm,
    filterType
  });

  const filteredCustomers = customers.filter(customer => {
    // Search filter - if no search term, match all customers
    const matchesSearch = !searchTerm || (
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.customerNumber?.includes(searchTerm) ||
      customer.orgNr?.includes(searchTerm)
    );

    if (!matchesSearch) return false;

    // Type filter
    switch (filterType) {
      case "rot":
        return customer.rotCustomer === "Ja";
      case "rut":
        return customer.rutCustomer === "Ja";
      case "company":
        return customer.orgNr && customer.orgNr.trim() !== "";
      case "private":
        return !customer.orgNr || customer.orgNr.trim() === "";
      default:
        return true;
    }
  });

  // Sort customers
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    let aVal = a[sortField] || "";
    let bVal = b[sortField] || "";

    if (sortField === "customerNumber") {
      aVal = parseInt(aVal) || 0;
      bVal = parseInt(bVal) || 0;
    } else {
      aVal = aVal.toString().toLowerCase();
      bVal = bVal.toString().toLowerCase();
    }

    if (sortOrder === "asc") {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  // Calculate statistics
  const totalCustomers = customers.length;
  const rotCustomers = customers.filter(c => c.rotCustomer === "Ja").length;
  const rutCustomers = customers.filter(c => c.rutCustomer === "Ja").length;
  const companyCustomers = customers.filter(c => c.orgNr && c.orgNr.trim() !== "").length;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: spacing[8] }}>
      {/* Header */}
      <div style={{ marginBottom: spacing[8] }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: spacing[2]
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: spacing[4] }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: borderRadius.xl,
              background: colors.gradients.blue,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: shadows.md,
            }}>
              <Users size={28} color="white" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: "700", color: colors.neutral[900] }}>
                Kundregister
              </h1>
              <p style={{ color: colors.neutral[600], fontSize: "0.95rem", margin: `${spacing[1]} 0 0 0` }}>
                Hantera alla dina kunder och deras information
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: spacing[3] }}>
            <ActionButton
              onClick={() => setIsImportModalOpen(true)}
              variant="secondary"
              icon={<Upload size={20} />}
            >
              Importera
            </ActionButton>
            <Link to="/customers/new" style={{ textDecoration: "none" }}>
              <ActionButton
                variant="primary"
                icon={<Plus size={20} />}
              >
                Ny Kund
              </ActionButton>
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: spacing[6],
        marginBottom: spacing[8]
      }}>
        <StatsCard
          icon={<Users size={24} />}
          label="Totalt antal kunder"
          value={totalCustomers}
          gradient="blue"
          onClick={() => setFilterType("all")}
          active={filterType === "all"}
        />
        <StatsCard
          icon={<Home size={24} />}
          label="ROT-kunder"
          value={rotCustomers}
          gradient="green"
          onClick={() => setFilterType("rot")}
          active={filterType === "rot"}
        />
        <StatsCard
          icon={<Home size={24} />}
          label="RUT-kunder"
          value={rutCustomers}
          gradient="purple"
          onClick={() => setFilterType("rut")}
          active={filterType === "rut"}
        />
        <StatsCard
          icon={<Building2 size={24} />}
          label="Företagskunder"
          value={companyCustomers}
          gradient="orange"
          onClick={() => setFilterType("company")}
          active={filterType === "company"}
        />
      </div>

      {/* Search and Filter */}
      <div className="card-enter" style={cardStyle}>
        {/* Search */}
        <div style={{ marginBottom: spacing[6], position: "relative" }}>
          <Search
            size={20}
            color={colors.neutral[400]}
            style={{ position: "absolute", left: spacing[3], top: "50%", transform: "translateY(-50%)", zIndex: 1 }}
          />
          <input
            type="text"
            placeholder="Sök efter kund, e-post, telefon, kundnummer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInputStyle}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              style={{
                position: "absolute",
                right: spacing[3],
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: spacing[1],
                display: "flex",
                alignItems: "center",
                borderRadius: borderRadius.md,
                transition: `all ${transitions.base}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.neutral[100];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <X size={18} color={colors.neutral[500]} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: spacing[3], flexWrap: "wrap" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: spacing[2],
            color: colors.neutral[600],
            fontWeight: 600,
            fontSize: "0.875rem"
          }}>
            <Filter size={18} />
            Filtrera:
          </div>
          <FilterButton active={filterType === "all"} onClick={() => setFilterType("all")}>
            Alla
          </FilterButton>
          <FilterButton active={filterType === "rot"} onClick={() => setFilterType("rot")} icon={<Home />}>
            ROT
          </FilterButton>
          <FilterButton active={filterType === "rut"} onClick={() => setFilterType("rut")} icon={<Home />}>
            RUT
          </FilterButton>
          <FilterButton active={filterType === "company"} onClick={() => setFilterType("company")} icon={<Building2 />}>
            Företag
          </FilterButton>
          <FilterButton active={filterType === "private"} onClick={() => setFilterType("private")}>
            Privat
          </FilterButton>
        </div>
      </div>

      {/* Customer Table */}
      <div className="card-enter" style={cardStyle}>
        <div style={{ overflowX: "auto" }}>
          {sortedCustomers.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th
                    style={{ ...tableHeaderStyle, cursor: "pointer" }}
                    onClick={() => handleSort("customerNumber")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: spacing[2] }}>
                      Kundnr
                      <ArrowUpDown size={14} />
                    </div>
                  </th>
                  <th
                    style={{ ...tableHeaderStyle, cursor: "pointer" }}
                    onClick={() => handleSort("name")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: spacing[2] }}>
                      Namn
                      <ArrowUpDown size={14} />
                    </div>
                  </th>
                  <th style={tableHeaderStyle}>Typ</th>
                  <th style={tableHeaderStyle}>Kontakt</th>
                  <th style={tableHeaderStyle}>Adress</th>
                  <th style={tableHeaderStyle}>ROT/RUT</th>
                </tr>
              </thead>
              <tbody>
                {sortedCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    style={{
                      transition: `all ${transitions.base}`,
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.neutral[50];
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <td style={tableCellStyle}>
                      <Link
                        to={`/customers/${customer.id}`}
                        style={{
                          color: colors.primary[600],
                          textDecoration: "none",
                          fontWeight: 600,
                          transition: `color ${transitions.base}`
                        }}
                      >
                        #{customer.customerNumber}
                      </Link>
                    </td>
                    <td style={tableCellStyle}>
                      <Link
                        to={`/customers/${customer.id}`}
                        style={{
                          color: colors.neutral[900],
                          textDecoration: "none",
                          fontWeight: 600,
                          transition: `color ${transitions.base}`
                        }}
                      >
                        {customer.name}
                      </Link>
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: spacing[2] }}>
                        {customer.orgNr && customer.orgNr.trim() !== "" ? (
                          <>
                            <Building2 size={16} color={colors.warning[500]} />
                            <span style={{ fontSize: "0.875rem", color: colors.neutral[600] }}>Företag</span>
                          </>
                        ) : (
                          <>
                            <Users size={16} color={colors.primary[500]} />
                            <span style={{ fontSize: "0.875rem", color: colors.neutral[600] }}>Privat</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ display: "flex", flexDirection: "column", gap: spacing[1] }}>
                        {customer.email && (
                          <div style={{ display: "flex", alignItems: "center", gap: spacing[2], fontSize: "0.875rem" }}>
                            <Mail size={14} color={colors.neutral[400]} />
                            <span>{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div style={{ display: "flex", alignItems: "center", gap: spacing[2], fontSize: "0.875rem" }}>
                            <Phone size={14} color={colors.neutral[400]} />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={tableCellStyle}>
                      {customer.address && (
                        <div style={{ display: "flex", alignItems: "center", gap: spacing[2], fontSize: "0.875rem" }}>
                          <MapPin size={14} color={colors.neutral[400]} />
                          <span>{customer.address}</span>
                        </div>
                      )}
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ display: "flex", gap: spacing[2] }}>
                        {customer.rotCustomer === "Ja" && (
                          <Badge variant="success">ROT</Badge>
                        )}
                        {customer.rutCustomer === "Ja" && (
                          <Badge variant="info">RUT</Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: "center", padding: spacing[12], color: colors.neutral[500] }}>
              <Users size={48} color={colors.neutral[300]} style={{ marginBottom: spacing[4] }} />
              <p style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: spacing[2], color: colors.neutral[700] }}>
                Inga kunder hittades
              </p>
              <p style={{ fontSize: "0.9rem" }}>
                {searchTerm || filterType !== "all"
                  ? "Prova att ändra dina sökkriterier eller filter"
                  : "Kom igång genom att skapa din första kund"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Results count */}
      <div style={{
        marginTop: spacing[4],
        textAlign: "center",
        color: colors.neutral[500],
        fontSize: "0.875rem",
        fontWeight: 500
      }}>
        Visar {sortedCustomers.length} av {customers.length} kunder
      </div>

      {/* Import Modal */}
      <ImportCustomers
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          fetchCustomers();
          setIsImportModalOpen(false);
        }}
      />
    </div>
  );
}
