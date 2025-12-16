import React, { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  Settings,
  DollarSign,
  Clock,
  Plus,
  Save,
  Trash2,
  Edit3,
  X
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

export default function SettingsPage() {
  const { userDetails } = useAuth();
  const [timeCodes, setTimeCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTimeCode, setNewTimeCode] = useState({
    id: "",
    name: "",
    color: "#3b82f6",
    billable: true,
    hourlyRate: 650
  });

  useEffect(() => {
    fetchSettings();
  }, [userDetails]);

  const fetchSettings = async () => {
    if (!userDetails?.organizationId) return;

    try {
      setLoading(true);
      const settingsRef = doc(db, "settings", userDetails.organizationId);
      const settingsDoc = await getDoc(settingsRef);

      if (settingsDoc.exists()) {
        setTimeCodes(settingsDoc.data().timeCodes || DEFAULT_TIME_CODES);
      } else {
        // Initialize with default time codes
        setTimeCodes(DEFAULT_TIME_CODES);
        await setDoc(settingsRef, {
          timeCodes: DEFAULT_TIME_CODES,
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

  const saveSettings = async (updatedTimeCodes) => {
    if (!userDetails?.organizationId) return;

    try {
      const settingsRef = doc(db, "settings", userDetails.organizationId);
      await setDoc(settingsRef, {
        timeCodes: updatedTimeCodes,
        organizationId: userDetails.organizationId
      });

      setTimeCodes(updatedTimeCodes);
      setToast({ message: "Inställningar sparade!", type: "success" });
    } catch (err) {
      console.error("Error saving settings:", err);
      setToast({ message: "Kunde inte spara inställningar", type: "error" });
    }
  };

  const handleUpdate = (id, field, value) => {
    const updated = timeCodes.map(tc =>
      tc.id === id ? { ...tc, [field]: value } : tc
    );
    setTimeCodes(updated);
  };

  const handleSave = async () => {
    await saveSettings(timeCodes);
    setEditingId(null);
  };

  const handleAddNew = async () => {
    if (!newTimeCode.name || !newTimeCode.id) {
      setToast({ message: "Namn och ID är obligatoriska", type: "error" });
      return;
    }

    // Check if ID already exists
    if (timeCodes.find(tc => tc.id === newTimeCode.id)) {
      setToast({ message: "En tidkod med detta ID finns redan", type: "error" });
      return;
    }

    const updated = [...timeCodes, { ...newTimeCode }];
    await saveSettings(updated);

    setNewTimeCode({
      id: "",
      name: "",
      color: "#3b82f6",
      billable: true,
      hourlyRate: 650
    });
    setShowAddForm(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Är du säker på att du vill ta bort denna tidkod?")) return;

    const updated = timeCodes.filter(tc => tc.id !== id);
    await saveSettings(updated);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <Clock size={48} style={{ marginBottom: "1rem", opacity: 0.5 }} />
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
          Hantera tidkoder, priser och andra systeminställningar
        </p>
      </div>

      {/* Time Codes Section */}
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
                onClick={handleAddNew}
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
                        onChange={(e) => handleUpdate(timeCode.id, 'name', e.target.value)}
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
                        onChange={(e) => handleUpdate(timeCode.id, 'hourlyRate', parseFloat(e.target.value) || 0)}
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
                          onChange={(e) => handleUpdate(timeCode.id, 'billable', e.target.checked)}
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
                        onClick={handleSave}
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
                          onClick={() => handleDelete(timeCode.id)}
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
                        onChange={(e) => handleUpdate(timeCode.id, 'color', e.target.value)}
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
    </div>
  );
}
