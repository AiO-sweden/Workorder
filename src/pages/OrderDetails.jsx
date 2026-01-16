import { useEffect, useState, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import { useResponsive } from "../hooks/useResponsive";
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
  AlertCircle,
  ShoppingCart,
  Check,
  Upload,
  Camera,
  Download,
  File
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
  const { isMobile, isTablet } = useResponsive();
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

  // Tab state
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'time', 'shopping', 'documents'

  // Purchase list state
  const [purchaseLists, setPurchaseLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [listItems, setListItems] = useState([]);
  const [newItemText, setNewItemText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [commentText, setCommentText] = useState('');

  // Documents state
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Notes state
  const [notes, setNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

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
            notes: data.notes || '',
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
            createdAt: data.created_at,
            updatedAt: data.updated_at
          });
          setNotes(data.notes || '');
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

  // Fetch purchase lists for this order
  const fetchPurchaseLists = useCallback(async () => {
    const { data, error } = await supabase
      .from('purchase_lists')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchase lists:', error);
    } else {
      setPurchaseLists(data || []);
      // Select first active list, or first completed list if no active ones
      if (data && data.length > 0 && !selectedList) {
        const activeList = data.find(l => l.status === 'active') || data[0];
        setSelectedList(activeList);
      }
    }
  }, [id, selectedList]);

  useEffect(() => {
    if (!id) return;
    fetchPurchaseLists();
    fetchDocuments();
  }, [id, fetchPurchaseLists]);

  // Fetch items when a list is selected
  useEffect(() => {
    if (selectedList) {
      fetchListItems(selectedList.id);
    }
  }, [selectedList]);

  // Fetch documents for this order
  const fetchDocuments = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('order_documents')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
    } else {
      setDocuments(data || []);
    }
  };

  const fetchListItems = async (listId) => {
    const { data, error } = await supabase
      .from('purchase_list_items')
      .select('*')
      .eq('purchase_list_id', listId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching list items:', error);
    } else {
      setListItems(data || []);
    }
  };

  const createNewItem = async (e) => {
    e.preventDefault();
    if (!newItemText.trim() || !selectedList) return;

    const { data, error } = await supabase
      .from('purchase_list_items')
      .insert({
        purchase_list_id: selectedList.id,
        item_name: newItemText,
        checked: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating item:', error);
    } else {
      setListItems([...listItems, data]);
      setNewItemText('');
    }
  };

  const toggleItemChecked = async (item) => {
    const { error } = await supabase
      .from('purchase_list_items')
      .update({ checked: !item.checked })
      .eq('id', item.id);

    if (error) {
      console.error('Error updating item:', error);
    } else {
      setListItems(listItems.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i));
    }
  };

  const deleteItem = async (itemId) => {
    const { error } = await supabase
      .from('purchase_list_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting item:', error);
    } else {
      setListItems(listItems.filter(i => i.id !== itemId));
    }
  };

  const updateItemComment = async (itemId, comment) => {
    const { error } = await supabase
      .from('purchase_list_items')
      .update({ comment: comment })
      .eq('id', itemId);

    if (error) {
      console.error('Error updating comment:', error);
    } else {
      setListItems(listItems.map(i => i.id === itemId ? { ...i, comment: comment } : i));
    }
  };

  const handleCommentClick = (item) => {
    setEditingCommentId(item.id);
    setCommentText(item.comment || '');
  };

  const handleCommentBlur = (itemId) => {
    if (commentText.trim() !== '') {
      updateItemComment(itemId, commentText.trim());
    } else if (commentText === '') {
      updateItemComment(itemId, null);
    }
    setEditingCommentId(null);
    setCommentText('');
  };

  const handleCommentKeyDown = (e, itemId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommentBlur(itemId);
    } else if (e.key === 'Escape') {
      setEditingCommentId(null);
      setCommentText('');
    }
  };

  const createNewList = async (title) => {
    if (!title.trim()) return;

    const { data, error } = await supabase
      .from('purchase_lists')
      .insert({
        title: title,
        order_id: id,
        organization_id: userDetails.organizationId,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating list:', error);
    } else {
      setPurchaseLists([data, ...purchaseLists]);
      setSelectedList(data);
    }
  };

  const markListAsCompleted = async (listId) => {
    const { error } = await supabase
      .from('purchase_lists')
      .update({ status: 'completed' })
      .eq('id', listId);

    if (error) {
      console.error('Error marking list as completed:', error);
    } else {
      setPurchaseLists(purchaseLists.map(l => l.id === listId ? { ...l, status: 'completed' } : l));
      if (selectedList?.id === listId) {
        setSelectedList({ ...selectedList, status: 'completed' });
      }
      setToast({ message: "Checklista markerad som klar!", type: "success" });
    }
  };

  const deleteList = async (listId) => {
    if (!window.confirm('Är du säker på att du vill ta bort hela checklistan? Detta går inte att ångra.')) return;

    const { error } = await supabase
      .from('purchase_lists')
      .delete()
      .eq('id', listId);

    if (error) {
      console.error('Error deleting list:', error);
      setToast({ message: "Kunde inte ta bort listan.", type: "error" });
    } else {
      const remainingLists = purchaseLists.filter(l => l.id !== listId);
      setPurchaseLists(remainingLists);
      if (selectedList?.id === listId) {
        // Select first list after deletion, or null if none exist
        setSelectedList(remainingLists[0] || null);
        setListItems([]);
      }
      setToast({ message: "Checklista raderad.", type: "success" });
    }
  };

  // Document handlers
  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (const file of files) {
      try {
        // Upload file to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${id}/${Date.now()}.${fileExt}`;
        const filePath = `order-documents/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('order-documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('order-documents')
          .getPublicUrl(filePath);

        // Determine file type
        const fileType = file.type.startsWith('image/') ? 'image' : 'document';

        // Save metadata to database
        const { error: dbError } = await supabase
          .from('order_documents')
          .insert({
            order_id: id,
            organization_id: userDetails.organizationId,
            file_name: file.name,
            file_type: fileType,
            file_url: urlData.publicUrl,
            file_size: file.size,
            mime_type: file.type,
            uploaded_by: userDetails.id
          });

        if (dbError) throw dbError;

        setToast({ message: `${file.name} uppladdad!`, type: "success" });
      } catch (error) {
        console.error('Error uploading file:', error);
        setToast({ message: `Kunde inte ladda upp ${file.name}`, type: "error" });
      }
    }

    setUploading(false);
    fetchDocuments();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setShowCamera(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setToast({ message: "Kunde inte komma åt kameran", type: "error" });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      setUploading(true);
      stopCamera();

      try {
        const fileName = `${id}/${Date.now()}.jpg`;
        const filePath = `order-documents/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('order-documents')
          .upload(filePath, blob);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('order-documents')
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from('order_documents')
          .insert({
            order_id: id,
            organization_id: userDetails.organizationId,
            file_name: `Foto ${new Date().toLocaleString('sv-SE')}`,
            file_type: 'image',
            file_url: urlData.publicUrl,
            file_size: blob.size,
            mime_type: 'image/jpeg',
            uploaded_by: userDetails.id
          });

        if (dbError) throw dbError;

        setToast({ message: "Foto sparat!", type: "success" });
        fetchDocuments();
      } catch (error) {
        console.error('Error saving photo:', error);
        setToast({ message: "Kunde inte spara foto", type: "error" });
      } finally {
        setUploading(false);
      }
    }, 'image/jpeg', 0.9);
  };

  const deleteDocument = async (docId, fileUrl) => {
    if (!window.confirm('Är du säker på att du vill ta bort detta dokument?')) return;

    try {
      // Extract file path from URL
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(-3).join('/'); // Get last 3 parts: bucket/folder/file

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('order-documents')
        .remove([filePath]);

      if (storageError) console.error('Storage delete error:', storageError);

      // Delete from database
      const { error: dbError } = await supabase
        .from('order_documents')
        .delete()
        .eq('id', docId);

      if (dbError) throw dbError;

      setToast({ message: "Dokument borttaget", type: "success" });
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      setToast({ message: "Kunde inte ta bort dokument", type: "error" });
    }
  };

  const saveNotes = async () => {
    if (!id) return;

    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ notes: notes })
        .eq('id', id);

      if (error) throw error;

      setOrder(prev => ({ ...prev, notes: notes }));
      setEditingNotes(false);
      setToast({ message: "Noteringar sparade", type: "success" });
    } catch (error) {
      console.error('Error saving notes:', error);
      setToast({ message: "Kunde inte spara noteringar", type: "error" });
    } finally {
      setSavingNotes(false);
    }
  };

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

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Update local state with camelCase
      setOrder(prev => ({
        ...prev,
        status: newStatus
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
      maxWidth: isMobile ? "none" : "1200px",
      margin: "0 auto",
      fontFamily: typography.fontFamily.sans,
      padding: isMobile ? '1rem' : '2rem 0',
      boxSizing: "border-box",
      overflowX: "hidden",
      width: "100%"
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
        <div style={{
          display: "flex",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          marginBottom: spacing[4],
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? spacing[4] : 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? spacing[2] : spacing[4], width: isMobile ? "100%" : "auto" }}>
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
                fontSize: isMobile ? typography.fontSize['2xl'] : typography.fontSize['4xl'],
                fontWeight: typography.fontWeight.bold,
                color: '#fff',
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: spacing[3],
                flexWrap: isMobile ? "wrap" : "nowrap"
              }}>
                <FileText size={isMobile ? 24 : 32} color="#60a5fa" />
                <span style={{ wordBreak: "break-word" }}>Arbetsorder #{order.orderNumber}</span>
              </h1>
              <p style={{
                color: '#cbd5e1',
                fontSize: typography.fontSize.base,
                margin: `${spacing[1]} 0 0 0`,
                paddingLeft: isMobile ? 0 : "2.75rem",
                wordBreak: "break-word"
              }}>
                {order.title || "Ingen titel"}
              </p>
            </div>
          </div>

          {/* Quick Status Changer */}
          <div style={{ display: "flex", alignItems: "center", gap: spacing[3], width: isMobile ? "100%" : "auto" }}>
            <label style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: '#cbd5e1',
              whiteSpace: "nowrap"
            }}>
              Status:
            </label>
            <select
              value={order.status}
              onChange={(e) => handleQuickStatusChange(e.target.value)}
              style={{
                minWidth: isMobile ? "0" : "200px",
                width: isMobile ? "100%" : "auto",
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
              <option value="Full fakturerad" style={{ backgroundColor: '#1a1a2e' }}>Full fakturerad</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      {isMobile ? (
        // Mobile: Dropdown menu
        <div style={{ marginBottom: spacing[6] }}>
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            style={{
              width: '100%',
              padding: `${spacing[3]} ${spacing[4]}`,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: borderRadius.lg,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: '#fff',
              cursor: 'pointer',
              outline: 'none',
              boxSizing: 'border-box',
              minHeight: '44px'
            }}
          >
            <option value="details" style={{ backgroundColor: '#1a1a2e' }}>Orderdetaljer</option>
            <option value="time" style={{ backgroundColor: '#1a1a2e' }}>Tidrapportering</option>
            <option value="shopping" style={{ backgroundColor: '#1a1a2e' }}>Checklista</option>
            <option value="documents" style={{ backgroundColor: '#1a1a2e' }}>Dokument</option>
          </select>
        </div>
      ) : (
        // Desktop: Horizontal tab buttons
        <div style={{
          display: 'flex',
          gap: spacing[2],
          marginBottom: spacing[6],
          borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          <button
            onClick={() => setActiveTab('details')}
            style={{
              padding: `${spacing[3]} ${spacing[6]}`,
              background: activeTab === 'details' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'details' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'details' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
              transition: transitions.all,
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              marginBottom: '-2px',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'details') {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'details') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <FileText size={18} />
            Orderdetaljer
          </button>
          <button
            onClick={() => setActiveTab('time')}
            style={{
              padding: `${spacing[3]} ${spacing[6]}`,
              background: activeTab === 'time' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'time' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'time' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
              transition: transitions.all,
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              marginBottom: '-2px'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'time') {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'time') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <Clock size={18} />
            Tidrapportering
          </button>
          <button
            onClick={() => setActiveTab('shopping')}
            style={{
              padding: `${spacing[3]} ${spacing[6]}`,
              background: activeTab === 'shopping' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'shopping' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'shopping' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
              transition: transitions.all,
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              marginBottom: '-2px'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'shopping') {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'shopping') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <ShoppingCart size={18} />
            Checklista
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            style={{
              padding: `${spacing[3]} ${spacing[6]}`,
              background: activeTab === 'documents' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'documents' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'documents' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
              transition: transitions.all,
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              marginBottom: '-2px'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'documents') {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'documents') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <File size={18} />
            Dokument
          </button>
        </div>
      )}

      {/* Order Details Tab */}
      {activeTab === 'details' && (isEditing ? (
        // EDITING MODE FOR ORDER DETAILS
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? spacing[4] : spacing[6] }}>
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
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? spacing[4] : spacing[6] }}>
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

            {/* Noteringar Section */}
            <div style={{
              marginTop: spacing[8],
              paddingTop: spacing[6],
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: spacing[4]
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing[3]
                }}>
                  <FileText size={18} color="#10b981" />
                  <span style={{
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.semibold,
                    color: '#fff'
                  }}>Noteringar</span>
                </div>
                {!editingNotes && (
                  <button
                    onClick={() => setEditingNotes(true)}
                    style={{
                      padding: `${spacing[2]} ${spacing[3]}`,
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      border: '1px solid #3b82f6',
                      borderRadius: borderRadius.md,
                      color: '#60a5fa',
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[2],
                      transition: transitions.base
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.3)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)'}
                  >
                    <Edit3 size={14} />
                    Redigera
                  </button>
                )}
              </div>

              {editingNotes ? (
                <div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Skriv noteringar för denna arbetsorder..."
                    rows={6}
                    style={{
                      width: '100%',
                      padding: spacing[3],
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(59, 130, 246, 0.5)',
                      borderRadius: borderRadius.lg,
                      color: '#fff',
                      fontSize: typography.fontSize.base,
                      lineHeight: typography.lineHeight.relaxed,
                      resize: 'vertical',
                      outline: 'none',
                      fontFamily: 'inherit',
                      marginBottom: spacing[3]
                    }}
                  />
                  <div style={{ display: 'flex', gap: spacing[2] }}>
                    <button
                      onClick={saveNotes}
                      disabled={savingNotes}
                      style={{
                        padding: `${spacing[2]} ${spacing[4]}`,
                        backgroundColor: colors.success[500],
                        border: 'none',
                        borderRadius: borderRadius.md,
                        color: '#fff',
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.semibold,
                        cursor: savingNotes ? 'not-allowed' : 'pointer',
                        opacity: savingNotes ? 0.6 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing[2],
                        transition: transitions.base
                      }}
                      onMouseEnter={(e) => {
                        if (!savingNotes) e.currentTarget.style.backgroundColor = colors.success[600];
                      }}
                      onMouseLeave={(e) => {
                        if (!savingNotes) e.currentTarget.style.backgroundColor = colors.success[500];
                      }}
                    >
                      <Save size={14} />
                      {savingNotes ? 'Sparar...' : 'Spara'}
                    </button>
                    <button
                      onClick={() => {
                        setNotes(order.notes || '');
                        setEditingNotes(false);
                      }}
                      disabled={savingNotes}
                      style={{
                        padding: `${spacing[2]} ${spacing[4]}`,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: borderRadius.md,
                        color: '#fff',
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.semibold,
                        cursor: savingNotes ? 'not-allowed' : 'pointer',
                        opacity: savingNotes ? 0.6 : 1,
                        transition: transitions.base
                      }}
                      onMouseEnter={(e) => {
                        if (!savingNotes) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        if (!savingNotes) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      }}
                    >
                      Avbryt
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setEditingNotes(true)}
                  style={{
                    padding: spacing[4],
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: borderRadius.lg,
                    minHeight: '80px',
                    cursor: 'pointer',
                    transition: transitions.base,
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                >
                  <p style={{
                    whiteSpace: "pre-wrap",
                    color: notes ? '#cbd5e1' : 'rgba(255, 255, 255, 0.4)',
                    lineHeight: typography.lineHeight.relaxed,
                    fontSize: typography.fontSize.base,
                    margin: 0,
                    fontStyle: notes ? 'normal' : 'italic'
                  }}>
                    {notes || "Klicka för att lägga till noteringar..."}
                  </p>
                </div>
              )}
            </div>

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
      ))}

      {/* Time Reporting Tab */}
      {activeTab === 'time' && (
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
                    gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
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
                          display: isMobile ? "flex" : "grid",
                          flexDirection: isMobile ? "column" : undefined,
                          gridTemplateColumns: isMobile ? undefined : "auto 1fr auto",
                          gap: spacing[4],
                          alignItems: isMobile ? "stretch" : "center",
                          transition: `all ${transitions.base}`
                        }}
                      >
                        <div style={{
                          width: isMobile ? "100%" : "4px",
                          height: isMobile ? "4px" : "60px",
                          backgroundColor: timeCode?.color || '#3b82f6',
                          borderRadius: borderRadius.sm
                        }} />

                        <div>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: spacing[3],
                            marginBottom: spacing[2],
                            flexWrap: "wrap"
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

                          <div style={{ display: "flex", alignItems: "center", gap: spacing[4], flexWrap: "wrap" }}>
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
                              fontStyle: "italic",
                              wordBreak: "break-word"
                            }}>
                              "{report.kommentar}"
                            </p>
                          )}
                        </div>

                        <div style={{
                          display: "flex",
                          flexDirection: isMobile ? "row" : "column",
                          gap: spacing[2],
                          alignItems: isMobile ? "center" : "flex-end",
                          justifyContent: isMobile ? "space-between" : undefined,
                          flexWrap: "wrap"
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
                              {isMobile ? "" : "Redigera"}
                            </ActionButton>
                            <ActionButton
                              onClick={() => handleDeleteTimeReport(report.id)}
                              icon={<Trash2 size={12} />}
                              variant="danger"
                              size="sm"
                            >
                              {isMobile ? "" : "Radera"}
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
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : (isTablet ? "repeat(2, 1fr)" : "repeat(3, 1fr)"), gap: isMobile ? spacing[4] : spacing[6] }}>
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

      {/* Shopping List Tab */}
      {activeTab === 'shopping' && (
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
              <ShoppingCart size={20} color="#10b981" />
              <span style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: '#fff'
              }}>Checklista</span>
            </div>
            <div style={{ display: 'flex', gap: spacing[2] }}>
              <ActionButton
                onClick={() => {
                  const title = window.prompt('Namn på checklista:');
                  if (title) createNewList(title);
                }}
                icon={<Plus size={18} />}
                color={colors.success[500]}
                hoverColor={colors.success[600]}
              >
                Ny Lista
              </ActionButton>
              {selectedList && selectedList.status === 'active' && (
                <ActionButton
                  onClick={() => markListAsCompleted(selectedList.id)}
                  icon={<CheckCircle size={18} />}
                  color={colors.primary[500]}
                  hoverColor={colors.primary[600]}
                >
                  Markera som klar
                </ActionButton>
              )}
              {selectedList && (
                <ActionButton
                  onClick={() => deleteList(selectedList.id)}
                  icon={<Trash2 size={18} />}
                  color={colors.error[500]}
                  hoverColor={colors.error[600]}
                >
                  Radera lista
                </ActionButton>
              )}
            </div>
          </div>

          {purchaseLists.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: spacing[12],
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              <ShoppingCart size={64} style={{ margin: '0 auto', marginBottom: spacing[4], opacity: 0.3 }} />
              <p style={{ fontSize: typography.fontSize.lg, color: 'rgba(255, 255, 255, 0.6)' }}>
                Ingen checklista ännu. Klicka på "Ny Lista" för att komma igång.
              </p>
            </div>
          ) : (
            <div>
              {/* List selector - always show to display status */}
              <div style={{ marginBottom: spacing[6] }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[3],
                  marginBottom: spacing[3]
                }}>
                  <select
                    value={selectedList?.id || ''}
                    onChange={(e) => {
                      const list = purchaseLists.find(l => l.id === e.target.value);
                      setSelectedList(list);
                    }}
                    style={{
                      flex: 1,
                      padding: `${spacing[3]} ${spacing[4]}`,
                      borderRadius: borderRadius.lg,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      color: '#fff',
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.semibold,
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    {purchaseLists.map(list => (
                      <option key={list.id} value={list.id} style={{ backgroundColor: '#1a1a2e' }}>
                        {list.title} {list.status === 'completed' ? '✓ Klar' : ''}
                      </option>
                    ))}
                  </select>
                  {selectedList && (
                    <Badge
                      variant={selectedList.status === 'completed' ? 'success' : 'info'}
                      style={{ flexShrink: 0 }}
                    >
                      {selectedList.status === 'completed' ? 'Klar' : 'Aktiv'}
                    </Badge>
                  )}
                </div>
                {selectedList?.status === 'completed' && (
                  <div style={{
                    padding: spacing[3],
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: borderRadius.md,
                    fontSize: typography.fontSize.sm,
                    color: '#10b981'
                  }}>
                    <CheckCircle size={14} style={{ display: 'inline', marginRight: spacing[2] }} />
                    Denna checklista är markerad som klar
                  </div>
                )}
              </div>

              {/* Checklist Items */}
              <div style={{ marginBottom: spacing[6] }}>
                {listItems.map(item => (
                  <div
                    key={item.id}
                    style={{
                      padding: `${spacing[3]} 0`,
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                    onMouseEnter={(e) => {
                      const deleteBtn = e.currentTarget.querySelector('.delete-btn');
                      if (deleteBtn) deleteBtn.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      const deleteBtn = e.currentTarget.querySelector('.delete-btn');
                      if (deleteBtn) deleteBtn.style.opacity = '0';
                    }}
                  >
                    {/* Main item row */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[3]
                    }}>
                      {/* Checkbox Circle */}
                      <button
                        onClick={() => toggleItemChecked(item)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: `2px solid ${item.checked ? '#10b981' : 'rgba(255, 255, 255, 0.3)'}`,
                          background: item.checked ? '#10b981' : 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: transitions.all,
                          padding: 0
                        }}
                      >
                        {item.checked && <Check size={16} color="#fff" strokeWidth={3} />}
                      </button>

                      {/* Item Text */}
                      <div
                        style={{
                          flex: 1,
                          fontSize: typography.fontSize.base,
                          color: '#fff',
                          textDecoration: item.checked ? 'line-through' : 'none',
                          opacity: item.checked ? 0.5 : 1,
                          transition: transitions.all
                        }}
                      >
                        {item.item_name}
                      </div>

                      {/* Delete Button */}
                      <button
                        className="delete-btn"
                        onClick={() => deleteItem(item.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: spacing[1],
                          color: 'rgba(255, 255, 255, 0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          opacity: 0,
                          transition: transitions.all
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Comment section */}
                    <div style={{ marginLeft: `calc(24px + ${spacing[3]})`, marginTop: spacing[1] }}>
                      {editingCommentId === item.id ? (
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onBlur={() => handleCommentBlur(item.id)}
                          onKeyDown={(e) => handleCommentKeyDown(e, item.id)}
                          placeholder="Lägg till kommentar (t.ex. slut hos grossist, beställa...)"
                          autoFocus
                          style={{
                            width: '100%',
                            padding: spacing[1],
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(59, 130, 246, 0.5)',
                            borderRadius: borderRadius.md,
                            color: '#fff',
                            fontSize: typography.fontSize.sm,
                            outline: 'none'
                          }}
                        />
                      ) : (
                        <div
                          onClick={() => handleCommentClick(item)}
                          style={{
                            fontSize: typography.fontSize.sm,
                            color: item.comment ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.3)',
                            fontStyle: item.comment ? 'normal' : 'italic',
                            cursor: 'pointer',
                            padding: spacing[1],
                            borderRadius: borderRadius.md,
                            transition: transitions.all
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          {item.comment || 'Lägg till kommentar...'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Item Input */}
              <form onSubmit={createNewItem} style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    flexShrink: 0
                  }}
                />
                <input
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="Lägg till artikel..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#fff',
                    fontSize: typography.fontSize.base,
                    padding: `${spacing[2]} 0`
                  }}
                />
              </form>
            </div>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="card-enter" style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          borderRadius: borderRadius.xl,
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: spacing[6]
        }}>
          {/* Header */}
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
              <File size={20} color="#10b981" />
              <span style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: '#fff'
              }}>Dokument & Bilder</span>
            </div>
            <div style={{ display: 'flex', gap: spacing[2] }}>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <ActionButton
                onClick={() => fileInputRef.current?.click()}
                icon={<Upload size={18} />}
                color={colors.primary[500]}
                hoverColor={colors.primary[600]}
                disabled={uploading}
              >
                {uploading ? 'Laddar upp...' : 'Ladda upp'}
              </ActionButton>
              <ActionButton
                onClick={startCamera}
                icon={<Camera size={18} />}
                color={colors.success[500]}
                hoverColor={colors.success[600]}
              >
                Ta foto
              </ActionButton>
            </div>
          </div>

          {/* Camera View */}
          {showCamera && (
            <div style={{
              marginBottom: spacing[6],
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: borderRadius.lg,
              padding: spacing[4],
              position: 'relative'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: spacing[4]
              }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{
                    width: '100%',
                    maxWidth: isMobile ? '100%' : '600px',
                    borderRadius: borderRadius.lg,
                    backgroundColor: '#000'
                  }}
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div style={{ display: 'flex', gap: spacing[3] }}>
                  <ActionButton
                    onClick={capturePhoto}
                    icon={<Camera size={18} />}
                    color={colors.success[500]}
                    hoverColor={colors.success[600]}
                    disabled={uploading}
                  >
                    {uploading ? 'Sparar...' : 'Ta bild'}
                  </ActionButton>
                  <ActionButton
                    onClick={stopCamera}
                    icon={<X size={18} />}
                    color={colors.error[500]}
                    hoverColor={colors.error[600]}
                  >
                    Avbryt
                  </ActionButton>
                </div>
              </div>
            </div>
          )}

          {/* Documents Grid */}
          {documents.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: spacing[12],
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              <File size={64} style={{ margin: '0 auto', marginBottom: spacing[4], opacity: 0.3 }} />
              <p style={{ fontSize: typography.fontSize.lg, marginBottom: spacing[2] }}>
                Inga dokument uppladdade ännu
              </p>
              <p style={{ fontSize: typography.fontSize.sm, color: 'rgba(255, 255, 255, 0.4)' }}>
                Ladda upp filer eller ta bilder för att komma igång
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: spacing[4]
            }}>
              {documents.map(doc => (
                <div
                  key={doc.id}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: borderRadius.lg,
                    padding: spacing[4],
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    transition: transitions.base,
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* File Preview */}
                  <div style={{
                    width: '100%',
                    height: '150px',
                    borderRadius: borderRadius.md,
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    marginBottom: spacing[3],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {doc.file_type === 'image' ? (
                      <img
                        src={doc.file_url}
                        alt={doc.file_name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onClick={() => window.open(doc.file_url, '_blank')}
                      />
                    ) : (
                      <File size={48} color="rgba(255, 255, 255, 0.4)" />
                    )}
                  </div>

                  {/* File Info */}
                  <div style={{
                    marginBottom: spacing[3]
                  }}>
                    <div style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.semibold,
                      color: '#fff',
                      marginBottom: spacing[1],
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {doc.file_name}
                    </div>
                    <div style={{
                      fontSize: typography.fontSize.xs,
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}>
                      {new Date(doc.created_at).toLocaleDateString('sv-SE')}
                      {doc.file_size && ` • ${(doc.file_size / 1024).toFixed(0)} KB`}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: 'flex',
                    gap: spacing[2]
                  }}>
                    <button
                      onClick={() => window.open(doc.file_url, '_blank')}
                      style={{
                        flex: 1,
                        padding: spacing[2],
                        backgroundColor: colors.primary[500],
                        color: '#fff',
                        border: 'none',
                        borderRadius: borderRadius.md,
                        fontSize: typography.fontSize.xs,
                        fontWeight: typography.fontWeight.semibold,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: spacing[1],
                        transition: transitions.base
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primary[600]}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary[500]}
                    >
                      <Download size={14} />
                      Öppna
                    </button>
                    <button
                      onClick={() => deleteDocument(doc.id, doc.file_url)}
                      style={{
                        padding: spacing[2],
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        color: colors.error[400],
                        border: `1px solid ${colors.error[500]}`,
                        borderRadius: borderRadius.md,
                        fontSize: typography.fontSize.xs,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: transitions.base
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.error[500];
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                        e.currentTarget.style.color = colors.error[400];
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
// Force rebuild
