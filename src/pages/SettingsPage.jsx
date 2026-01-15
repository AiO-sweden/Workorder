import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import { useResponsive } from "../hooks/useResponsive";
import Papa from 'papaparse';
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
  Building2,
  MoreHorizontal,
  Mail,
  UserPlus,
  Upload,
  Image,
  FileText,
  CreditCard,
  FileUp,
  Calendar,
  Paintbrush,
  Scissors,
  Truck,
  Car,
  Package,
  TreePine,
  Leaf,
  Droplet,
  Phone,
  MessageSquare,
  Bell,
  FileCheck,
  ClipboardCheck,
  Star,
  CheckSquare,
  Target,
  Flame,
  Lightbulb,
  Archive,
  Box,
  Waves,
  Plug,
  Radio,
  Warehouse,
  Factory,
  Construction,
  HardHat,
  Coffee,
  BookOpen,
  MapPin,
  Cog,
  Pipette,
  Wind,
  Sparkles,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Battery,
  BatteryCharging,
  Wifi,
  Bluetooth
} from "lucide-react";
import { spacing, typography, shadows, borderRadius, transitions } from "../components/shared/styles";
import ActionButton from "../components/shared/ActionButton";
import FormField from "../components/shared/FormField";
import Badge from "../components/shared/Badge";
import Toast from "../components/shared/Toast";

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

const DEFAULT_EVENT_TYPES = [
  { id: "work_order", name: "Arbetsorder", icon: "Wrench", color: "#3b82f6" },
  { id: "meeting", name: "Möte", icon: "Users", color: "#8b5cf6" },
  { id: "break", name: "Rast/Paus", icon: "Clock", color: "#6b7280" },
  { id: "training", name: "Utbildning", icon: "Shield", color: "#f59e0b" },
  { id: "other", name: "Övrigt", icon: "MoreHorizontal", color: "#ec4899" }
];

// Available icons for work types and event types
const AVAILABLE_ICONS = {
  // Verktyg & Hantverk
  Hammer, Wrench, Paintbrush, Scissors,
  // Elektricitet & Teknik
  Zap, Cpu, Plug, Radio, Battery, BatteryCharging, Wifi, Bluetooth,
  // Byggnader & Konstruktion
  Building, Building2, Home, Construction, Factory, Warehouse, HardHat,
  // Transport & Logistik
  Truck, Car, Package,
  // Natur & Miljö & Väder
  TreePine, Leaf, Droplet, Waves, Flame, Wind, Sun, Moon, Cloud, CloudRain,
  // Kommunikation
  Phone, MessageSquare, Bell, Mail,
  // Dokument & Organisation
  FileText, FileCheck, ClipboardCheck, Briefcase, Archive, Box,
  // Personer & Team
  Users, Shield,
  // Övrigt
  Coffee, BookOpen, MapPin, Cog, Pipette, Sparkles,
  // Generellt
  Calendar, Clock, Settings, DollarSign, Star, CheckSquare, Target, Lightbulb, MoreHorizontal
};

const IconComponent = ({ iconName, size = 20, color }) => {
  const Icon = AVAILABLE_ICONS[iconName] || MoreHorizontal;
  return <Icon size={size} color={color} />;
};

export default function SettingsPage() {
  const { userDetails } = useAuth();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const [activeTab, setActiveTab] = useState("users"); // timeCodes, users, workTypes, eventTypes
  const [timeCodes, setTimeCodes] = useState([]);
  const [users, setUsers] = useState([]);
  const [workTypes, setWorkTypes] = useState([]);
  const [eventTypes, setEventTypes] = useState(DEFAULT_EVENT_TYPES);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [invitingUser, setInvitingUser] = useState(false);
  const [editingOrg, setEditingOrg] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [fetchingCompanyData, setFetchingCompanyData] = useState(false);
  const [companyDataFetched, setCompanyDataFetched] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);

  // Redirect non-admin users to dashboard
  useEffect(() => {
    if (userDetails && userDetails.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [userDetails, navigate]);

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

  const [newEventType, setNewEventType] = useState({
    id: "",
    name: "",
    icon: "Briefcase",
    color: "#3b82f6"
  });

  useEffect(() => {
    fetchSettings();
    fetchTimeCodes();
    fetchUsers();
    fetchOrganization();
  }, [userDetails]);

  const fetchTimeCodes = async () => {
    if (!userDetails?.organizationId) {
      console.log('⚠️ SettingsPage: No organizationId, using default time codes');
      setTimeCodes(DEFAULT_TIME_CODES);
      return;
    }

    try {
      console.log('🔍 SettingsPage: Fetching time codes for organization:', userDetails.organizationId);
      const { data, error } = await supabase
        .from('time_codes')
        .select('*')
        .eq('organization_id', userDetails.organizationId)
        .order('code', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Convert from database format to UI format
        const convertedTimeCodes = data.map(tc => ({
          id: tc.code,
          name: tc.name,
          color: tc.color || "#3b82f6",
          billable: tc.type === 'Arbetstid',
          hourlyRate: tc.rate || 0
        }));
        setTimeCodes(convertedTimeCodes);
        console.log('✅ SettingsPage: Fetched', convertedTimeCodes.length, 'time codes from database');
      } else {
        // No time codes found - create defaults in database
        console.log('⚠️ SettingsPage: No time codes found, creating defaults in database...');

        const defaultDbTimeCodes = DEFAULT_TIME_CODES.map(tc => ({
          code: tc.id,
          name: tc.name,
          type: tc.billable ? 'Arbetstid' : 'Interntid',
          rate: tc.hourlyRate || 0,
          color: tc.color || '#3b82f6',
          organization_id: userDetails.organizationId
        }));

        const { error: insertError } = await supabase
          .from('time_codes')
          .insert(defaultDbTimeCodes);

        if (insertError) {
          console.error('❌ SettingsPage: Error creating default time codes:', insertError);
          setTimeCodes(DEFAULT_TIME_CODES);
        } else {
          console.log('✅ SettingsPage: Default time codes created in database');
          setTimeCodes(DEFAULT_TIME_CODES);
        }
      }
    } catch (err) {
      console.error("❌ SettingsPage: Error fetching time codes:", err);
      setTimeCodes(DEFAULT_TIME_CODES);
    }
  };

  const fetchSettings = async () => {
    if (!userDetails) {
      console.log('⏳ SettingsPage: Waiting for userDetails to load...');
      return;
    }

    if (!userDetails.organizationId) {
      console.log('⚠️ SettingsPage: No organizationId, using default settings');
      setWorkTypes(DEFAULT_WORK_TYPES);
      setEventTypes(DEFAULT_EVENT_TYPES);
      setLoading(false);
      return;
    }

    console.log('🔍 SettingsPage: Fetching settings...');

    try {
      setLoading(true);
      const { data: settingsData, error } = await supabase
        .from('settings')
        .select('*')
        .eq('organization_id', userDetails.organizationId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (settingsData) {
        setWorkTypes(settingsData.work_types || DEFAULT_WORK_TYPES);
        setEventTypes(settingsData.event_types || DEFAULT_EVENT_TYPES);
        console.log('✅ SettingsPage: Settings fetched successfully');
      } else {
        // Initialize with defaults
        setWorkTypes(DEFAULT_WORK_TYPES);
        setEventTypes(DEFAULT_EVENT_TYPES);
        console.log('⚠️ SettingsPage: No settings found, creating defaults...');
        const { error: insertError } = await supabase
          .from('settings')
          .insert({
            work_types: DEFAULT_WORK_TYPES,
            event_types: DEFAULT_EVENT_TYPES,
            organization_id: userDetails.organizationId
          });

        if (insertError) throw insertError;
        console.log('✅ SettingsPage: Default settings created');
      }
    } catch (err) {
      console.error("❌ SettingsPage: Error fetching settings:", err);
      setToast({ message: "Kunde inte hämta inställningar", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!userDetails?.organizationId) {
      console.log('⚠️ SettingsPage: No organizationId, skipping user fetch');
      setUsers([]);
      return;
    }

    try {
      console.log('🔍 SettingsPage: Fetching users for organization:', userDetails.organizationId);
      const { data: usersData, error } = await supabase
        .from('schedulable_users')
        .select('*')
        .eq('organization_id', userDetails.organizationId);

      if (error) throw error;

      const usersList = usersData.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        uid: user.uid
      }));
      setUsers(usersList);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchOrganization = async () => {
    if (!userDetails?.organizationId) {
      console.log('⚠️ SettingsPage: No organizationId, skipping organization fetch');
      return;
    }

    try {
      console.log('🔍 SettingsPage: Fetching organization:', userDetails.organizationId);
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', userDetails.organizationId)
        .single();

      if (error) throw error;

      setOrganization(data);
      console.log('✅ SettingsPage: Organization fetched:', data?.company_name);
    } catch (err) {
      console.error("Error fetching organization:", err);
      setToast({ message: "Kunde inte hämta organisationsinformation", type: "error" });
    }
  };

  const handleUpdateOrganization = (field, value) => {
    setOrganization(prev => ({ ...prev, [field]: value }));
  };

  // Validate Swedish organization number format
  const isValidOrgNr = (orgNr) => {
    const cleaned = orgNr.replace(/[\s-]/g, '');
    return /^\d{10}$/.test(cleaned);
  };

  // Swedish bank BIC codes based on clearing numbers
  const getBICFromIBAN = (iban) => {
    if (!iban) return '';

    // Remove spaces and convert to uppercase
    const cleanIban = iban.replace(/\s/g, '').toUpperCase();

    // Check if it's a Swedish IBAN (starts with SE)
    if (!cleanIban.startsWith('SE')) return '';

    // Extract clearing number from IBAN (positions 4-7 after SE and check digits)
    const clearingNumber = cleanIban.substring(4, 8);
    const clearingNum = parseInt(clearingNumber, 10);

    // Map clearing numbers to BIC codes for major Swedish banks
    const bankBICMap = [
      { range: [1000, 1999], bic: 'SWEDSESS', name: 'Swedbank' },
      { range: [2000, 2999], bic: 'SWEDSESS', name: 'Swedbank' },
      { range: [3000, 3299], bic: 'NDEASESS', name: 'Nordea' },
      { range: [3300, 3399], bic: 'NDEASESS', name: 'Nordea' },
      { range: [3400, 3409], bic: 'NDEASESS', name: 'Nordea' },
      { range: [3410, 3781], bic: 'NDEASESS', name: 'Nordea - Personkonton' },
      { range: [3782, 3999], bic: 'NDEASESS', name: 'Nordea' },
      { range: [4000, 4999], bic: 'NDEASESS', name: 'Nordea' },
      { range: [5000, 5999], bic: 'HANDSESS', name: 'Handelsbanken' },
      { range: [6000, 6999], bic: 'HANDSESS', name: 'Handelsbanken' },
      { range: [7000, 7999], bic: 'SWEDSESS', name: 'Swedbank' },
      { range: [8000, 8999], bic: 'SWEDSESS', name: 'Swedbank' },
      { range: [9020, 9029], bic: 'ECUTSES2', name: 'Länsförsäkringar Bank' },
      { range: [9040, 9049], bic: 'CITISGSX', name: 'Citibank' },
      { range: [9060, 9069], bic: 'FIKUSES3', name: 'Länsförsäkringar Bank' },
      { range: [9100, 9109], bic: 'ESSESGSG', name: 'Skandiabanken' },
      { range: [9120, 9124], bic: 'ESSESGSG', name: 'Skandiabanken' },
      { range: [9130, 9149], bic: 'ESSESESS', name: 'SEB' },
      { range: [9150, 9169], bic: 'ESSESESS', name: 'SEB' },
      { range: [9170, 9179], bic: 'IKANO', name: 'IKANO Bank' },
      { range: [9180, 9189], bic: 'DNBASESS', name: 'DNB Bank' },
      { range: [9190, 9199], bic: 'DABASESX', name: 'Danske Bank' },
      { range: [9200, 9209], bic: 'ESSESESS', name: 'SEB' },
      { range: [9230, 9239], bic: 'ESSESESS', name: 'SEB' },
      { range: [9250, 9259], bic: 'ESSESESS', name: 'SEB' },
      { range: [9260, 9269], bic: 'NDEAFIHH', name: 'Nordea Finland' },
      { range: [9270, 9279], bic: 'ESSESESS', name: 'SEB' },
      { range: [9300, 9349], bic: 'ESSESESS', name: 'SEB' },
      { range: [9400, 9449], bic: 'ESSESESS', name: 'SEB' },
      { range: [9500, 9549], bic: 'ESSESESS', name: 'SEB' },
      { range: [9570, 9579], bic: 'SPAASES2', name: 'Sparbanken Syd' },
      { range: [9960, 9969], bic: 'SWEDSESS', name: 'Swedbank' },
    ];

    // Find matching bank
    for (const bank of bankBICMap) {
      if (clearingNum >= bank.range[0] && clearingNum <= bank.range[1]) {
        return bank.bic;
      }
    }

    return '';
  };

  // Auto-fill BIC when IBAN changes
  const handleIBANChange = (value) => {
    handleUpdateOrganization('iban', value);

    // Automatically detect and fill BIC
    const detectedBIC = getBICFromIBAN(value);
    if (detectedBIC && !organization.bic) {
      handleUpdateOrganization('bic', detectedBIC);
    }
  };

  // Fetch company data from organization number using Allabolag
  const fetchCompanyData = async () => {
    if (!organization?.org_nr || !isValidOrgNr(organization.org_nr)) {
      setToast({ type: 'error', message: 'Ange ett giltigt organisationsnummer (10 siffror)' });
      return;
    }

    setFetchingCompanyData(true);
    setCompanyDataFetched(false);

    try {
      // Fetch directly from Allabolag using CORS proxy
      const cleanedOrgNr = organization.org_nr.replace(/[\s-]/g, '');
      const allabolagUrl = `https://www.allabolag.se/${cleanedOrgNr}`;

      // Use CORS proxy to bypass CORS restrictions
      const corsProxy = 'https://corsproxy.io/?';
      const url = corsProxy + encodeURIComponent(allabolagUrl);

      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Företaget kunde inte hittas');
      }

      const html = await response.text();

      // Extract JSON data from __NEXT_DATA__ script tag
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/);

      if (!nextDataMatch) {
        throw new Error('Kunde inte hämta företagsdata');
      }

      const nextData = JSON.parse(nextDataMatch[1]);
      const company = nextData?.props?.pageProps?.company;

      if (!company || !company.name) {
        throw new Error('Kunde inte hitta företagsuppgifter');
      }

      // Extract and format the data
      const companyData = {
        name: company.name || '',
        address: company.postalAddress?.addressLine || company.visitingAddress?.street || company.address?.street || '',
        zipCode: company.postalAddress?.zipCode || company.visitingAddress?.postalCode || company.address?.postalCode || '',
        city: company.postalAddress?.postPlace || company.visitingAddress?.city || company.address?.city || '',
      };

      console.log('✅ Extracted company data:', companyData);

      // Update organization with fetched data
      setOrganization(prev => ({
        ...prev,
        company_name: companyData.name || prev.company_name,
        address: companyData.address || prev.address,
        zip_code: companyData.zipCode || prev.zip_code,
        city: companyData.city || prev.city
      }));

      setCompanyDataFetched(true);
      setToast({ type: 'success', message: 'Företagsuppgifter hämtade!' });
      setTimeout(() => setCompanyDataFetched(false), 3000);

    } catch (error) {
      console.error('Error fetching company data:', error);
      setToast({
        type: 'error',
        message: 'Kunde inte hämta företagsuppgifter. Kontrollera organisationsnumret eller fyll i uppgifterna manuellt.'
      });
    } finally {
      setFetchingCompanyData(false);
    }
  };

  const handleSaveOrganization = async () => {
    if (!userDetails?.organizationId) {
      setToast({ message: "Kunde inte hitta organisations-ID", type: "error" });
      return;
    }

    try {
      // Only update fields that exist in the database
      const updateData = {};

      if (organization.company_name !== undefined) updateData.company_name = organization.company_name;
      if (organization.org_nr !== undefined) updateData.org_nr = organization.org_nr;
      if (organization.vat_nr !== undefined) updateData.vat_nr = organization.vat_nr;
      if (organization.our_reference !== undefined) updateData.our_reference = organization.our_reference;
      if (organization.address !== undefined) updateData.address = organization.address;
      if (organization.zip_code !== undefined) updateData.zip_code = organization.zip_code;
      if (organization.city !== undefined) updateData.city = organization.city;
      if (organization.phone !== undefined) updateData.phone = organization.phone;
      if (organization.email !== undefined) updateData.email = organization.email;
      if (organization.bankgiro !== undefined) updateData.bankgiro = organization.bankgiro;
      if (organization.plusgiro !== undefined) updateData.plusgiro = organization.plusgiro;
      if (organization.iban !== undefined) updateData.iban = organization.iban;
      if (organization.bic !== undefined) updateData.bic = organization.bic;
      if (organization.is_fa_approved !== undefined) updateData.is_fa_approved = organization.is_fa_approved;

      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', userDetails.organizationId);

      if (error) throw error;

      setToast({ message: "Organisationsinformation sparad!", type: "success" });
      setEditingOrg(false);
      await fetchOrganization();
    } catch (err) {
      console.error("Error saving organization:", err);
      setToast({ message: "Kunde inte spara organisationsinformation", type: "error" });
    }
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setToast({ message: "Vänligen välj en bildfil", type: "error" });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setToast({ message: "Bilden får max vara 2MB", type: "error" });
      return;
    }

    setUploadingLogo(true);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userDetails.organizationId}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('organization-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('organization-logos')
        .getPublicUrl(fileName);

      // Update organization with logo URL
      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          logo_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userDetails.organizationId);

      if (updateError) throw updateError;

      setToast({ message: "Logotyp uppladdad!", type: "success" });
      await fetchOrganization();
    } catch (err) {
      console.error("Error uploading logo:", err);
      setToast({ message: "Kunde inte ladda upp logotyp", type: "error" });
    } finally {
      setUploadingLogo(false);
    }
  };

  const saveSettings = async (updatedWorkTypes, updatedEventTypes) => {
    if (!userDetails?.organizationId) return;

    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          work_types: updatedWorkTypes || workTypes,
          event_types: updatedEventTypes || eventTypes,
          organization_id: userDetails.organizationId
        }, {
          onConflict: 'organization_id'
        });

      if (error) throw error;

      if (updatedWorkTypes) setWorkTypes(updatedWorkTypes);
      if (updatedEventTypes) setEventTypes(updatedEventTypes);
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
    try {
      const timeCode = timeCodes.find(tc => tc.id === editingId);
      if (!timeCode) return;

      if (!userDetails?.organizationId) {
        setToast({ message: "Kunde inte hitta organisations-ID", type: "error" });
        return;
      }

      // Convert UI format to database format
      const dbData = {
        name: timeCode.name,
        type: timeCode.billable ? 'Arbetstid' : 'Interntid',
        rate: timeCode.hourlyRate || 0,
        color: timeCode.color || '#3b82f6'
      };

      const { error } = await supabase
        .from('time_codes')
        .update(dbData)
        .eq('code', editingId)
        .eq('organization_id', userDetails.organizationId);

      if (error) throw error;

      setToast({ message: "Tidkod uppdaterad!", type: "success" });
      setEditingId(null);
      await fetchTimeCodes();
    } catch (err) {
      console.error("Error updating time code:", err);
      setToast({ message: "Kunde inte uppdatera tidkod", type: "error" });
    }
  };

  const handleAddTimeCode = async () => {
    if (!newTimeCode.name || !newTimeCode.id) {
      setToast({ message: "Namn och ID är obligatoriska", type: "error" });
      return;
    }

    if (!userDetails?.organizationId) {
      setToast({ message: "Kunde inte hitta organisations-ID", type: "error" });
      return;
    }

    if (timeCodes.find(tc => tc.id === newTimeCode.id)) {
      setToast({ message: "En tidkod med detta ID finns redan", type: "error" });
      return;
    }

    try {
      // Convert UI format to database format
      const dbData = {
        code: newTimeCode.id,
        name: newTimeCode.name,
        type: newTimeCode.billable ? 'Arbetstid' : 'Interntid',
        rate: newTimeCode.hourlyRate || 0,
        color: newTimeCode.color || '#3b82f6',
        organization_id: userDetails.organizationId
      };

      const { error } = await supabase
        .from('time_codes')
        .insert([dbData]);

      if (error) throw error;

      setToast({ message: "Tidkod tillagd!", type: "success" });
      setNewTimeCode({
        id: "",
        name: "",
        color: "#3b82f6",
        billable: true,
        hourlyRate: 650
      });
      setShowAddForm(false);
      await fetchTimeCodes();
    } catch (err) {
      console.error("Error adding time code:", err);
      setToast({ message: "Kunde inte lägga till tidkod", type: "error" });
    }
  };

  const handleDeleteTimeCode = async (id) => {
    if (!window.confirm("Är du säker på att du vill ta bort denna tidkod?")) return;

    if (!userDetails?.organizationId) {
      setToast({ message: "Kunde inte hitta organisations-ID", type: "error" });
      return;
    }

    try {
      const { error } = await supabase
        .from('time_codes')
        .delete()
        .eq('code', id)
        .eq('organization_id', userDetails.organizationId);

      if (error) throw error;

      setToast({ message: "Tidkod borttagen!", type: "success" });
      await fetchTimeCodes();
    } catch (err) {
      console.error("Error deleting time code:", err);
      setToast({ message: "Kunde inte ta bort tidkod", type: "error" });
    }
  };

  // Work Type handlers
  const handleUpdateWorkType = (id, field, value) => {
    const updated = workTypes.map(wt =>
      wt.id === id ? { ...wt, [field]: value } : wt
    );
    setWorkTypes(updated);
  };

  const handleSaveWorkType = async () => {
    await saveSettings(workTypes);
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
    await saveSettings(updated);

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
    await saveSettings(updated);
  };

  // Event Type handlers
  const handleUpdateEventType = (id, field, value) => {
    const updated = eventTypes.map(et =>
      et.id === id ? { ...et, [field]: value } : et
    );
    setEventTypes(updated);
  };

  const handleSaveEventType = async () => {
    await saveSettings(null, eventTypes);
    setEditingId(null);
  };

  const handleAddEventType = async () => {
    if (!newEventType.name || !newEventType.id) {
      setToast({ message: "Namn och ID är obligatoriska", type: "error" });
      return;
    }

    if (eventTypes.find(et => et.id === newEventType.id)) {
      setToast({ message: "En händelsetyp med detta ID finns redan", type: "error" });
      return;
    }

    const updated = [...eventTypes, { ...newEventType }];
    await saveSettings(null, updated);

    setNewEventType({
      id: "",
      name: "",
      icon: "Briefcase",
      color: "#3b82f6"
    });
    setShowAddForm(false);
  };

  const handleDeleteEventType = async (id) => {
    if (!window.confirm("Är du säker på att du vill ta bort denna händelsetyp?")) return;
    const updated = eventTypes.filter(et => et.id !== id);
    await saveSettings(null, updated);
  };

  // User handlers
  const handleInviteUser = async () => {
    if (!newUser.email) {
      setToast({ message: "E-post är obligatoriskt", type: "error" });
      return;
    }

    if (!userDetails?.organizationId) {
      setToast({ message: "Kunde inte hitta organisations-ID", type: "error" });
      return;
    }

    setInvitingUser(true);

    try {
      // Call the Edge Function to create invitation
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email: newUser.email,
          role: newUser.role,
          organization_id: userDetails.organizationId
        }
      });

      if (error) throw error;

      // Get organization name for email
      const { data: orgData } = await supabase
        .from('organizations')
        .select('company_name')
        .eq('id', userDetails.organizationId)
        .single();

      const companyName = orgData?.company_name || 'AIO Arbetsorder';

      // Create email with invitation link
      const subject = `Inbjudan till ${companyName}`;
      const body = `Hej!

Du har blivit inbjuden att gå med i ${companyName} på AIO Arbetsorder.

Klicka på länken nedan för att acceptera inbjudan och skapa ditt konto:
${data.inviteUrl}

Länken är giltig i 7 dagar.

Välkommen!`;

      // Open email client
      const mailtoLink = `mailto:${newUser.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;

      setToast({
        message: `✅ Inbjudan skapad för ${newUser.email}! Email-program öppnas för att skicka inbjudan.`,
        type: "success"
      });

      setNewUser({ email: "", role: "user" });
      setShowAddForm(false);

    } catch (error) {
      console.error('Error inviting user:', error);
      setToast({
        message: error.message || 'Kunde inte bjuda in användare',
        type: "error"
      });
    } finally {
      setInvitingUser(false);
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('schedulable_users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setToast({ message: "Användarens roll uppdaterad!", type: "success" });
      await fetchUsers();
    } catch (err) {
      console.error("Error updating user role:", err);
      setToast({ message: "Kunde inte uppdatera roll", type: "error" });
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Är du säker på att du vill ta bort ${userEmail}?`)) return;

    try {
      const { error } = await supabase
        .from('schedulable_users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setToast({ message: "Användare borttagen", type: "success" });
      await fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      setToast({ message: "Kunde inte ta bort användare", type: "error" });
    }
  };

  // CSV Import handler
  const handleCSVImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);
    setImportResults(null);

    try {
      Papa.parse(file, {
        header: true,
        delimiter: ";",
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const importStats = {
              total: results.data.length,
              success: 0,
              failed: 0,
              errors: [],
              createdCustomers: []
            };

            // Get all existing customers for this organization
            const { data: existingCustomers } = await supabase
              .from('customers')
              .select('*')
              .eq('organization_id', userDetails.organizationId);

            const customerMap = new Map();
            existingCustomers?.forEach(c => {
              if (c.customer_number) customerMap.set(c.customer_number, c);
              customerMap.set(c.name.toLowerCase(), c);
            });

            // Process each order
            for (const row of results.data) {
              try {
                // Find or create customer
                let customer = null;
                const customerNumber = row['Kundnummer']?.trim();
                const customerName = row['Kund']?.trim();

                if (customerNumber && customerMap.has(customerNumber)) {
                  customer = customerMap.get(customerNumber);
                } else if (customerName && customerMap.has(customerName.toLowerCase())) {
                  customer = customerMap.get(customerName.toLowerCase());
                } else if (customerName) {
                  // Create new customer
                  const { data: newCustomer, error: customerError } = await supabase
                    .from('customers')
                    .insert([{
                      organization_id: userDetails.organizationId,
                      name: customerName,
                      customer_number: customerNumber || `KND-${Date.now()}`,
                      address: row['Objekt']?.trim() || '',
                      contact_person: row['Kontaktperson']?.trim() || '',
                      created_at: new Date().toISOString()
                    }])
                    .select()
                    .single();

                  if (customerError) throw customerError;

                  customer = newCustomer;
                  customerMap.set(customerNumber || customerName.toLowerCase(), newCustomer);
                  importStats.createdCustomers.push(customerName);
                }

                if (!customer) {
                  importStats.failed++;
                  importStats.errors.push(`Rad ${importStats.success + importStats.failed + 1}: Ingen kund hittades eller skapad`);
                  continue;
                }

                // Map work type
                const workTypeMap = {
                  'VVS': 'vvs',
                  'El': 'el',
                  'Bygg': 'bygg',
                  'IT': 'it',
                  'Rivning': 'rivning',
                  'Anläggning': 'anlaggning',
                  'Garanti': 'garanti'
                };
                const workType = workTypeMap[row['Arbetsordertyp']?.trim()] || 'ovrigt';

                // Map status
                const statusMap = {
                  'Avslutad': 'Full fakturerad',
                  'Pågående': 'Pågående',
                  'Planerad': 'Planerad'
                };
                const status = statusMap[row['Status']?.trim()] || 'Ej påbörjad';

                // Create order
                const { error: orderError } = await supabase
                  .from('orders')
                  .insert([{
                    organization_id: userDetails.organizationId,
                    order_number: row['Nummer']?.trim() || `ORD-${Date.now()}`,
                    title: row['Benämning']?.trim() || 'Importerad arbetsorder',
                    description: row['Beskrivning']?.trim() || '',
                    customer_id: customer.id,
                    work_type: workType,
                    status: status,
                    address: row['Objekt']?.trim() || customer.address || '',
                    deadline: row['Slut'] ? new Date(row['Slut']).toISOString() : null,
                    billing_type: 'Löpande pris',
                    billable: true,
                    priority: 'Mellan',
                    estimated_time: null,
                    assigned_to: [],
                    fixed_price: null
                  }]);

                if (orderError) throw orderError;
                importStats.success++;

              } catch (rowError) {
                importStats.failed++;
                importStats.errors.push(`Rad ${importStats.success + importStats.failed + 1}: ${rowError.message}`);
                console.error('Row import error:', rowError);
              }
            }

            setImportResults(importStats);
            setToast({
              message: `Import klar! ${importStats.success} ordrar importerade, ${importStats.failed} misslyckades.`,
              type: importStats.failed > 0 ? "warning" : "success"
            });

          } catch (error) {
            console.error('Import processing error:', error);
            setToast({ message: `Import misslyckades: ${error.message}`, type: "error" });
          } finally {
            setImporting(false);
          }
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          setToast({ message: `Kunde inte läsa CSV-fil: ${error.message}`, type: "error" });
          setImporting(false);
        }
      });
    } catch (error) {
      console.error('CSV import error:', error);
      setToast({ message: `Import misslyckades: ${error.message}`, type: "error" });
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <Settings size={48} style={{ marginBottom: "1rem", opacity: 0.5, color: '#60a5fa' }} />
        <p style={{ color: '#e2e8f0' }}>Laddar inställningar...</p>
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
          color: '#fff',
          margin: 0,
          display: "flex",
          alignItems: "center",
          gap: spacing[3]
        }}>
          <Settings size={32} color="#60a5fa" />
          Inställningar
        </h1>
        <p style={{
          color: '#94a3b8',
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
        borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
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
            borderBottom: `3px solid ${activeTab === "users" ? "#60a5fa" : "transparent"}`,
            color: activeTab === "users" ? "#60a5fa" : "#94a3b8",
            fontWeight: typography.fontWeight.semibold,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: spacing[2],
            marginBottom: "-2px",
            transition: `all ${transitions.base}`
          }}
        >
          <Building2 size={18} />
          Organisation
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
            borderBottom: `3px solid ${activeTab === "timeCodes" ? "#60a5fa" : "transparent"}`,
            color: activeTab === "timeCodes" ? "#60a5fa" : "#94a3b8",
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
            borderBottom: `3px solid ${activeTab === "workTypes" ? "#60a5fa" : "transparent"}`,
            color: activeTab === "workTypes" ? "#60a5fa" : "#94a3b8",
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

        <button
          onClick={() => {
            setActiveTab("eventTypes");
            setShowAddForm(false);
            setEditingId(null);
          }}
          style={{
            padding: `${spacing[3]} ${spacing[6]}`,
            border: "none",
            backgroundColor: "transparent",
            borderBottom: `3px solid ${activeTab === "eventTypes" ? "#60a5fa" : "transparent"}`,
            color: activeTab === "eventTypes" ? "#60a5fa" : "#94a3b8",
            fontWeight: typography.fontWeight.semibold,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: spacing[2],
            marginBottom: "-2px",
            transition: `all ${transitions.base}`
          }}
        >
          <Calendar size={18} />
          Händelsetyper
        </button>

        <button
          onClick={() => {
            setActiveTab("import");
            setShowAddForm(false);
            setEditingId(null);
            setImportResults(null);
          }}
          style={{
            padding: `${spacing[3]} ${spacing[6]}`,
            border: "none",
            backgroundColor: "transparent",
            borderBottom: `3px solid ${activeTab === "import" ? "#60a5fa" : "transparent"}`,
            color: activeTab === "import" ? "#60a5fa" : "#94a3b8",
            fontWeight: typography.fontWeight.semibold,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: spacing[2],
            marginBottom: "-2px",
            transition: `all ${transitions.base}`
          }}
        >
          <FileUp size={18} />
          Importera
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === "users" && (
        <>
          {/* Organization Information Section */}
          <div style={{
            ...darkCardStyle,
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={darkSectionHeaderStyle}>
              <Building2 size={20} color="#60a5fa" />
              <span>Organisationsinformation</span>
            </div>

            <p style={{
              color: '#94a3b8',
              marginBottom: spacing[6]
            }}>
              Hantera din organisations detaljer, logotyp och kontaktinformation.
            </p>

            {organization && (
              <div>
                {/* Logo Upload Section */}
                <div style={{
                  padding: spacing[6],
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: borderRadius.lg,
                  marginBottom: spacing[6],
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[6]
                }}>
                  <div>
                    {organization.logo_url ? (
                      <img
                        src={organization.logo_url}
                        alt="Organisationens logotyp"
                        style={{
                          width: '120px',
                          height: '120px',
                          objectFit: 'contain',
                          borderRadius: borderRadius.lg,
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          padding: spacing[3]
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '120px',
                        height: '120px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: borderRadius.lg,
                        border: '2px dashed rgba(255, 255, 255, 0.2)'
                      }}>
                        <Image size={48} color="#94a3b8" />
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      margin: `0 0 ${spacing[2]} 0`,
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.semibold,
                      color: '#fff'
                    }}>
                      Logotyp
                    </h3>
                    <p style={{
                      color: '#94a3b8',
                      fontSize: typography.fontSize.sm,
                      marginBottom: spacing[4]
                    }}>
                      Ladda upp din organisations logotyp. Används i PDF-rapporter och på fakturor. Max 2MB, PNG/JPG.
                    </p>

                    <label style={{ cursor: 'pointer' }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        style={{ display: 'none' }}
                        disabled={uploadingLogo}
                      />
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: spacing[2],
                        padding: `${spacing[2]} ${spacing[4]}`,
                        backgroundColor: uploadingLogo ? 'rgba(255, 255, 255, 0.05)' : 'rgba(59, 130, 246, 0.1)',
                        color: uploadingLogo ? '#94a3b8' : '#60a5fa',
                        borderRadius: borderRadius.lg,
                        border: `2px solid ${uploadingLogo ? 'rgba(255, 255, 255, 0.1)' : 'rgba(59, 130, 246, 0.3)'}`,
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.semibold,
                        transition: `all ${transitions.base}`,
                        cursor: uploadingLogo ? 'not-allowed' : 'pointer'
                      }}>
                        <Upload size={18} />
                        {uploadingLogo ? 'Laddar upp...' : 'Välj logotyp'}
                      </div>
                    </label>
                  </div>
                </div>

                {/* Edit Button */}
                {!editingOrg && (
                  <div style={{ marginBottom: spacing[6] }}>
                    <ActionButton
                      onClick={() => setEditingOrg(true)}
                      variant="primary"
                      icon={<Edit3 size={18} />}
                    >
                      Redigera organisationsinformation
                    </ActionButton>
                  </div>
                )}

                {/* Organization Form */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                  gap: spacing[4]
                }}>
                  {/* Företagsinformation */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <h3 style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.semibold,
                      color: '#60a5fa',
                      marginBottom: spacing[4],
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[2]
                    }}>
                      <Building size={18} />
                      Företagsinformation
                    </h3>
                  </div>

                  <FormField label="Företagsnamn" required>
                    <input
                      type="text"
                      value={organization.company_name || ''}
                      onChange={(e) => handleUpdateOrganization('company_name', e.target.value)}
                      disabled={!editingOrg}
                      style={{
                        ...darkInputStyle,
                        backgroundColor: editingOrg ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        cursor: editingOrg ? 'text' : 'not-allowed'
                      }}
                      placeholder="Ditt Företag AB"
                    />
                  </FormField>

                  <FormField label="Organisationsnummer">
                    <div style={{ display: 'flex', gap: spacing[2], alignItems: 'flex-start' }}>
                      <input
                        type="text"
                        value={organization.org_nr || ''}
                        onChange={(e) => handleUpdateOrganization('org_nr', e.target.value)}
                        disabled={!editingOrg}
                        style={{
                          ...darkInputStyle,
                          backgroundColor: editingOrg ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                          cursor: editingOrg ? 'text' : 'not-allowed',
                          flex: 1
                        }}
                        placeholder="XXXXXX-XXXX"
                      />
                      {editingOrg && (
                        <button
                          onClick={fetchCompanyData}
                          disabled={fetchingCompanyData || !organization?.org_nr}
                          style={{
                            padding: `${spacing[3]} ${spacing[4]}`,
                            backgroundColor: fetchingCompanyData
                              ? 'rgba(255, 255, 255, 0.05)'
                              : companyDataFetched
                              ? 'rgba(34, 197, 94, 0.2)'
                              : 'rgba(59, 130, 246, 0.2)',
                            color: fetchingCompanyData
                              ? '#94a3b8'
                              : companyDataFetched
                              ? '#22c55e'
                              : '#60a5fa',
                            border: `2px solid ${
                              fetchingCompanyData
                                ? 'rgba(255, 255, 255, 0.1)'
                                : companyDataFetched
                                ? 'rgba(34, 197, 94, 0.3)'
                                : 'rgba(59, 130, 246, 0.3)'
                            }`,
                            borderRadius: borderRadius.lg,
                            cursor: fetchingCompanyData || !organization?.org_nr ? 'not-allowed' : 'pointer',
                            fontWeight: typography.fontWeight.semibold,
                            fontSize: typography.fontSize.sm,
                            transition: `all ${transitions.base}`,
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2]
                          }}
                          onMouseEnter={(e) => {
                            if (!fetchingCompanyData && organization?.org_nr) {
                              e.currentTarget.style.backgroundColor = companyDataFetched
                                ? 'rgba(34, 197, 94, 0.3)'
                                : 'rgba(59, 130, 246, 0.3)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!fetchingCompanyData) {
                              e.currentTarget.style.backgroundColor = companyDataFetched
                                ? 'rgba(34, 197, 94, 0.2)'
                                : 'rgba(59, 130, 246, 0.2)';
                            }
                          }}
                        >
                          {fetchingCompanyData ? (
                            <>
                              <div style={{
                                width: '14px',
                                height: '14px',
                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                borderTopColor: '#94a3b8',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite'
                              }} />
                              Hämtar...
                            </>
                          ) : companyDataFetched ? (
                            <>✓ Hämtat</>
                          ) : (
                            <>Hämta uppgifter</>
                          )}
                        </button>
                      )}
                    </div>
                    {editingOrg && (
                      <p style={{
                        fontSize: typography.fontSize.xs,
                        color: '#94a3b8',
                        marginTop: spacing[2]
                      }}>
                        Ange organisationsnummer och klicka på "Hämta uppgifter" för att automatiskt fylla i företagsdata från Allabolag.
                      </p>
                    )}
                  </FormField>

                  <FormField label="Momsnummer">
                    <input
                      type="text"
                      value={organization.vat_nr || ''}
                      onChange={(e) => handleUpdateOrganization('vat_nr', e.target.value)}
                      disabled={!editingOrg}
                      style={{
                        ...darkInputStyle,
                        backgroundColor: editingOrg ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        cursor: editingOrg ? 'text' : 'not-allowed'
                      }}
                      placeholder="SE123456789001"
                    />
                  </FormField>

                  <FormField label="Vår referens">
                    <input
                      type="text"
                      value={organization.our_reference || ''}
                      onChange={(e) => handleUpdateOrganization('our_reference', e.target.value)}
                      disabled={!editingOrg}
                      style={{
                        ...darkInputStyle,
                        backgroundColor: editingOrg ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        cursor: editingOrg ? 'text' : 'not-allowed'
                      }}
                      placeholder="Namn Namnsson"
                    />
                  </FormField>

                  {/* Adressinformation */}
                  <div style={{ gridColumn: '1 / -1', marginTop: spacing[4] }}>
                    <h3 style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.semibold,
                      color: '#60a5fa',
                      marginBottom: spacing[4],
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[2]
                    }}>
                      <Home size={18} />
                      Adress
                    </h3>
                  </div>

                  <FormField label="Gatuadress" style={{ gridColumn: '1 / -1' }}>
                    <input
                      type="text"
                      value={organization.address || ''}
                      onChange={(e) => handleUpdateOrganization('address', e.target.value)}
                      disabled={!editingOrg}
                      style={{
                        ...darkInputStyle,
                        backgroundColor: editingOrg ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        cursor: editingOrg ? 'text' : 'not-allowed'
                      }}
                      placeholder="Exempelgatan 1"
                    />
                  </FormField>

                  <FormField label="Postnummer">
                    <input
                      type="text"
                      value={organization.zip_code || ''}
                      onChange={(e) => handleUpdateOrganization('zip_code', e.target.value)}
                      disabled={!editingOrg}
                      style={{
                        ...darkInputStyle,
                        backgroundColor: editingOrg ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        cursor: editingOrg ? 'text' : 'not-allowed'
                      }}
                      placeholder="123 45"
                    />
                  </FormField>

                  <FormField label="Ort">
                    <input
                      type="text"
                      value={organization.city || ''}
                      onChange={(e) => handleUpdateOrganization('city', e.target.value)}
                      disabled={!editingOrg}
                      style={{
                        ...darkInputStyle,
                        backgroundColor: editingOrg ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        cursor: editingOrg ? 'text' : 'not-allowed'
                      }}
                      placeholder="Stockholm"
                    />
                  </FormField>

                  {/* Kontaktinformation */}
                  <div style={{ gridColumn: '1 / -1', marginTop: spacing[4] }}>
                    <h3 style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.semibold,
                      color: '#60a5fa',
                      marginBottom: spacing[4],
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[2]
                    }}>
                      <Mail size={18} />
                      Kontaktinformation
                    </h3>
                  </div>

                  <FormField label="Telefonnummer">
                    <input
                      type="tel"
                      value={organization.phone || ''}
                      onChange={(e) => handleUpdateOrganization('phone', e.target.value)}
                      disabled={!editingOrg}
                      style={{
                        ...darkInputStyle,
                        backgroundColor: editingOrg ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        cursor: editingOrg ? 'text' : 'not-allowed'
                      }}
                      placeholder="070-123 45 67"
                    />
                  </FormField>

                  <FormField label="E-postadress">
                    <input
                      type="email"
                      value={organization.email || ''}
                      onChange={(e) => handleUpdateOrganization('email', e.target.value)}
                      disabled={!editingOrg}
                      style={{
                        ...darkInputStyle,
                        backgroundColor: editingOrg ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        cursor: editingOrg ? 'text' : 'not-allowed'
                      }}
                      placeholder="info@dittforetag.se"
                    />
                  </FormField>

                  {/* Betalningsinformation */}
                  <div style={{ gridColumn: '1 / -1', marginTop: spacing[4] }}>
                    <h3 style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.semibold,
                      color: '#60a5fa',
                      marginBottom: spacing[4],
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[2]
                    }}>
                      <CreditCard size={18} />
                      Betalningsinformation
                    </h3>
                  </div>

                  <FormField label="Bankgiro">
                    <input
                      type="text"
                      value={organization.bankgiro || ''}
                      onChange={(e) => handleUpdateOrganization('bankgiro', e.target.value)}
                      disabled={!editingOrg}
                      style={{
                        ...darkInputStyle,
                        backgroundColor: editingOrg ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        cursor: editingOrg ? 'text' : 'not-allowed'
                      }}
                      placeholder="123-4567"
                    />
                  </FormField>

                  <FormField label="Plusgiro">
                    <input
                      type="text"
                      value={organization.plusgiro || ''}
                      onChange={(e) => handleUpdateOrganization('plusgiro', e.target.value)}
                      disabled={!editingOrg}
                      style={{
                        ...darkInputStyle,
                        backgroundColor: editingOrg ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        cursor: editingOrg ? 'text' : 'not-allowed'
                      }}
                      placeholder="12 34 56-7"
                    />
                  </FormField>

                  <FormField label="IBAN">
                    <input
                      type="text"
                      value={organization.iban || ''}
                      onChange={(e) => handleIBANChange(e.target.value)}
                      disabled={!editingOrg}
                      style={{
                        ...darkInputStyle,
                        backgroundColor: editingOrg ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        cursor: editingOrg ? 'text' : 'not-allowed'
                      }}
                      placeholder="SE89 3000 0000 0101 2345 6789"
                    />
                    {editingOrg && organization.iban && getBICFromIBAN(organization.iban) && (
                      <p style={{
                        fontSize: typography.fontSize.xs,
                        color: '#22c55e',
                        marginTop: spacing[2],
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing[1]
                      }}>
                        ✓ BIC-kod identifierad automatiskt
                      </p>
                    )}
                  </FormField>

                  <FormField label="BIC/SWIFT">
                    <input
                      type="text"
                      value={organization.bic || ''}
                      onChange={(e) => handleUpdateOrganization('bic', e.target.value)}
                      disabled={!editingOrg}
                      style={{
                        ...darkInputStyle,
                        backgroundColor: editingOrg ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        cursor: editingOrg ? 'text' : 'not-allowed'
                      }}
                      placeholder="SWEDSESS"
                    />
                  </FormField>

                  {/* F-skatt godkännande */}
                  <div style={{ gridColumn: '1 / -1', marginTop: spacing[4] }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[3],
                      cursor: editingOrg ? 'pointer' : 'not-allowed',
                      padding: spacing[3],
                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                      borderRadius: borderRadius.lg,
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      transition: transitions.base
                    }}>
                      <input
                        type="checkbox"
                        checked={organization.is_fa_approved || false}
                        onChange={(e) => handleUpdateOrganization('is_fa_approved', e.target.checked)}
                        disabled={!editingOrg}
                        style={{
                          width: '20px',
                          height: '20px',
                          cursor: editingOrg ? 'pointer' : 'not-allowed',
                          accentColor: '#3b82f6'
                        }}
                      />
                      <div>
                        <div style={{
                          color: '#e2e8f0',
                          fontWeight: typography.fontWeight.semibold,
                          fontSize: typography.fontSize.base
                        }}>
                          Godkänd för F-skatt
                        </div>
                        <div style={{
                          color: '#94a3b8',
                          fontSize: typography.fontSize.sm,
                          marginTop: spacing[1]
                        }}>
                          Företaget är registrerat för F-skatt hos Skatteverket
                        </div>
                      </div>
                    </label>
                  </div>

                </div>

                {/* Save/Cancel buttons when editing */}
                {editingOrg && (
                  <div style={{ display: 'flex', gap: spacing[3], marginTop: spacing[6] }}>
                    <ActionButton
                      onClick={handleSaveOrganization}
                      variant="success"
                      icon={<Save size={18} />}
                    >
                      Spara ändringar
                    </ActionButton>
                    <ActionButton
                      onClick={() => {
                        setEditingOrg(false);
                        fetchOrganization(); // Reset changes
                      }}
                      variant="secondary"
                      icon={<X size={18} />}
                    >
                      Avbryt
                    </ActionButton>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Users Section */}
          <div style={{
            ...darkCardStyle,
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={darkSectionHeaderStyle}>
              <Users size={20} color="#60a5fa" />
              <span>Användare</span>
            </div>

            <p style={{
              color: '#94a3b8',
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
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: borderRadius.lg,
              marginBottom: spacing[6],
              border: '2px solid rgba(96, 165, 250, 0.3)',
              animation: 'slideDown 0.3s ease-out'
            }}>
              <h3 style={{
                margin: `0 0 ${spacing[4]} 0`,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                color: '#fff'
              }}>
                Bjud in ny användare
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: spacing[4] }}>
                <FormField label="E-post" required>
                  <div style={{ position: "relative" }}>
                    <Mail size={18} style={{
                      position: "absolute",
                      left: spacing[3],
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: '#94a3b8'
                    }} />
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="anvandare@example.com"
                      style={{ ...darkInputStyle, paddingLeft: spacing[10] }}
                    />
                  </div>
                </FormField>

                <FormField label="Roll">
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    style={darkInputStyle}
                  >
                    <option value="user" style={{ backgroundColor: '#1a1a2e' }}>Användare</option>
                    <option value="admin" style={{ backgroundColor: '#1a1a2e' }}>Admin</option>
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
                color: '#94a3b8'
              }}>
                <Users size={48} style={{ marginBottom: spacing[3], opacity: 0.5, color: '#60a5fa' }} />
                <p>Inga användare ännu. Bjud in din första användare!</p>
              </div>
            ) : (
              users.map((user, index) => (
                <div
                  key={user.id}
                  style={{
                    padding: spacing[6],
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: borderRadius.lg,
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
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
                      backgroundColor: 'rgba(96, 165, 250, 0.2)',
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: '#60a5fa',
                      fontWeight: typography.fontWeight.bold,
                      fontSize: typography.fontSize.lg
                    }}>
                      {user.email?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <div style={{
                        fontSize: typography.fontSize.base,
                        fontWeight: typography.fontWeight.semibold,
                        color: '#fff',
                        marginBottom: spacing[1]
                      }}>
                        {user.name || user.email}
                      </div>
                      <div style={{
                        fontSize: typography.fontSize.sm,
                        color: '#94a3b8',
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
                    {/* Role selector */}
                    <div style={{ minWidth: "140px" }}>
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                        style={{
                          ...darkInputStyle,
                          padding: spacing[2],
                          margin: 0,
                          fontSize: typography.fontSize.sm,
                          fontWeight: typography.fontWeight.semibold,
                          color: user.role === 'admin' ? '#fbbf24' : '#e2e8f0',
                          backgroundColor: user.role === 'admin' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                          border: `2px solid ${user.role === 'admin' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                          cursor: 'pointer'
                        }}
                      >
                        <option value="user" style={{ backgroundColor: '#1a1a2e' }}>👤 Användare</option>
                        <option value="admin" style={{ backgroundColor: '#1a1a2e' }}>👑 Admin</option>
                      </select>
                    </div>

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
        </>
      )}

      {/* Time Codes Tab */}
      {activeTab === "timeCodes" && (
        <div style={{
          ...darkCardStyle,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={darkSectionHeaderStyle}>
            <Clock size={20} color="#60a5fa" />
            <span>Tidkoder och priser</span>
          </div>

          <p style={{
            color: '#94a3b8',
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
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: borderRadius.lg,
              marginBottom: spacing[6],
              border: '2px solid rgba(96, 165, 250, 0.3)',
              animation: 'slideDown 0.3s ease-out'
            }}>
              <h3 style={{
                margin: `0 0 ${spacing[4]} 0`,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                color: '#fff'
              }}>
                Ny tidkod
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: spacing[4] }}>
                <FormField label="ID" required helper="Unikt ID för tidkoden (t.ex. 'overtime')">
                  <input
                    type="text"
                    value={newTimeCode.id}
                    onChange={(e) => setNewTimeCode({ ...newTimeCode, id: e.target.value })}
                    placeholder="overtime"
                    style={darkInputStyle}
                  />
                </FormField>

                <FormField label="Namn" required>
                  <input
                    type="text"
                    value={newTimeCode.name}
                    onChange={(e) => setNewTimeCode({ ...newTimeCode, name: e.target.value })}
                    placeholder="Övertid"
                    style={darkInputStyle}
                  />
                </FormField>

                <FormField label="Färg">
                  <input
                    type="color"
                    value={newTimeCode.color}
                    onChange={(e) => setNewTimeCode({ ...newTimeCode, color: e.target.value })}
                    style={{ ...darkInputStyle, height: "45px" }}
                  />
                </FormField>

                <FormField label="Timpris (kr, ex. moms)" icon={<DollarSign size={16} />}>
                  <input
                    type="number"
                    value={newTimeCode.hourlyRate}
                    onChange={(e) => setNewTimeCode({ ...newTimeCode, hourlyRate: parseFloat(e.target.value) || 0 })}
                    placeholder="650"
                    style={darkInputStyle}
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
                      color: '#e2e8f0'
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
                    border: `2px solid ${isEditing ? timeCode.color : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: borderRadius.lg,
                    backgroundColor: isEditing ? `${timeCode.color}10` : 'rgba(255, 255, 255, 0.03)',
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
                        color: '#94a3b8',
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
                          style={{ ...darkInputStyle, padding: spacing[2] }}
                        />
                      ) : (
                        <div style={{
                          fontSize: typography.fontSize.base,
                          fontWeight: typography.fontWeight.semibold,
                          color: '#fff',
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
                        color: '#94a3b8',
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
                          style={{ ...darkInputStyle, padding: spacing[2] }}
                        />
                      ) : (
                        <div style={{
                          fontSize: typography.fontSize.lg,
                          fontWeight: typography.fontWeight.bold,
                          color: '#fff'
                        }}>
                          {timeCode.hourlyRate} kr/h
                        </div>
                      )}
                    </div>

                    {/* Billable */}
                    <div>
                      <div style={{
                        fontSize: typography.fontSize.xs,
                        color: '#94a3b8',
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
                            fontWeight: typography.fontWeight.semibold,
                            color: '#e2e8f0'
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
                      borderTop: '2px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <FormField label="Färg">
                        <input
                          type="color"
                          value={timeCode.color}
                          onChange={(e) => handleUpdateTimeCode(timeCode.id, 'color', e.target.value)}
                          style={{ ...darkInputStyle, height: "45px", width: "200px" }}
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
          ...darkCardStyle,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={darkSectionHeaderStyle}>
            <Briefcase size={20} color="#60a5fa" />
            <span>Arbetstyper</span>
          </div>

          <p style={{
            color: '#94a3b8',
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
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: borderRadius.lg,
              marginBottom: spacing[6],
              border: '2px solid rgba(96, 165, 250, 0.3)',
              animation: 'slideDown 0.3s ease-out'
            }}>
              <h3 style={{
                margin: `0 0 ${spacing[4]} 0`,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                color: '#fff'
              }}>
                Ny arbetstyp
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: spacing[4] }}>
                <FormField label="ID" required helper="Unikt ID för arbetstypen (t.ex. 'maleri')">
                  <input
                    type="text"
                    value={newWorkType.id}
                    onChange={(e) => setNewWorkType({ ...newWorkType, id: e.target.value })}
                    placeholder="maleri"
                    style={darkInputStyle}
                  />
                </FormField>

                <FormField label="Namn" required>
                  <input
                    type="text"
                    value={newWorkType.name}
                    onChange={(e) => setNewWorkType({ ...newWorkType, name: e.target.value })}
                    placeholder="Måleri"
                    style={darkInputStyle}
                  />
                </FormField>

                <div style={{ gridColumn: "1 / -1" }}>
                  <FormField label="Ikon">
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))",
                      gap: spacing[2],
                      padding: spacing[3],
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: borderRadius.base,
                      border: '1px solid rgba(255, 255, 255, 0.1)'
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
                              border: `2px solid ${isSelected ? newWorkType.color : 'rgba(255, 255, 255, 0.1)'}`,
                              borderRadius: borderRadius.base,
                              backgroundColor: isSelected ? `${newWorkType.color}15` : 'rgba(255, 255, 255, 0.03)',
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
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                              }
                            }}
                          >
                            <Icon size={24} color={isSelected ? newWorkType.color : '#94a3b8'} />
                            <span style={{
                              fontSize: typography.fontSize.xs,
                              color: isSelected ? newWorkType.color : '#94a3b8',
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
                    style={{ ...darkInputStyle, height: "45px" }}
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
                    border: `2px solid ${isEditing ? workType.color : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: borderRadius.lg,
                    backgroundColor: isEditing ? `${workType.color}10` : 'rgba(255, 255, 255, 0.03)',
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
                          style={darkInputStyle}
                        />
                      </FormField>

                      <FormField label="Ikon">
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))",
                          gap: spacing[2],
                          padding: spacing[3],
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: borderRadius.base,
                          border: '1px solid rgba(255, 255, 255, 0.1)'
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
                                  border: `2px solid ${isSelected ? workType.color : 'rgba(255, 255, 255, 0.1)'}`,
                                  borderRadius: borderRadius.base,
                                  backgroundColor: isSelected ? `${workType.color}15` : 'rgba(255, 255, 255, 0.03)',
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
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                  }
                                }}
                              >
                                <Icon size={24} color={isSelected ? workType.color : '#94a3b8'} />
                                <span style={{
                                  fontSize: typography.fontSize.xs,
                                  color: isSelected ? workType.color : '#94a3b8',
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
                          style={{ ...darkInputStyle, height: "45px" }}
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
                          color: '#fff'
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

      {/* Event Types Tab */}
      {activeTab === "eventTypes" && (
        <div style={{
          ...darkCardStyle,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={darkSectionHeaderStyle}>
            <Calendar size={20} color="#60a5fa" />
            <span>Händelsetyper</span>
          </div>

          <p style={{
            color: '#94a3b8',
            marginBottom: spacing[6]
          }}>
            Hantera dina händelsetyper som används i schemat. Anpassa ikoner och färger för varje typ av händelse.
          </p>

          {/* Add New Button */}
          <div style={{ marginBottom: spacing[6] }}>
            <ActionButton
              onClick={() => setShowAddForm(!showAddForm)}
              variant={showAddForm ? "secondary" : "primary"}
              icon={showAddForm ? <X size={18} /> : <Plus size={18} />}
            >
              {showAddForm ? "Avbryt" : "Lägg till händelsetyp"}
            </ActionButton>
          </div>

          {/* Add New Form */}
          {showAddForm && (
            <div style={{
              padding: spacing[6],
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: borderRadius.lg,
              marginBottom: spacing[6],
              border: '2px solid rgba(96, 165, 250, 0.3)',
              animation: 'slideDown 0.3s ease-out'
            }}>
              <h3 style={{
                margin: `0 0 ${spacing[4]} 0`,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                color: '#fff'
              }}>
                Ny händelsetyp
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: spacing[4] }}>
                <FormField label="ID" required helper="Unikt ID för händelsetypen (t.ex. 'installation')">
                  <input
                    type="text"
                    value={newEventType.id}
                    onChange={(e) => setNewEventType({ ...newEventType, id: e.target.value })}
                    placeholder="installation"
                    style={darkInputStyle}
                  />
                </FormField>

                <FormField label="Namn" required>
                  <input
                    type="text"
                    value={newEventType.name}
                    onChange={(e) => setNewEventType({ ...newEventType, name: e.target.value })}
                    placeholder="Installation"
                    style={darkInputStyle}
                  />
                </FormField>

                <div style={{ gridColumn: "1 / -1" }}>
                  <FormField label="Ikon">
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))",
                      gap: spacing[2],
                      padding: spacing[3],
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: borderRadius.base,
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      {Object.keys(AVAILABLE_ICONS).map(iconName => {
                        const isSelected = newEventType.icon === iconName;
                        const Icon = AVAILABLE_ICONS[iconName];
                        return (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => setNewEventType({ ...newEventType, icon: iconName })}
                            style={{
                              padding: spacing[3],
                              border: `2px solid ${isSelected ? newEventType.color : 'rgba(255, 255, 255, 0.1)'}`,
                              borderRadius: borderRadius.base,
                              backgroundColor: isSelected ? `${newEventType.color}15` : 'rgba(255, 255, 255, 0.03)',
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
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                              }
                            }}
                          >
                            <Icon size={24} color={isSelected ? newEventType.color : '#94a3b8'} />
                            <span style={{
                              fontSize: typography.fontSize.xs,
                              color: isSelected ? newEventType.color : '#94a3b8',
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
                    value={newEventType.color}
                    onChange={(e) => setNewEventType({ ...newEventType, color: e.target.value })}
                    style={{ ...darkInputStyle, height: "45px" }}
                  />
                </FormField>
              </div>

              <div style={{ marginTop: spacing[4], display: "flex", gap: spacing[3] }}>
                <ActionButton
                  onClick={handleAddEventType}
                  variant="success"
                  icon={<Save size={18} />}
                >
                  Spara händelsetyp
                </ActionButton>
              </div>
            </div>
          )}

          {/* Event Types Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: spacing[4]
          }}>
            {eventTypes.map((eventType, index) => {
              const isEditing = editingId === eventType.id;

              return (
                <div
                  key={eventType.id}
                  style={{
                    padding: spacing[6],
                    border: `2px solid ${isEditing ? eventType.color : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: borderRadius.lg,
                    backgroundColor: isEditing ? `${eventType.color}10` : 'rgba(255, 255, 255, 0.03)',
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
                          value={eventType.name}
                          onChange={(e) => handleUpdateEventType(eventType.id, 'name', e.target.value)}
                          style={darkInputStyle}
                        />
                      </FormField>

                      <FormField label="Ikon">
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))",
                          gap: spacing[2],
                          padding: spacing[3],
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: borderRadius.base,
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          {Object.keys(AVAILABLE_ICONS).map(iconName => {
                            const isSelected = eventType.icon === iconName;
                            const Icon = AVAILABLE_ICONS[iconName];
                            return (
                              <button
                                key={iconName}
                                type="button"
                                onClick={() => handleUpdateEventType(eventType.id, 'icon', iconName)}
                                style={{
                                  padding: spacing[3],
                                  border: `2px solid ${isSelected ? eventType.color : 'rgba(255, 255, 255, 0.1)'}`,
                                  borderRadius: borderRadius.base,
                                  backgroundColor: isSelected ? `${eventType.color}15` : 'rgba(255, 255, 255, 0.03)',
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
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                  }
                                }}
                              >
                                <Icon size={24} color={isSelected ? eventType.color : '#94a3b8'} />
                                <span style={{
                                  fontSize: typography.fontSize.xs,
                                  color: isSelected ? eventType.color : '#94a3b8',
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
                          value={eventType.color}
                          onChange={(e) => handleUpdateEventType(eventType.id, 'color', e.target.value)}
                          style={{ ...darkInputStyle, height: "45px" }}
                        />
                      </FormField>

                      <div style={{ display: "flex", gap: spacing[2], marginTop: spacing[4] }}>
                        <ActionButton
                          onClick={handleSaveEventType}
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
                          backgroundColor: `${eventType.color}20`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          <IconComponent iconName={eventType.icon} size={24} color={eventType.color} />
                        </div>
                        <div style={{
                          fontSize: typography.fontSize.lg,
                          fontWeight: typography.fontWeight.semibold,
                          color: '#fff'
                        }}>
                          {eventType.name}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: spacing[2] }}>
                        <ActionButton
                          onClick={() => setEditingId(eventType.id)}
                          variant="secondary"
                          icon={<Edit3 size={16} />}
                        >
                          Redigera
                        </ActionButton>
                        <ActionButton
                          onClick={() => handleDeleteEventType(eventType.id)}
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

      {/* Import Tab */}
      {activeTab === "import" && (
        <div style={{
          ...darkCardStyle,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={darkSectionHeaderStyle}>
            <FileUp size={20} color="#60a5fa" />
            <span>Importera Arbetsordrar</span>
          </div>

          <p style={{
            color: '#94a3b8',
            marginBottom: spacing[6]
          }}>
            Importera arbetsordrar från en CSV-fil. Filen ska ha kolumnerna: Nummer, Benämning, Beskrivning, Start, Slut, Kundnummer, Kund, Kontaktperson, Objekt, Arbetsordertyp, Status.
          </p>

          {/* File Upload Area */}
          <div style={{
            padding: spacing[8],
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: borderRadius.lg,
            border: '2px dashed rgba(96, 165, 250, 0.3)',
            textAlign: 'center',
            marginBottom: spacing[6],
            cursor: 'pointer',
            transition: `all ${transitions.base}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.5)';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.3)';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
          }}>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              disabled={importing}
              style={{ display: 'none' }}
              id="csv-upload"
            />
            <label htmlFor="csv-upload" style={{ cursor: 'pointer', display: 'block' }}>
              <Upload size={48} color="#60a5fa" style={{ margin: '0 auto', marginBottom: spacing[4] }} />
              <p style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                color: '#fff',
                marginBottom: spacing[2]
              }}>
                {importing ? 'Importerar...' : 'Klicka för att välja CSV-fil'}
              </p>
              <p style={{
                fontSize: typography.fontSize.sm,
                color: '#94a3b8'
              }}>
                Välj en CSV-fil med semikolon (;) som avgränsare
              </p>
            </label>
          </div>

          {/* Import Results */}
          {importResults && (
            <div style={{
              padding: spacing[6],
              backgroundColor: importResults.failed > 0
                ? 'rgba(245, 158, 11, 0.1)'
                : 'rgba(16, 185, 129, 0.1)',
              borderRadius: borderRadius.lg,
              border: `1px solid ${importResults.failed > 0 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              animation: 'slideDown 0.3s ease-out'
            }}>
              <h3 style={{
                margin: `0 0 ${spacing[4]} 0`,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: spacing[2]
              }}>
                {importResults.failed > 0 ? '⚠️' : '✅'} Import-resultat
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: spacing[4],
                marginBottom: spacing[4]
              }}>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: typography.fontSize.sm, marginBottom: spacing[1] }}>
                    Totalt rader
                  </p>
                  <p style={{ color: '#fff', fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold }}>
                    {importResults.total}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: typography.fontSize.sm, marginBottom: spacing[1] }}>
                    Lyckade
                  </p>
                  <p style={{ color: '#10b981', fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold }}>
                    {importResults.success}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: typography.fontSize.sm, marginBottom: spacing[1] }}>
                    Misslyckade
                  </p>
                  <p style={{ color: '#ef4444', fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold }}>
                    {importResults.failed}
                  </p>
                </div>
                {importResults.createdCustomers.length > 0 && (
                  <div>
                    <p style={{ color: '#94a3b8', fontSize: typography.fontSize.sm, marginBottom: spacing[1] }}>
                      Nya kunder
                    </p>
                    <p style={{ color: '#60a5fa', fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold }}>
                      {importResults.createdCustomers.length}
                    </p>
                  </div>
                )}
              </div>

              {importResults.createdCustomers.length > 0 && (
                <div style={{ marginBottom: spacing[4] }}>
                  <p style={{ color: '#94a3b8', fontSize: typography.fontSize.sm, marginBottom: spacing[2] }}>
                    Skapade kunder:
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
                    {importResults.createdCustomers.map((name, idx) => (
                      <Badge key={idx} color="#60a5fa">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {importResults.errors.length > 0 && (
                <div>
                  <p style={{
                    color: '#ef4444',
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.semibold,
                    marginBottom: spacing[2]
                  }}>
                    Fel ({importResults.errors.length}):
                  </p>
                  <div style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: borderRadius.md,
                    padding: spacing[3]
                  }}>
                    {importResults.errors.map((error, idx) => (
                      <p key={idx} style={{
                        color: '#fca5a5',
                        fontSize: typography.fontSize.sm,
                        marginBottom: spacing[1],
                        fontFamily: 'monospace'
                      }}>
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div style={{
            marginTop: spacing[6],
            padding: spacing[4],
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderRadius: borderRadius.md,
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <h4 style={{
              margin: `0 0 ${spacing[3]} 0`,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: '#60a5fa'
            }}>
              📋 Instruktioner
            </h4>
            <ul style={{
              margin: 0,
              paddingLeft: spacing[5],
              color: '#94a3b8',
              fontSize: typography.fontSize.sm,
              lineHeight: '1.6'
            }}>
              <li>CSV-filen måste använda semikolon (;) som avgränsare</li>
              <li>Om kunden finns (matchar kundnummer eller namn) används den befintliga kunden</li>
              <li>Om kunden inte finns skapas en ny kund automatiskt</li>
              <li>Arbetsordertyp mappas automatiskt (VVS, El, Bygg, IT, Rivning, Anläggning, Garanti)</li>
              <li>Status mappas automatiskt (Avslutad → Full fakturerad, Pågående, Planerad)</li>
              <li>Start- och slutdatum ska vara i format: ÅÅÅÅ-MM-DD HH:MM</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
