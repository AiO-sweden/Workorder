import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Calendar, Briefcase, X, Wrench, Users, Coffee, BookOpen, MapPin,
  Hammer, Zap, Shield, Cpu, Home, Building, MoreHorizontal, Settings, DollarSign, Clock,
  Paintbrush, Scissors, Truck, Car, Package, TreePine, Leaf, Droplet,
  Phone, MessageSquare, Bell, FileCheck, ClipboardCheck, Star, CheckSquare, Target,
  Flame, Lightbulb, Archive, Box, Waves, Plug, Radio, Warehouse, Factory, Construction,
  HardHat, Building2, FileText, Mail, Cog, Pipette, Wind, Sparkles, Sun, Moon, Cloud,
  CloudRain, Battery, BatteryCharging, Wifi, Bluetooth
} from 'lucide-react';
import { spacing, borderRadius, typography, transitions } from '../components/shared/theme';

// Import custom dark theme styling
import './Schema.css';

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
  Calendar, Clock, Settings, DollarSign, Star, CheckSquare, Target, Lightbulb, MoreHorizontal, X
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

const DEFAULT_EVENT_TYPES = [
  { id: "work_order", name: "Arbetsorder", icon: "Wrench", color: "#3b82f6" },
  { id: "meeting", name: "Möte", icon: "Users", color: "#8b5cf6" },
  { id: "break", name: "Rast/Paus", icon: "Clock", color: "#6b7280" },
  { id: "training", name: "Utbildning", icon: "Shield", color: "#f59e0b" },
  { id: "other", name: "Övrigt", icon: "MoreHorizontal", color: "#ec4899" }
];

export default function Schema() {
  const { userDetails } = useAuth();
  const [events, setEvents] = useState([]);
  const [workTypes, setWorkTypes] = useState(DEFAULT_WORK_TYPES);
  const [eventTypes, setEventTypes] = useState(DEFAULT_EVENT_TYPES);

  // Helper function to convert datetime-local string to ISO string without timezone shift
  const toISOStringLocal = (dateTimeLocalString) => {
    if (!dateTimeLocalString) return null;
    // If it's already in ISO format, return as is
    if (dateTimeLocalString.includes('T') && dateTimeLocalString.length === 16) {
      // Format: "YYYY-MM-DDTHH:mm" - add seconds
      return dateTimeLocalString + ':00';
    }
    // If it's a full ISO string, extract just the datetime part
    if (dateTimeLocalString.includes('T')) {
      return dateTimeLocalString.substring(0, 19); // "YYYY-MM-DDTHH:mm:ss"
    }
    return dateTimeLocalString;
  };

  // Helper function to convert ISO string to datetime-local format without timezone shift
  const toDateTimeLocal = (isoString) => {
    if (!isoString) return '';
    // If it's already in datetime-local format (YYYY-MM-DDTHH:mm), return as is
    if (isoString.length === 16 && isoString.includes('T')) {
      return isoString;
    }
    // Extract just the datetime part (first 16 characters: YYYY-MM-DDTHH:mm)
    return isoString.substring(0, 16);
  };
  const [schedulableUsers, setSchedulableUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEventData, setCurrentEventData] = useState(null);
  const [unassignedOrders, setUnassignedOrders] = useState([]);
  const externalEventsRef = React.useRef(null);

  useEffect(() => {
    // Fetch work types and event types from settings
    const fetchTypes = async () => {
      if (!userDetails?.organizationId) {
        console.log('⚠️ Schema: No organizationId, using default types');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('settings')
          .select('work_types, event_types')
          .eq('organization_id', userDetails.organizationId)
          .single();

        if (error) throw error;

        if (data) {
          if (data.work_types) {
            setWorkTypes(data.work_types);
            console.log('✅ Schema: Fetched', data.work_types.length, 'work types');
          }
          if (data.event_types) {
            setEventTypes(data.event_types);
            console.log('✅ Schema: Fetched', data.event_types.length, 'event types');
          }
        }
      } catch (error) {
        console.error("❌ Schema: Error fetching types:", error);
        // Keep using defaults on error
      }
    };

    // Fetch schedulable users
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('schedulable_users')
          .select('*')
          .eq('organization_id', userDetails?.organizationId);

        if (error) throw error;

        const usersList = data.map(user => ({
          id: user.id,
          uid: user.uid,
          email: user.email,
          name: user.name,
          role: user.role
        }));
        setSchedulableUsers(usersList);
      } catch (error) {
        console.error("Error fetching schedulable users:", error);
      }
    };

    // Fetch existing scheduled events
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('scheduled_jobs')
          .select('*');

        if (error) throw error;

        const userColorMap = new Map();
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']; // Tailwind-ish colors
        let colorIndex = 0;

        const eventsList = data.map(job => {
          let userColor = userColorMap.get(job.user_id);
          if (!userColor) {
            userColor = colors[colorIndex % colors.length];
            userColorMap.set(job.user_id, userColor);
            colorIndex++;
          }

          // Default color (will be updated by useEffect based on event type)
          const eventType = job.event_type || 'work_order';
          let eventColor = userColor;

          return {
            id: job.id,
            title: job.title || 'Okänt jobb',
            start: new Date(job.start),
            end: new Date(job.end),
            allDay: job.all_day || false,
            backgroundColor: eventColor,
            borderColor: eventColor,
            extendedProps: {
              orderId: job.order_id,
              userId: job.user_id,
              description: job.description,
              eventType: eventType,
              userColor: userColor,
              resourceId: job.user_id ? [job.user_id] : [] // Ensure resourceId is an array
            }
          };
        });
        setEvents(eventsList);
      } catch (error) {
        console.error("Error fetching scheduled events:", error);
      }
    };

    if (userDetails?.organizationId) {
      fetchTypes();
      fetchUsers();
      fetchEvents();
    }
  }, [userDetails]);

  // Separate useEffect for fetching orders and customers,
  // as they might not be needed immediately or could be fetched on demand.
  // For now, fetch them on component mount as well.
  useEffect(() => {
    const fetchOrdersAndCustomers = async () => {
      try {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .neq('status', 'Full fakturerad');

        if (ordersError) throw ordersError;

        const ordersList = ordersData.map(order => ({
          id: order.id,
          orderNumber: order.order_number,
          customerId: order.customer_id,
          title: order.title,
          description: order.description,
          address: order.address,
          workType: order.work_type,
          status: order.status,
          priority: order.priority,
          billingType: order.billing_type,
          deadline: order.deadline,
          estimatedTime: order.estimated_time,
          assignedTo: order.assigned_to,
          billable: order.billable,
          fixedPrice: order.fixed_price,
          customerDetails: order.customer_details
        }));
        setOrders(ordersList);

        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('*');

        if (customersError) throw customersError;

        const customersList = customersData.map(customer => ({
          id: customer.id,
          name: customer.name,
          customerNumber: customer.customer_number,
          address: customer.address,
          phone: customer.phone,
          email: customer.email,
          invoiceBy: customer.invoice_by,
          paymentTerms: customer.payment_terms,
          referencePerson: customer.reference_person
        }));
        setCustomers(customersList);

      } catch (error) {
        console.error("Error fetching orders or customers:", error);
      }
    };
    fetchOrdersAndCustomers();
  }, []);


  // Effect to update event colors based on work types
  useEffect(() => {
    if (orders.length > 0 && workTypes.length > 0 && events.length > 0) {
      const updatedEvents = events.map(event => {
        if (event.extendedProps.eventType === 'work_order' && event.extendedProps.orderId) {
          const order = orders.find(o => o.id === event.extendedProps.orderId);
          if (order && order.workType) {
            const workType = workTypes.find(wt => wt.name === order.workType);
            if (workType && workType.color) {
              return {
                ...event,
                backgroundColor: workType.color,
                borderColor: workType.color
              };
            }
          }
        }
        return event;
      });

      // Only update if colors actually changed
      const colorsChanged = updatedEvents.some((evt, idx) =>
        evt.backgroundColor !== events[idx].backgroundColor
      );

      if (colorsChanged) {
        setEvents(updatedEvents);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, workTypes]); // Note: Don't include events in deps to avoid infinite loop

  // Effect to update event colors based on event types
  useEffect(() => {
    if (eventTypes.length > 0 && events.length > 0) {
      const updatedEvents = events.map(event => {
        const eventType = event.extendedProps.eventType;
        const eventTypeConfig = eventTypes.find(et => et.id === eventType);

        if (eventTypeConfig && eventTypeConfig.color) {
          return {
            ...event,
            backgroundColor: eventTypeConfig.color,
            borderColor: eventTypeConfig.color
          };
        }
        return event;
      });

      // Only update if colors actually changed
      const colorsChanged = updatedEvents.some((evt, idx) =>
        evt.backgroundColor !== events[idx].backgroundColor
      );

      if (colorsChanged) {
        setEvents(updatedEvents);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventTypes]); // Note: Don't include events in deps to avoid infinite loop

  // Effect to filter unassigned orders
  useEffect(() => {
    if (orders.length > 0 && events.length >= 0) { // events can be empty initially
      const scheduledOrderIds = new Set(events.map(event => event.extendedProps?.orderId).filter(id => id));
      const filteredUnassigned = orders.filter(order => !scheduledOrderIds.has(order.id));
      setUnassignedOrders(filteredUnassigned);
    } else if (orders.length > 0 && events.length === 0) {
      // If there are orders but no events yet, all orders are unassigned
      setUnassignedOrders(orders);
    } else {
      setUnassignedOrders([]);
    }
  }, [orders, events]);

  // Effect to initialize Draggable for external events
  useEffect(() => {
    if (externalEventsRef.current && unassignedOrders.length > 0) {
      const draggable = new Draggable(externalEventsRef.current, {
        itemSelector: '.fc-event-draggable',
        eventData: function(eventEl) {
          const orderId = eventEl.getAttribute('data-order-id');
          const orderTitle = eventEl.getAttribute('data-order-title');
          const orderNumber = eventEl.getAttribute('data-order-number');
          // Find the full order object if needed for more details, e.g., description
          // const order = unassignedOrders.find(o => o.id === orderId);

          return {
            title: `AO: ${orderNumber} - ${orderTitle}`,
            duration: '02:00', // Default duration, can be adjusted
            extendedProps: {
              orderId: orderId,
              // description: order?.description || '', // Example: prefill description
            }
          };
        }
      });
      return () => draggable.destroy(); // Cleanup when component unmounts or orders change
    }
  }, [unassignedOrders]);


  const handleDateSelect = (selectInfo) => {
    console.log('Selected date range:', selectInfo);
    let calendarApi = selectInfo.view.calendar;
    calendarApi.unselect(); // clear date selection

    // Open the modal directly
    setCurrentEventData({ // Pre-fill modal for new event
        title: '',
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay,
        orderId: '',
        userId: '',
        eventType: 'work_order', // Default to work_order
        description: ''
    });
    setIsModalOpen(true);
    };
  
    const handleEventClick = (clickInfo) => {
    // Logic to view/edit/delete an existing event
    // For now, just log it
    console.log('Event clicked:', clickInfo.event);
    // Open modal for editing
    setCurrentEventData({
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: clickInfo.event.startStr,
      end: clickInfo.event.endStr,
      allDay: clickInfo.event.allDay,
      orderId: clickInfo.event.extendedProps.orderId || '',
      userId: clickInfo.event.extendedProps.userId || '',
      eventType: clickInfo.event.extendedProps.eventType || 'work_order',
      description: clickInfo.event.extendedProps.description || ''
    });
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    // If there's a temporary event (from dragging), remove it from calendar
    if (currentEventData?.tempEventRef) {
      currentEventData.tempEventRef.remove();
    }
    setIsModalOpen(false);
    setCurrentEventData(null);
  };

  const handleModalSave = async () => {
    if (!currentEventData) return;

    const { id, title, start, end, allDay, orderId, userId, eventType, description } = currentEventData;

    if (!title || !start || !userId) { // Basic validation
        alert("Titel, starttid och användare måste anges.");
        return;
    }

    const eventToSave = {
        title,
        start: toISOStringLocal(start),
        end: end ? toISOStringLocal(end) : toISOStringLocal(start),
        all_day: allDay || false,
        order_id: orderId || null,
        user_id: userId,
        event_type: eventType || 'work_order',
        description: description || '',
        organization_id: userDetails?.organizationId
    };

    try {
        if (id) { // Editing existing event
            const { error } = await supabase
                .from('scheduled_jobs')
                .update(eventToSave)
                .eq('id', id);

            if (error) throw error;

            // Update event in local state with proper structure
            setEvents(prevEvents => prevEvents.map(ev =>
                ev.id === id ? {
                  ...ev,
                  title: title,
                  start: new Date(start),
                  end: new Date(end),
                  allDay: allDay || false,
                  extendedProps: {
                    ...ev.extendedProps,
                    orderId: orderId || null,
                    userId: userId,
                    eventType: eventType || 'work_order',
                    description: description || ''
                  }
                } : ev
            ));
            console.log("Event updated:", id);
        } else { // Creating new event
            const { data, error } = await supabase
                .from('scheduled_jobs')
                .insert([eventToSave])
                .select()
                .single();

            if (error) throw error;

            // Add new event to local state with the new ID and proper structure
            const newEvent = {
                id: data.id,
                title: title,
                start: new Date(start),
                end: new Date(end),
                allDay: allDay || false,
                backgroundColor: '#3b82f6',
                borderColor: '#3b82f6',
                extendedProps: {
                  orderId: orderId || null,
                  userId: userId,
                  eventType: eventType || 'work_order',
                  description: description || ''
                }
            };
            // If there's a temporary event from dragging, remove it before adding the saved one
            if (currentEventData.tempEventRef) {
              currentEventData.tempEventRef.remove();
            }

            setEvents(prevEvents => [...prevEvents, newEvent]);
            console.log("Event created:", data.id);
            // If a new event was created from a dragged order, remove it from unassigned list
            if (currentEventData.draggedOrderId) {
              setUnassignedOrders(prev => prev.filter(o => o.id !== currentEventData.draggedOrderId));
            }
        }
        handleModalClose();
    } catch (error) {
        console.error("Error saving event to Supabase:", error);
        alert("Kunde inte spara händelsen.");
    }
  };

  const handleEventReceive = (info) => {
    // info.event contains the event object from Draggable
    // info.draggedEl is the DOM element
    const { orderId } = info.event.extendedProps;
    const resourceId = info.event.getResources()?.[0]?.id || ''; // Get the first resource ID

    setCurrentEventData({
      title: info.event.title,
      start: info.event.startStr,
      // end: info.event.endStr, // FullCalendar might calculate this based on duration
      allDay: info.event.allDay,
      orderId: orderId,
      userId: resourceId,
      eventType: 'work_order', // Dragged orders are always work_order type
      draggedOrderId: orderId, // Keep track of the dragged order to remove it from the list later
      tempEventRef: info.event // Store the temporary event reference
    });
    setIsModalOpen(true);

    // Temporarily remove the event from the calendar, it will be re-added properly on modal save
    // Or, let FullCalendar handle its temporary addition and rely on state update to show the final one.
    // For now, we'll let the modal save handle the final event creation.
    // info.event.remove(); // Optional: remove the temporary event FullCalendar adds
  };
  
  const handleDeleteEvent = async () => { // No longer needs eventId directly from button if currentEventData is used
    if (!currentEventData) return;

    const { id, tempEventRef } = currentEventData;

    if (id) { // Existing, saved event
      if (window.confirm("Är du säker på att du vill ta bort denna schemapost?")) {
        try {
          const { error } = await supabase
            .from('scheduled_jobs')
            .delete()
            .eq('id', id);

          if (error) throw error;

          setEvents(prevEvents => prevEvents.filter(ev => ev.id !== id));
          console.log("Event deleted from DB:", id);
          // If the deleted event was linked to an order, that order might become "unassigned" again.
          // The useEffect for unassignedOrders should handle re-filtering.
          // To be absolutely sure, we can re-fetch orders or manually add it back to unassignedOrders if needed.
          // For now, relying on the existing useEffect.
          handleModalClose();
        } catch (error) {
          console.error("Error deleting event from DB:", error);
          alert("Kunde inte ta bort händelsen från databasen.");
        }
      }
    } else if (tempEventRef) { // Temporary, dragged event (not saved yet)
      // No confirmation needed, just remove from UI and close modal
      try {
        tempEventRef.remove(); // Remove from FullCalendar UI
        console.log("Temporary event removed from UI.");
        handleModalClose();
      } catch (error) {
        console.error("Error removing temporary event from UI:", error);
        // Still close modal
        handleModalClose();
      }
    } else {
      console.warn("handleDeleteEvent called without id or tempEventRef");
      handleModalClose(); // Close modal anyway
    }
  };

  // Modern glassmorphism style definitions
  const modalLabelStyle = {
    display: 'block',
    marginBottom: spacing['2'],
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: typography.fontWeight.medium,
    fontSize: typography.fontSize.sm
  };

  const modalInputStyle = {
    width: '100%',
    padding: `${spacing['3']} ${spacing['4']}`,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.lg,
    fontSize: typography.fontSize.base,
    boxSizing: 'border-box',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    transition: transitions.all
  };

  const modalButtonBaseStyle = {
    padding: `${spacing['3']} ${spacing['6']}`,
    border: 'none',
    borderRadius: borderRadius.lg,
    fontWeight: typography.fontWeight.medium,
    cursor: 'pointer',
    transition: transitions.all,
    fontSize: typography.fontSize.base
  };

  const modalButtonPrimaryStyle = {
    ...modalButtonBaseStyle,
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: 'white',
  };

  const modalButtonSecondaryStyle = {
    ...modalButtonBaseStyle,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  };

  const modalButtonDangerStyle = {
    ...modalButtonBaseStyle,
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
  };

  // The redundant useEffect for fetching only orders has been removed by the previous diff.
  // The combined fetch for orders and customers is in the useEffect at line 67.

  const renderEventContent = (eventInfo) => {
    const { orderId, eventType, description } = eventInfo.event.extendedProps;
    const order = orders.find(o => o.id === orderId);

    // Get icon based on work type or event type
    const getEventIcon = () => {
      const iconProps = { size: 14, strokeWidth: 2 };

      // If it's a work order with an order, use the work type icon
      if (eventType === 'work_order' && order && order.workType) {
        const workType = workTypes.find(wt => wt.name === order.workType);
        if (workType && workType.icon) {
          const IconComponent = AVAILABLE_ICONS[workType.icon] || Wrench;
          return <IconComponent {...iconProps} color={workType.color} />;
        }
      }

      // Otherwise use event type icon from settings
      const eventTypeConfig = eventTypes.find(et => et.id === eventType);
      if (eventTypeConfig && eventTypeConfig.icon) {
        const IconComponent = AVAILABLE_ICONS[eventTypeConfig.icon] || Wrench;
        return <IconComponent {...iconProps} color={eventTypeConfig.color} />;
      }

      // Fallback
      return <Wrench {...iconProps} />;
    };

    const icon = getEventIcon();

    return (
      <div style={{
        padding: '0.25rem 0.5rem',
        lineHeight: '1.4',
        fontSize: '0.8125rem',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.125rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          fontWeight: '600',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {eventInfo.event.title}
          </span>
          {description && (
            <span style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto', opacity: 0.7 }}>
              <FileText size={12} />
            </span>
          )}
        </div>
        {eventInfo.timeText && (
          <div style={{
            fontSize: '0.75rem',
            opacity: 0.9,
            fontWeight: '500'
          }}>
            {eventInfo.timeText}
          </div>
        )}
        {order && (
          <div style={{
            fontSize: '0.7rem',
            opacity: 0.8,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            #{order.orderNumber}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      padding: spacing['8']
    }}>
      {/* Header */}
      <div style={{
        marginBottom: spacing['8'],
        textAlign: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing['3'],
          marginBottom: spacing['2']
        }}>
          <Calendar size={40} color="#3b82f6" />
          <h1 style={{
            fontSize: typography.fontSize['4xl'],
            fontWeight: typography.fontWeight.bold,
            color: '#fff',
            margin: 0
          }}>Schema & Planering</h1>
        </div>
        <p style={{
          fontSize: typography.fontSize.lg,
          color: 'rgba(255, 255, 255, 0.7)',
          margin: 0
        }}>Hantera arbetsordrar, möten och andra händelser i kalendern</p>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', gap: spacing['6'] }}>
        {/* Unassigned Orders Sidebar */}
        <div ref={externalEventsRef} style={{
          width: '220px',
          flexShrink: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          borderRadius: borderRadius.xl,
          padding: spacing['6'],
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
          height: 'fit-content',
          maxHeight: 'calc(100vh - 400px)',
          overflowY: 'auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing['2'],
            marginBottom: spacing['4'],
            paddingBottom: spacing['4'],
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Briefcase size={20} color="#3b82f6" />
            <h3 style={{
              margin: 0,
              color: '#fff',
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold
            }}>Ej Tilldelade Jobb</h3>
          </div>
          {unassignedOrders.length === 0 && (
            <p style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: typography.fontSize.sm,
              textAlign: 'center',
              padding: spacing['4']
            }}>Inga ej tilldelade jobb.</p>
          )}
          {unassignedOrders.map(order => {
            // Find work type for this order
            const workType = workTypes.find(wt => wt.name === order.workType);
            const workTypeColor = workType?.color || '#3b82f6';
            const WorkTypeIcon = workType?.icon ? AVAILABLE_ICONS[workType.icon] : Briefcase;

            return (
              <div
                key={order.id}
                className="fc-event-draggable"
                data-order-id={order.id}
                data-order-title={order.title || 'Okänd Titel'}
                data-order-number={order.orderNumber || 'N/A'}
                style={{
                  padding: spacing['4'],
                  marginBottom: spacing['3'],
                  backgroundColor: `${workTypeColor}15`,
                  color: '#fff',
                  border: `1px solid ${workTypeColor}40`,
                  borderRadius: borderRadius.lg,
                  cursor: 'grab',
                  fontSize: typography.fontSize.sm,
                  transition: transitions.all,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = `${workTypeColor}25`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 12px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = `${workTypeColor}15`;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing['2'],
                  fontWeight: typography.fontWeight.semibold,
                  marginBottom: spacing['2'],
                  color: workTypeColor
                }}>
                  <WorkTypeIcon size={16} color={workTypeColor} />
                  <span>AO: {order.orderNumber || 'Saknas Nr'}</span>
                  {workType && (
                    <span style={{
                      fontSize: typography.fontSize.xs,
                      backgroundColor: `${workTypeColor}30`,
                      padding: `${spacing['1']} ${spacing['2']}`,
                      borderRadius: borderRadius.base,
                      marginLeft: 'auto'
                    }}>
                      {workType.name}
                    </span>
                  )}
                </div>
                <div style={{ marginBottom: spacing['1'] }}>{order.title || 'Okänd Titel'}</div>
                <div style={{
                  fontSize: typography.fontSize.xs,
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginTop: spacing['2']
                }}>
                  Kund: {order.customerDetails?.name || customers.find(c => c.id === order.customerId)?.name || 'Okänd kund'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Calendar Area */}
        <div style={{
          flex: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          borderRadius: borderRadius.xl,
          padding: spacing['6'],
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)'
        }}>

        <FullCalendar
          schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin, resourceTimelinePlugin]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridWeek,dayGridMonth,listWeek'
        }}
        initialView="timeGridWeek"
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        events={events}
        droppable={true} // Allow external events to be dropped
        eventReceive={handleEventReceive} // Handle drop of external event
        // Ensure events have a `resourceId` property matching a resource's `id`
        // This was handled in fetchEvents by setting extendedProps.resourceId = data.userId
        // And FullCalendar v5+ often automatically looks for `resourceId` in extendedProps if not directly on event.
        // If not, you might need to explicitly map it or use `eventResourceField: 'resourceId'` if your event objects have it directly.
        select={handleDateSelect}
        eventClick={handleEventClick}
        eventContent={renderEventContent}
        locale="sv"
        buttonText={{
            today:    'idag',
            month:    'månad',
            list:     'lista',
            week:     'Vecka'
        }}
        height="auto"
        // Prevent overlapping with all-day events
        selectOverlap={(event) => {
          // If the existing event is an all-day event, don't allow selection to overlap
          return !event.allDay;
        }}
        eventOverlap={(stillEvent, movingEvent) => {
          // If either event is an all-day event, don't allow overlap
          return !stillEvent.allDay && !movingEvent.allDay;
        }}
      />
        </div>

        {/* Modal */}
        {isModalOpen && currentEventData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: spacing['4']
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            padding: spacing['8'],
            borderRadius: borderRadius['2xl'],
            width: '100%',
            maxWidth: '600px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing['6']
            }}>
              <h3 style={{
                margin: 0,
                color: '#fff',
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.bold
              }}>
                {currentEventData.id ? "Redigera schemapost" : "Skapa ny schemapost"}
              </h3>
              <button
                onClick={handleModalClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  padding: spacing['2'],
                  borderRadius: borderRadius.md,
                  transition: transitions.all,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                }}
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Form elements */}
            <div style={{marginBottom: spacing['4']}}>
              <label htmlFor="eventType" style={modalLabelStyle}>Händelsetyp:</label>
              <select
                id="eventType"
                value={currentEventData.eventType || 'work_order'}
                onChange={e => setCurrentEventData({...currentEventData, eventType: e.target.value})}
                style={modalInputStyle}
              >
                {eventTypes.map(eventType => (
                  <option key={eventType.id} value={eventType.id} style={{background: '#1a1a2e', color: '#fff'}}>
                    {eventType.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{marginBottom: spacing['4']}}>
              <label htmlFor="eventTitle" style={modalLabelStyle}>Titel:</label>
              <input
                type="text"
                id="eventTitle"
                value={currentEventData.title}
                onChange={e => setCurrentEventData({...currentEventData, title: e.target.value})}
                style={modalInputStyle}
              />
            </div>

            <div style={{marginBottom: spacing['4'], opacity: currentEventData.eventType === 'work_order' ? 1 : 0.5}}>
              <label htmlFor="eventOrder" style={modalLabelStyle}>
                Arbetsorder {currentEventData.eventType !== 'work_order' ? '(endast för arbetsorder)' : ''}:
              </label>
              <select
                id="eventOrder"
                value={currentEventData.orderId}
                onChange={e => {
                  const selectedOrderId = e.target.value;
                  const selectedOrder = orders.find(order => order.id === selectedOrderId);
                  setCurrentEventData({
                    ...currentEventData,
                    orderId: selectedOrderId,
                    title: selectedOrder ? selectedOrder.title : currentEventData.title
                  });
                }}
                style={modalInputStyle}
                disabled={currentEventData.eventType !== 'work_order'}
              >
                <option value="" style={{background: '#1a1a2e', color: '#fff'}}>Ingen specifik order</option>
                {orders.map(order => (
                  <option key={order.id} value={order.id} style={{background: '#1a1a2e', color: '#fff'}}>
                    #{order.orderNumber} - {order.title} ({order.customerDetails?.name || customers.find(c => c.id === order.customerId)?.name || 'Okänd kund'})
                  </option>
                ))}
              </select>
            </div>

            <div style={{marginBottom: spacing['4']}}>
              <label htmlFor="eventUser" style={modalLabelStyle}>Tilldela användare:</label>
              <select
                id="eventUser"
                value={currentEventData.userId}
                onChange={e => setCurrentEventData({...currentEventData, userId: e.target.value})}
                required
                style={modalInputStyle}
              >
                <option value="" style={{background: '#1a1a2e', color: '#fff'}}>Välj användare</option>
                {schedulableUsers.map(user => (
                  <option key={user.id} value={user.id} style={{background: '#1a1a2e', color: '#fff'}}>
                    {user.name} (ID: {user.uid ? user.uid.substring(0,6) : user.id.substring(0,6)})
                  </option>
                ))}
              </select>
            </div>

            <div style={{display: 'flex', gap: spacing['4'], marginBottom: spacing['4']}}>
              <div style={{flex: 1}}>
                <label htmlFor="eventStart" style={modalLabelStyle}>Starttid:</label>
                <input
                  id="eventStart"
                  type="datetime-local"
                  value={toDateTimeLocal(currentEventData.start)}
                  onChange={e => setCurrentEventData({...currentEventData, start: e.target.value})}
                  style={modalInputStyle}
                />
              </div>
              <div style={{flex: 1}}>
                <label htmlFor="eventEnd" style={modalLabelStyle}>Sluttid:</label>
                <input
                  id="eventEnd"
                  type="datetime-local"
                  value={toDateTimeLocal(currentEventData.end)}
                  onChange={e => setCurrentEventData({...currentEventData, end: e.target.value})}
                  style={modalInputStyle}
                />
              </div>
            </div>

            <div style={{marginBottom: spacing['4']}}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                <input
                  type="checkbox"
                  checked={currentEventData.allDay || false}
                  onChange={e => setCurrentEventData({ ...currentEventData, allDay: e.target.checked })}
                  style={{
                    marginRight: spacing['3'],
                    height: '1.125rem',
                    width: '1.125rem',
                    cursor: 'pointer'
                  }}
                />
                Heldagshändelse
              </label>
            </div>

            {/* Noteringar/Beskrivning */}
            <div style={{marginBottom: spacing['4']}}>
              <label htmlFor="eventDescription" style={modalLabelStyle}>Noteringar:</label>
              <textarea
                id="eventDescription"
                value={currentEventData.description || ''}
                onChange={e => setCurrentEventData({...currentEventData, description: e.target.value})}
                placeholder="Lägg till noteringar för denna händelse..."
                rows={4}
                style={{
                  ...modalInputStyle,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  lineHeight: '1.5'
                }}
              />
            </div>

            {/* Divider before buttons */}
            <div style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              margin: `${spacing['6']} 0`
            }}></div>

            {/* Buttons */}
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                {(currentEventData.id || currentEventData.tempEventRef) && (
                  <button
                    onClick={handleDeleteEvent}
                    style={modalButtonDangerStyle}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(239, 68, 68, 0.4)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    Ta bort
                  </button>
                )}
              </div>
              <div style={{display: 'flex', gap: spacing['3']}}>
                <button
                  onClick={handleModalClose}
                  style={modalButtonSecondaryStyle}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Avbryt
                </button>
                <button
                  onClick={handleModalSave}
                  style={modalButtonPrimaryStyle}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {currentEventData.id ? "Spara ändringar" : "Skapa händelse"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}