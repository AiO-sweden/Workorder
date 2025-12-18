import React, { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { doc, getDoc, setDoc, collection, getDocs, query, where, deleteDoc, addDoc } from "firebase/firestore";
import {
  Settings,
  DollarSign,
  Clock,
  Plus,
  Save,
  Trash2,
  Edit3,
  X,
  Users,
  Briefcase,
  Hammer,
  Zap,
  Shield,
  Cpu,
  Home,
  Wrench,
  Building,
  MoreHorizontal,
  Mail,
  UserPlus,
  Crown
} from "lucide-react";
import { cardStyle, sectionHeaderStyle, inputStyle, colors, spacing, typography, shadows, borderRadius, transitions } from "../components/shared/styles";
import ActionButton from "../components/shared/ActionButton";
import FormField from "../components/shared/FormField";
import Badge from "../components/shared/Badge";
import Toast from "../components/shared/Toast";

const DEFAULT_TIME_CODES = [
  { id: "normal", name: "Normal tid", color: "#3b82f6", billable: true, hourlyRate: 650 },
  { id: "overtime", name: "Övertid", color: "#f59e0b", billable: true, hourlyRate: 975 },
  { id: "oncall", name: "Jour", color: "#8b5cf6", billable: true, hourlyRate: 800 },
  { id: "travel", name: "Restid", color: "#06b6d4", billable: true, hourlyRate: 500 },
  { id: "internal", name: "Intern tid", color: "#64748b", billable: false, hourlyRate: 0 },
  { id: "vacation", name: "Semester", color: "#10b981", billable: false, hourlyRate: 0 },
  { id: "sick", name: "Sjuk", color: "#ef4444", billable: false, hourlyRate: 0 }
];

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

// Available icons for work types
const AVAILABLE_ICONS = {
  Hammer, Zap, Shield, Cpu, Home, Wrench, Building, MoreHorizontal,
  Briefcase, Users, Settings, DollarSign, Clock
};

const IconComponent = ({ iconName, size = 20, color }) => {
  const Icon = AVAILABLE_ICONS[iconName] || MoreHorizontal;
  return <Icon size={size} color={color} />;
};

export default function SettingsPage() {
  const { userDetails } = useAuth();
  const [activeTab, setActiveTab] = useState("timeCodes"); // timeCodes, users, workTypes
  const [timeCodes, setTimeCodes] = useState([]);
  const [users, setUsers] = useState([]);
  const [workTypes, setWorkTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [invitingUser, setInvitingUser] = useState(false);

  // Form states
  const [newTimeCode, setNewTimeCode] = useState({
    id: "",
    name: "",
    color: "#3b82f6",
    billable: true,
    hourlyRate: 650
  });

  const [newUser, setNewUser] = useState({
    email: "",
    role: "user"
  });

  const [newWorkType, setNewWorkType] = useState({
    id: "",
    name: "",
    icon: "Briefcase",
    color: "#3b82f6"
  });

  useEffect(() => {
    fetchSettings();
    fetchUsers();
  }, [userDetails]);

  const fetchSettings = async () => {
    if (!userDetails?.organizationId) return;

    try {
      setLoading(true);
      const settingsRef = doc(db, "settings", userDetails.organizationId);
      const settingsDoc = await getDoc(settingsRef);

      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setTimeCodes(data.timeCodes || DEFAULT_TIME_CODES);
        setWorkTypes(data.workTypes || DEFAULT_WORK_TYPES);
      } else {
        // Initialize with defaults
        setTimeCodes(DEFAULT_TIME_CODES);
        setWorkTypes(DEFAULT_WORK_TYPES);
        await setDoc(settingsRef, {
          timeCodes: DEFAULT_TIME_CODES,
          workTypes: DEFAULT_WORK_TYPES,
          organizationId: userDetails.organizationId
        });
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      setToast({ message: "Kunde inte hämta inställningar", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, "schedulableUsers");
      const usersSnapshot = await getDocs(usersRef);
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const saveSettings = async (updatedTimeCodes, updatedWorkTypes) => {
    if (!userDetails?.organizationId) return;

    try {
      const settingsRef = doc(db, "settings", userDetails.organizationId);
      await setDoc(settingsRef, {
        timeCodes: updatedTimeCodes || timeCodes,
        workTypes: updatedWorkTypes || workTypes,
        organizationId: userDetails.organizationId
      });

      if (updatedTimeCodes) setTimeCodes(updatedTimeCodes);
      if (updatedWorkTypes) setWorkTypes(updatedWorkTypes);
      setToast({ message: "Inställningar sparade!", type: "success" });
    } catch (err) {
      console.error("Error saving settings:", err);
      setToast({ message: "Kunde inte spara inställningar", type: "error" });
    }
  };

  // Time Code handlers
  const handleUpdateTimeCode = (id, field, value) => {
    const updated = timeCodes.map(tc =>
      tc.id === id ? { ...tc, [field]: value } : tc
    );
    setTimeCodes(updated);
  };

  const handleSaveTimeCode = async () => {
    await saveSettings(timeCodes, null);
    setEditingId(null);
  };

  const handleAddTimeCode = async () => {
    if (!newTimeCode.name || !newTimeCode.id) {
      setToast({ message: "Namn och ID är obligatoriska", type: "error" });
      return;
    }

    if (timeCodes.find(tc => tc.id === newTimeCode.id)) {
      setToast({ message: "En tidkod med detta ID finns redan", type: "error" });
      return;
    }

    const updated = [...timeCodes, { ...newTimeCode }];
    await saveSettings(updated, null);

    setNewTimeCode({
      id: "",
      name: "",
      color: "#3b82f6",
      billable: true,
      hourlyRate: 650
    });
    setShowAddForm(false);
  };

  const handleDeleteTimeCode = async (id) => {
    if (!window.confirm("Är du säker på att du vill ta bort denna tidkod?")) return;
    const updated = timeCodes.filter(tc => tc.id !== id);
    await saveSettings(updated, null);
  };

  // Work Type handlers
  const handleUpdateWorkType = (id, field, value) => {
    const updated = workTypes.map(wt =>
      wt.id === id ? { ...wt, [field]: value } : wt
    );
    setWorkTypes(updated);
  };

  const handleSaveWorkType = async () => {
    await saveSettings(null, workTypes);
    setEditingId(null);
  };

  const handleAddWorkType = async () => {
    if (!newWorkType.name || !newWorkType.id) {
      setToast({ message: "Namn och ID är obligatoriska", type: "error" });
      return;
    }

    if (workTypes.find(wt => wt.id === newWorkType.id)) {
      setToast({ message: "En arbetstyp med detta ID finns redan", type: "error" });
      return;
    }

    const updated = [...workTypes, { ...newWorkType }];
    await saveSettings(null, updated);

    setNewWorkType({
      id: "",
      name: "",
      icon: "Briefcase",
      color: "#3b82f6"
    });
    setShowAddForm(false);
  };

  const handleDeleteWorkType = async (id) => {
    if (!window.confirm("Är du säker på att du vill ta bort denna arbetstyp?")) return;
    const updated = workTypes.filter(wt => wt.id !== id);
    await saveSettings(null, updated);
  };

  // User handlers
  const handleInviteUser = async () => {
    if (!newUser.email) {
      setToast({ message: "E-post är obligatoriskt", type: "error" });
      return;
    }

    setInvitingUser(true);

    try {
      const functionUrl = process.env.NODE_ENV === 'production'
        ? 'https://inviteuser-klmkx4t7rq-ew.a.run.app'
        : 'http://127.0.0.1:5001/aio-arbetsorder/europe-west1/inviteUser';

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUser.email,
          role: newUser.role
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Kunde inte bjuda in användare');
      }

      setToast({ message: `Användare ${newUser.email} inbjuden!`, type: "success" });
      setNewUser({ email: "", role: "user" });
      setShowAddForm(false);
      await fetchUsers();
    } catch (error) {
      console.error('Error inviting user:', error);
      setToast({ message: error.message, type: "error" });
    } finally {
      setInvitingUser(false);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Är du säker på att du vill ta bort ${userEmail}?`)) return;

    try {
      const userDoc = doc(db, "schedulableUsers", userId);
      await deleteDoc(userDoc);
      setToast({ message: "Användare borttagen", type: "success" });
      await fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      setToast({ message: "Kunde inte ta bort användare", type: "error" });
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <Settings size={48} style={{ marginBottom: "1rem", opacity: 0.5 }} />
        <p>Laddar inställningar...</p>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: "1200px",
      margin: "0 auto",
      fontFamily: typography.fontFamily.sans
    }}>
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
        <h1 style={{
          fontSize: typography.fontSize["4xl"],
          fontWeight: typography.fontWeight.bold,
          color: colors.neutral[900],
          margin: 0,
          display: "flex",
          alignItems: "center",
          gap: spacing[3]
        }}>
          <Settings size={32} color={colors.primary[500]} />
          Inställningar
        </h1>
        <p style={{
          color: colors.neutral[600],
          fontSize: typography.fontSize.base,
          margin: `${spacing[2]} 0 0 0`
        }}>
          Hantera användare, tidkoder, arbetstyper och andra systeminställningar
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: spacing[2],
        marginBottom: spacing[6],
        borderBottom: `2px solid ${colors.neutral[200]}`,
        flexWrap: "wrap"
      }}>
        <button
          onClick={() => {
            setActiveTab("users");
            setShowAddForm(false);
            setEditingId(null);
          }}
          style={{
            padding: `${spacing[3]} ${spacing[6]}`,
            border: "none",
            backgroundColor: "transparent",
            borderBottom: `3px solid ${activeTab === "users" ? colors.primary[500] : "transparent"}`,
            color: activeTab === "users" ? colors.primary[700] : colors.neutral[600],
            fontWeight: typography.fontWeight.semibold,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: spacing[2],
            marginBottom: "-2px",
            transition: `all ${transitions.base}`
          }}
        >
          <Users size={18} />
          Användare
        </button>

        <button
          onClick={() => {
            setActiveTab("timeCodes");
            setShowAddForm(false);
            setEditingId(null);
          }}
          style={{
            padding: `${spacing[3]} ${spacing[6]}`,
            border: "none",
            backgroundColor: "transparent",
            borderBottom: `3px solid ${activeTab === "timeCodes" ? colors.primary[500] : "transparent"}`,
            color: activeTab === "timeCodes" ? colors.primary[700] : colors.neutral[600],
            fontWeight: typography.fontWeight.semibold,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: spacing[2],
            marginBottom: "-2px",
            transition: `all ${transitions.base}`
          }}
        >
          <Clock size={18} />
          Tidkoder
        </button>

        <button
          onClick={() => {
            setActiveTab("workTypes");
            setShowAddForm(false);
            setEditingId(null);
          }}
          style={{
            padding: `${spacing[3]} ${spacing[6]}`,
            border: "none",
            backgroundColor: "transparent",
            borderBottom: `3px solid ${activeTab === "workTypes" ? colors.primary[500] : "transparent"}`,
            color: activeTab === "workTypes" ? colors.primary[700] : colors.neutral[600],
            fontWeight: typography.fontWeight.semibold,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: spacing[2],
            marginBottom: "-2px",
            transition: `all ${transitions.base}`
          }}
        >
          <Briefcase size={18} />
          Arbetstyper
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === "users" && (
        <div style={{
          ...cardStyle,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={sectionHeaderStyle}>
            <Users size={20} color={colors.primary[500]} />
            <span>Användare</span>
          </div>

          <p style={{
            color: colors.neutral[600],
            marginBottom: spacing[6]
          }}>
            Hantera användare som kan schemaläggas och använda systemet.
          </p>

          {/* Add User Button */}
          <div style={{ marginBottom: spacing[6] }}>
            <ActionButton
              onClick={() => setShowAddForm(!showAddForm)}
              variant={showAddForm ? "secondary" : "primary"}
              icon={showAddForm ? <X size={18} /> : <UserPlus size={18} />}
            >
              {showAddForm ? "Avbryt" : "Bjud in användare"}
            </ActionButton>
          </div>

          {/* Add User Form */}
          {showAddForm && (
            <div style={{
              padding: spacing[6],
              backgroundColor: colors.neutral[50],
              borderRadius: borderRadius.lg,
              marginBottom: spacing[6],
              border: `2px solid ${colors.primary[200]}`,
              animation: 'slideDown 0.3s ease-out'
            }}>
              <h3 style={{
                margin: `0 0 ${spacing[4]} 0`,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                color: colors.neutral[900]
              }}>
                Bjud in ny användare
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: spacing[4] }}>
                <FormField label="E-post" required>
                  <div style={{ position: "relative" }}>
                    <Mail size={18} style={{
                      position: "absolute",
                      left: spacing[3],
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: colors.neutral[400]
                    }} />
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="anvandare@example.com"
                      style={{ ...inputStyle, paddingLeft: spacing[10] }}
                    />
                  </div>
                </FormField>

                <FormField label="Roll">
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="user">Användare</option>
                    <option value="admin">Admin</option>
                  </select>
                </FormField>
              </div>

              <div style={{ marginTop: spacing[4] }}>
                <ActionButton
                  onClick={handleInviteUser}
                  variant="success"
                  icon={<UserPlus size={18} />}
                  disabled={invitingUser}
                >
                  {invitingUser ? "Bjuder in..." : "Skicka inbjudan"}
                </ActionButton>
              </div>
            </div>
          )}

          {/* Users List */}
          <div style={{ display: "flex", flexDirection: "column", gap: spacing[4] }}>
            {users.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: spacing[8],
                color: colors.neutral[500]
              }}>
                <Users size={48} style={{ marginBottom: spacing[3], opacity: 0.5 }} />
                <p>Inga användare ännu. Bjud in din första användare!</p>
              </div>
            ) : (
              users.map((user, index) => (
                <div
                  key={user.id}
                  style={{
                    padding: spacing[6],
                    border: `2px solid ${colors.neutral[200]}`,
                    borderRadius: borderRadius.lg,
                    backgroundColor: "white",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    animation: `slideIn 0.3s ease-out ${index * 0.05}s both`
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: spacing[4] }}>
                    <div style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      backgroundColor: colors.primary[100],
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: colors.primary[700],
                      fontWeight: typography.fontWeight.bold,
                      fontSize: typography.fontSize.lg
                    }}>
                      {user.email?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <div style={{
                        fontSize: typography.fontSize.base,
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.neutral[900],
                        marginBottom: spacing[1]
                      }}>
                        {user.name || user.email}
                      </div>
                      <div style={{
                        fontSize: typography.fontSize.sm,
                        color: colors.neutral[600],
                        display: "flex",
                        alignItems: "center",
                        gap: spacing[2]
                      }}>
                        <Mail size={14} />
                        {user.email}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: spacing[3] }}>
                    {user.role === "admin" && (
                      <Badge variant="warning">
                        <Crown size={12} style={{ marginRight: spacing[1] }} />
                        Admin
                      </Badge>
                    )}
                    <ActionButton
                      onClick={() => handleDeleteUser(user.id, user.email)}
                      variant="danger"
                      icon={<Trash2 size={16} />}
                    >
                      Ta bort
                    </ActionButton>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Time Codes Tab */}
      {activeTab === "timeCodes" && (
        <div style={{
          ...cardStyle,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={sectionHeaderStyle}>
            <Clock size={20} color={colors.primary[500]} />
            <span>Tidkoder och priser</span>
          </div>

          <p style={{
            color: colors.neutral[600],
            marginBottom: spacing[6]
          }}>
            Hantera dina tidkoder och timpris. Dessa används när du rapporterar tid.
          </p>

          {/* Add New Button */}
          <div style={{ marginBottom: spacing[6] }}>
            <ActionButton
              onClick={() => setShowAddForm(!showAddForm)}
              variant={showAddForm ? "secondary" : "primary"}
              icon={showAddForm ? <X size={18} /> : <Plus size={18} />}
            >
              {showAddForm ? "Avbryt" : "Lägg till ny tidkod"}
            </ActionButton>
          </div>

          {/* Add New Form */}
          {showAddForm && (
            <div style={{
              padding: spacing[6],
              backgroundColor: colors.neutral[50],
              borderRadius: borderRadius.lg,
              marginBottom: spacing[6],
              border: `2px solid ${colors.primary[200]}`,
              animation: 'slideDown 0.3s ease-out'
            }}>
              <h3 style={{
                margin: `0 0 ${spacing[4]} 0`,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                color: colors.neutral[900]
              }}>
                Ny tidkod
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[4] }}>
                <FormField label="ID" required helper="Unikt ID för tidkoden (t.ex. 'overtime')">
                  <input
                    type="text"
                    value={newTimeCode.id}
                    onChange={(e) => setNewTimeCode({ ...newTimeCode, id: e.target.value })}
                    placeholder="overtime"
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="Namn" required>
                  <input
                    type="text"
                    value={newTimeCode.name}
                    onChange={(e) => setNewTimeCode({ ...newTimeCode, name: e.target.value })}
                    placeholder="Övertid"
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="Färg">
                  <input
                    type="color"
                    value={newTimeCode.color}
                    onChange={(e) => setNewTimeCode({ ...newTimeCode, color: e.target.value })}
                    style={{ ...inputStyle, height: "45px" }}
                  />
                </FormField>

                <FormField label="Timpris (kr, ex. moms)" icon={<DollarSign size={16} />}>
                  <input
                    type="number"
                    value={newTimeCode.hourlyRate}
                    onChange={(e) => setNewTimeCode({ ...newTimeCode, hourlyRate: parseFloat(e.target.value) || 0 })}
                    placeholder="650"
                    style={inputStyle}
                  />
                </FormField>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{
                    display: "flex",
                    alignItems: "center",
                    gap: spacing[2],
                    cursor: "pointer"
                  }}>
                    <input
                      type="checkbox"
                      checked={newTimeCode.billable}
                      onChange={(e) => setNewTimeCode({ ...newTimeCode, billable: e.target.checked })}
                      style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    />
                    <span style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.neutral[700]
                    }}>
                      Fakturerbar
                    </span>
                  </label>
                </div>
              </div>

              <div style={{ marginTop: spacing[4], display: "flex", gap: spacing[3] }}>
                <ActionButton
                  onClick={handleAddTimeCode}
                  variant="success"
                  icon={<Save size={18} />}
                >
                  Spara ny tidkod
                </ActionButton>
              </div>
            </div>
          )}

          {/* Time Codes List */}
          <div style={{ display: "flex", flexDirection: "column", gap: spacing[4] }}>
            {timeCodes.map((timeCode, index) => {
              const isEditing = editingId === timeCode.id;

              return (
                <div
                  key={timeCode.id}
                  style={{
                    padding: spacing[6],
                    border: `2px solid ${isEditing ? timeCode.color : colors.neutral[200]}`,
                    borderRadius: borderRadius.lg,
                    backgroundColor: isEditing ? `${timeCode.color}10` : "white",
                    transition: `all ${transitions.base}`,
                    boxShadow: isEditing ? shadows.lg : shadows.sm,
                    animation: `slideIn 0.3s ease-out ${index * 0.05}s both`
                  }}
                >
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr auto",
                    gap: spacing[4],
                    alignItems: "center"
                  }}>
                    {/* Name */}
                    <div>
                      <div style={{
                        fontSize: typography.fontSize.xs,
                        color: colors.neutral[600],
                        marginBottom: spacing[1],
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontWeight: typography.fontWeight.semibold
                      }}>
                        Namn
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={timeCode.name}
                          onChange={(e) => handleUpdateTimeCode(timeCode.id, 'name', e.target.value)}
                          style={{ ...inputStyle, padding: spacing[2] }}
                        />
                      ) : (
                        <div style={{
                          fontSize: typography.fontSize.base,
                          fontWeight: typography.fontWeight.semibold,
                          color: colors.neutral[900],
                          display: "flex",
                          alignItems: "center",
                          gap: spacing[2]
                        }}>
                          <div style={{
                            width: "12px",
                            height: "12px",
                            borderRadius: borderRadius.base,
                            backgroundColor: timeCode.color,
                            boxShadow: shadows.sm
                          }} />
                          {timeCode.name}
                        </div>
                      )}
                    </div>

                    {/* Hourly Rate */}
                    <div>
                      <div style={{
                        fontSize: typography.fontSize.xs,
                        color: colors.neutral[600],
                        marginBottom: spacing[1],
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontWeight: typography.fontWeight.semibold
                      }}>
                        Timpris (ex. moms)
                      </div>
                      {isEditing ? (
                        <input
                          type="number"
                          value={timeCode.hourlyRate}
                          onChange={(e) => handleUpdateTimeCode(timeCode.id, 'hourlyRate', parseFloat(e.target.value) || 0)}
                          style={{ ...inputStyle, padding: spacing[2] }}
                        />
                      ) : (
                        <div style={{
                          fontSize: typography.fontSize.lg,
                          fontWeight: typography.fontWeight.bold,
                          color: colors.neutral[900]
                        }}>
                          {timeCode.hourlyRate} kr/h
                        </div>
                      )}
                    </div>

                    {/* Billable */}
                    <div>
                      <div style={{
                        fontSize: typography.fontSize.xs,
                        color: colors.neutral[600],
                        marginBottom: spacing[1],
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontWeight: typography.fontWeight.semibold
                      }}>
                        Typ
                      </div>
                      {isEditing ? (
                        <label style={{
                          display: "flex",
                          alignItems: "center",
                          gap: spacing[2],
                          cursor: "pointer"
                        }}>
                          <input
                            type="checkbox"
                            checked={timeCode.billable}
                            onChange={(e) => handleUpdateTimeCode(timeCode.id, 'billable', e.target.checked)}
                            style={{ width: "18px", height: "18px", cursor: "pointer" }}
                          />
                          <span style={{
                            fontSize: typography.fontSize.sm,
                            fontWeight: typography.fontWeight.semibold
                          }}>
                            Fakturerbar
                          </span>
                        </label>
                      ) : (
                        <Badge variant={timeCode.billable ? "success" : "neutral"}>
                          {timeCode.billable ? "Fakturerbar" : "Intern"}
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: spacing[2] }}>
                      {isEditing ? (
                        <ActionButton
                          onClick={handleSaveTimeCode}
                          variant="success"
                          icon={<Save size={16} />}
                        >
                          Spara
                        </ActionButton>
                      ) : (
                        <>
                          <ActionButton
                            onClick={() => setEditingId(timeCode.id)}
                            variant="secondary"
                            icon={<Edit3 size={16} />}
                          >
                            Redigera
                          </ActionButton>
                          <ActionButton
                            onClick={() => handleDeleteTimeCode(timeCode.id)}
                            variant="danger"
                            icon={<Trash2 size={16} />}
                          >
                            Ta bort
                          </ActionButton>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Color picker when editing */}
                  {isEditing && (
                    <div style={{
                      marginTop: spacing[4],
                      paddingTop: spacing[4],
                      borderTop: `2px solid ${colors.neutral[200]}`
                    }}>
                      <FormField label="Färg">
                        <input
                          type="color"
                          value={timeCode.color}
                          onChange={(e) => handleUpdateTimeCode(timeCode.id, 'color', e.target.value)}
                          style={{ ...inputStyle, height: "45px", width: "200px" }}
                        />
                      </FormField>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Work Types Tab */}
      {activeTab === "workTypes" && (
        <div style={{
          ...cardStyle,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={sectionHeaderStyle}>
            <Briefcase size={20} color={colors.primary[500]} />
            <span>Arbetstyper</span>
          </div>

          <p style={{
            color: colors.neutral[600],
            marginBottom: spacing[6]
          }}>
            Hantera dina arbetstyper som används när du skapar arbetsordrar.
          </p>

          {/* Add New Button */}
          <div style={{ marginBottom: spacing[6] }}>
            <ActionButton
              onClick={() => setShowAddForm(!showAddForm)}
              variant={showAddForm ? "secondary" : "primary"}
              icon={showAddForm ? <X size={18} /> : <Plus size={18} />}
            >
              {showAddForm ? "Avbryt" : "Lägg till arbetstyp"}
            </ActionButton>
          </div>

          {/* Add New Form */}
          {showAddForm && (
            <div style={{
              padding: spacing[6],
              backgroundColor: colors.neutral[50],
              borderRadius: borderRadius.lg,
              marginBottom: spacing[6],
              border: `2px solid ${colors.primary[200]}`,
              animation: 'slideDown 0.3s ease-out'
            }}>
              <h3 style={{
                margin: `0 0 ${spacing[4]} 0`,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                color: colors.neutral[900]
              }}>
                Ny arbetstyp
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[4] }}>
                <FormField label="ID" required helper="Unikt ID för arbetstypen (t.ex. 'maleri')">
                  <input
                    type="text"
                    value={newWorkType.id}
                    onChange={(e) => setNewWorkType({ ...newWorkType, id: e.target.value })}
                    placeholder="maleri"
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="Namn" required>
                  <input
                    type="text"
                    value={newWorkType.name}
                    onChange={(e) => setNewWorkType({ ...newWorkType, name: e.target.value })}
                    placeholder="Måleri"
                    style={inputStyle}
                  />
                </FormField>

                <div style={{ gridColumn: "1 / -1" }}>
                  <FormField label="Ikon">
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))",
                      gap: spacing[2],
                      padding: spacing[3],
                      backgroundColor: "white",
                      borderRadius: borderRadius.base,
                      border: `2px solid ${colors.neutral[200]}`
                    }}>
                      {Object.keys(AVAILABLE_ICONS).map(iconName => {
                        const isSelected = newWorkType.icon === iconName;
                        const Icon = AVAILABLE_ICONS[iconName];
                        return (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => setNewWorkType({ ...newWorkType, icon: iconName })}
                            style={{
                              padding: spacing[3],
                              border: `2px solid ${isSelected ? newWorkType.color : colors.neutral[200]}`,
                              borderRadius: borderRadius.base,
                              backgroundColor: isSelected ? `${newWorkType.color}15` : "white",
                              cursor: "pointer",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: spacing[1],
                              transition: `all ${transitions.base}`,
                              boxShadow: isSelected ? shadows.md : "none"
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = colors.neutral[50];
                                e.currentTarget.style.borderColor = colors.neutral[300];
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = "white";
                                e.currentTarget.style.borderColor = colors.neutral[200];
                              }
                            }}
                          >
                            <Icon size={24} color={isSelected ? newWorkType.color : colors.neutral[600]} />
                            <span style={{
                              fontSize: typography.fontSize.xs,
                              color: isSelected ? newWorkType.color : colors.neutral[600],
                              fontWeight: isSelected ? typography.fontWeight.semibold : typography.fontWeight.normal,
                              textAlign: "center"
                            }}>
                              {iconName}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </FormField>
                </div>

                <FormField label="Färg">
                  <input
                    type="color"
                    value={newWorkType.color}
                    onChange={(e) => setNewWorkType({ ...newWorkType, color: e.target.value })}
                    style={{ ...inputStyle, height: "45px" }}
                  />
                </FormField>
              </div>

              <div style={{ marginTop: spacing[4], display: "flex", gap: spacing[3] }}>
                <ActionButton
                  onClick={handleAddWorkType}
                  variant="success"
                  icon={<Save size={18} />}
                >
                  Spara arbetstyp
                </ActionButton>
              </div>
            </div>
          )}

          {/* Work Types Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: spacing[4]
          }}>
            {workTypes.map((workType, index) => {
              const isEditing = editingId === workType.id;

              return (
                <div
                  key={workType.id}
                  style={{
                    padding: spacing[6],
                    border: `2px solid ${isEditing ? workType.color : colors.neutral[200]}`,
                    borderRadius: borderRadius.lg,
                    backgroundColor: isEditing ? `${workType.color}10` : "white",
                    transition: `all ${transitions.base}`,
                    boxShadow: isEditing ? shadows.lg : shadows.sm,
                    animation: `slideIn 0.3s ease-out ${index * 0.05}s both`
                  }}
                >
                  {isEditing ? (
                    <div>
                      <FormField label="Namn" required>
                        <input
                          type="text"
                          value={workType.name}
                          onChange={(e) => handleUpdateWorkType(workType.id, 'name', e.target.value)}
                          style={inputStyle}
                        />
                      </FormField>

                      <FormField label="Ikon">
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))",
                          gap: spacing[2],
                          padding: spacing[3],
                          backgroundColor: "white",
                          borderRadius: borderRadius.base,
                          border: `2px solid ${colors.neutral[200]}`
                        }}>
                          {Object.keys(AVAILABLE_ICONS).map(iconName => {
                            const isSelected = workType.icon === iconName;
                            const Icon = AVAILABLE_ICONS[iconName];
                            return (
                              <button
                                key={iconName}
                                type="button"
                                onClick={() => handleUpdateWorkType(workType.id, 'icon', iconName)}
                                style={{
                                  padding: spacing[3],
                                  border: `2px solid ${isSelected ? workType.color : colors.neutral[200]}`,
                                  borderRadius: borderRadius.base,
                                  backgroundColor: isSelected ? `${workType.color}15` : "white",
                                  cursor: "pointer",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  gap: spacing[1],
                                  transition: `all ${transitions.base}`,
                                  boxShadow: isSelected ? shadows.md : "none"
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.backgroundColor = colors.neutral[50];
                                    e.currentTarget.style.borderColor = colors.neutral[300];
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.backgroundColor = "white";
                                    e.currentTarget.style.borderColor = colors.neutral[200];
                                  }
                                }}
                              >
                                <Icon size={24} color={isSelected ? workType.color : colors.neutral[600]} />
                                <span style={{
                                  fontSize: typography.fontSize.xs,
                                  color: isSelected ? workType.color : colors.neutral[600],
                                  fontWeight: isSelected ? typography.fontWeight.semibold : typography.fontWeight.normal,
                                  textAlign: "center"
                                }}>
                                  {iconName}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </FormField>

                      <FormField label="Färg">
                        <input
                          type="color"
                          value={workType.color}
                          onChange={(e) => handleUpdateWorkType(workType.id, 'color', e.target.value)}
                          style={{ ...inputStyle, height: "45px" }}
                        />
                      </FormField>

                      <div style={{ display: "flex", gap: spacing[2], marginTop: spacing[4] }}>
                        <ActionButton
                          onClick={handleSaveWorkType}
                          variant="success"
                          icon={<Save size={16} />}
                        >
                          Spara
                        </ActionButton>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: spacing[3],
                        marginBottom: spacing[4]
                      }}>
                        <div style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: borderRadius.lg,
                          backgroundColor: `${workType.color}20`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          <IconComponent iconName={workType.icon} size={24} color={workType.color} />
                        </div>
                        <div style={{
                          fontSize: typography.fontSize.lg,
                          fontWeight: typography.fontWeight.semibold,
                          color: colors.neutral[900]
                        }}>
                          {workType.name}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: spacing[2] }}>
                        <ActionButton
                          onClick={() => setEditingId(workType.id)}
                          variant="secondary"
                          icon={<Edit3 size={16} />}
                        >
                          Redigera
                        </ActionButton>
                        <ActionButton
                          onClick={() => handleDeleteWorkType(workType.id)}
                          variant="danger"
                          icon={<Trash2 size={16} />}
                        >
                          Ta bort
                        </ActionButton>
                      </div>
                    </>
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
