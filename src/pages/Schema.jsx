import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction'; // for selectable AND draggable
import listPlugin from '@fullcalendar/list';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'; // Import the new plugin
import { db } from '../firebase/config';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';

// Base styles are often handled by the plugin imports themselves in newer versions,
// or a single core CSS file might be available if needed.
// We'll remove these specific imports for now and see if styles are applied.

export default function Schema() {
  const [events, setEvents] = useState([]);
  const [schedulableUsers, setSchedulableUsers] = useState([]);
  const [orders, setOrders] = useState([]); // To select an order
  const [customers, setCustomers] = useState([]); // To display customer names
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEventData, setCurrentEventData] = useState(null); // For creating/editing event in modal
  const [selectionInfo, setSelectionInfo] = useState(null); // To store calendar selection info
  const [unassignedOrders, setUnassignedOrders] = useState([]);
  const externalEventsRef = React.useRef(null);

  useEffect(() => {
    // Fetch schedulable users
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'schedulableUsers'));
        const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSchedulableUsers(usersList);
      } catch (error) {
        console.error("Error fetching schedulable users:", error);
      }
    };

    // Fetch existing scheduled events
    const fetchEvents = async () => {
      try {
        const eventsSnapshot = await getDocs(collection(db, 'scheduledJobs')); // Assuming 'scheduledJobs' collection
        const userColorMap = new Map();
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']; // Tailwind-ish colors
        let colorIndex = 0;

        const eventsList = eventsSnapshot.docs.map(doc => {
          const data = doc.data();
          let userColor = userColorMap.get(data.userId);
          if (!userColor) {
            userColor = colors[colorIndex % colors.length];
            userColorMap.set(data.userId, userColor);
            colorIndex++;
          }

          return {
            id: doc.id,
            title: data.title || 'Okänt jobb',
            start: data.start.toDate(),
            end: data.end.toDate(),
            allDay: data.allDay || false,
            backgroundColor: userColor,
            borderColor: userColor,
            extendedProps: {
              orderId: data.orderId,
              userId: data.userId,
              description: data.description,
              userColor: userColor,
              resourceId: data.userId ? [data.userId] : [] // Ensure resourceId is an array
            }
          };
        });
        setEvents(eventsList);
      } catch (error) {
        console.error("Error fetching scheduled events:", error);
      }
    };

    fetchUsers();
    fetchEvents();
  }, []); // Initial fetch for users and events

  // Separate useEffect for fetching orders and customers,
  // as they might not be needed immediately or could be fetched on demand.
  // For now, fetch them on component mount as well.
  useEffect(() => {
    const fetchOrdersAndCustomers = async () => {
      try {
        const ordersSnapshot = await getDocs(collection(db, "orders"));
        const ordersList = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOrders(ordersList);

        const customersSnapshot = await getDocs(collection(db, "customers"));
        const customersList = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCustomers(customersList);

      } catch (error) {
        console.error("Error fetching orders or customers:", error);
      }
    };
    fetchOrdersAndCustomers();
  }, []);


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
    setSelectionInfo(selectInfo); // Save selection info to use in modal
    setCurrentEventData({ // Pre-fill modal for new event
        title: '',
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay,
        orderId: '',
        userId: '',
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
      description: clickInfo.event.extendedProps.description || ''
    });
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setCurrentEventData(null);
    setSelectionInfo(null);
  };

  const handleModalSave = async () => {
    if (!currentEventData) return;

    const { id, title, start, end, allDay, orderId, userId, description } = currentEventData;

    if (!title || !start || !userId) { // Basic validation
        alert("Titel, starttid och användare måste anges.");
        return;
    }
    
    const eventToSave = {
        title,
        start: Timestamp.fromDate(new Date(start)), // Convert to Firestore Timestamp
        end: end ? Timestamp.fromDate(new Date(end)) : Timestamp.fromDate(new Date(start)), // Handle if end is not set
        allDay: allDay || false,
        orderId: orderId || null,
        userId: userId,
        description: description || ""
    };

    try {
        if (id) { // Editing existing event
            const eventRef = doc(db, "scheduledJobs", id);
            await updateDoc(eventRef, eventToSave);
            // Update event in local state
            setEvents(prevEvents => prevEvents.map(ev =>
                ev.id === id ? { ...ev, ...currentEventData, start: new Date(start), end: new Date(end) } : ev
            ));
            console.log("Event updated:", id);
        } else { // Creating new event
            const docRef = await addDoc(collection(db, "scheduledJobs"), eventToSave);
            // Add new event to local state with the new ID
            setEvents(prevEvents => [...prevEvents, {
                id: docRef.id, ...currentEventData, start: new Date(start), end: new Date(end)
            }]);
            console.log("Event created:", docRef.id);
            // If a new event was created from a dragged order, remove it from unassigned list
            if (currentEventData.draggedOrderId) {
              setUnassignedOrders(prev => prev.filter(o => o.id !== currentEventData.draggedOrderId));
            }
        }
        handleModalClose();
    } catch (error) {
        console.error("Error saving event to Firestore:", error);
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
      description: info.event.extendedProps.description || '',
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
          await deleteDoc(doc(db, "scheduledJobs", id));
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

  // Style definitions for the modal
  const modalLabelStyle = {
    display: 'block',
    marginBottom: '0.25rem', // Slightly less margin for a tighter look
    color: '#4b5563',    // Tailwind gray-600, a bit softer
    fontWeight: '500',
    fontSize: '0.8rem'  // Smaller font size for labels
  };

  const modalInputStyle = {
    width: '100%',
    padding: '0.5rem 0.75rem', // Adjusted padding
    // marginBottom: '1rem', // This will be handled by the div wrappers for each form group
    border: '1px solid #d1d5db', // Thin gray border (Tailwind gray-300)
    borderRadius: '4px',       // Slightly rounded corners
    fontSize: '0.9rem',
    boxSizing: 'border-box',
    backgroundColor: '#fff' // Ensure white background
  };

  const modalButtonBaseStyle = {
    padding: '0.6rem 1.2rem',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    fontSize: '0.9rem'
  };

  const modalButtonPrimaryStyle = {
    ...modalButtonBaseStyle,
    backgroundColor: '#28a745', // Green
    color: 'white',
  };

  const modalButtonSecondaryStyle = {
    backgroundColor: 'transparent',
    color: '#4b5563', // Tailwind gray-600, for a subtle link appearance
    padding: '0.6rem 1.2rem', // Match other buttons for alignment if preferred, or less for pure link
    border: 'none',
    borderRadius: '8px',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '0.9rem',
    textDecoration: 'none',
    // Hover effect will be added inline in JSX
  };

  const modalButtonDangerStyle = {
    ...modalButtonBaseStyle,
    backgroundColor: '#e74c3c', // Red
    color: 'white',
  };

  // The redundant useEffect for fetching only orders has been removed by the previous diff.
  // The combined fetch for orders and customers is in the useEffect at line 67.

  const renderEventContent = (eventInfo) => {
    const { orderId, userId, description } = eventInfo.event.extendedProps;
    const user = schedulableUsers.find(u => u.id === userId || u.uid === userId);
    const order = orders.find(o => o.id === orderId);

    return (
      <div style={{ padding: '2px 4px', lineHeight: '1.3', fontSize: '0.8em' }}>
        <b style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{eventInfo.timeText} - {eventInfo.event.title}</b>
        {order && <i style={{ display: 'block', fontSize: '0.9em' }}>AO: {order.orderNumber}</i>}
        {user && <span style={{ display: 'block', fontSize: '0.9em' }}>Anv: {user.name}</span>}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', gap: '1rem', maxWidth: '100%', margin: '1rem auto', padding: '1rem', backgroundColor: '#F8F9FA' /* Match SidebarLayout bg */ }}>
      {/* Unassigned Orders List */}
      <div ref={externalEventsRef} style={{
        width: '280px',
        padding: '1rem',
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        height: 'calc(100vh - 100px)', // Adjust based on your header/footer
        overflowY: 'auto'
      }}>
        <h3 style={{ marginTop: 0, color: '#1f2937', fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Ej Tilldelade Jobb</h3>
        {unassignedOrders.length === 0 && <p style={{color: '#6b7280', fontSize: '0.9rem'}}>Inga ej tilldelade jobb.</p>}
        {unassignedOrders.map(order => (
          <div
            key={order.id}
            className="fc-event-draggable" // Class for Draggable to identify items
            data-order-id={order.id}
            data-order-title={order.title || 'Okänd Titel'}
            data-order-number={order.orderNumber || 'N/A'}
            style={{
              padding: '0.75rem',
              marginBottom: '0.75rem',
              backgroundColor: '#eef2ff', // Light indigo background
              color: '#4338ca', // Indigo text
              border: '1px solid #c7d2fe', // Indigo border
              borderRadius: '6px',
              cursor: 'grab',
              fontSize: '0.85rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}
          >
            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>AO: {order.orderNumber || 'Saknas Nr'}</div>
            <div>{order.title || 'Okänd Titel'}</div>
            <div style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem'}}>
              Kund: {order.customerDetails?.name || customers.find(c => c.id === order.customerId)?.name || 'Okänd kund'}
            </div>
          </div>
        ))}
      </div>

      {/* Calendar Area */}
      <div style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '1rem' }}>
        <h2 style={{ textAlign: 'center', color: '#1f2937', marginBottom: '2rem', fontWeight: 600 }}>📅 Schema & Planering</h2>
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
      />

      {isModalOpen && currentEventData && (
        <div style={{ // Modal Backdrop
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div style={{ // Modal Content
            background: '#ffffff',
            padding: '2rem',
            borderRadius: '12px', // Softer radius
            width: '100%',
            maxWidth: '550px', // Max width for the modal
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{marginTop: 0, color: '#1f2937', fontSize: '1.5rem', marginBottom: '1.5rem'}}>
              {currentEventData.id ? "Redigera schemapost" : "Skapa ny schemapost"}
            </h3>
            
            {/* Form elements with improved styling */}
            <div style={{marginBottom: '1rem'}}>
              <label htmlFor="eventTitle" style={modalLabelStyle}>Titel:</label>
              <input
                type="text" id="eventTitle"
                value={currentEventData.title}
                onChange={e => setCurrentEventData({...currentEventData, title: e.target.value})}
                style={modalInputStyle}
              />
            </div>

            <div style={{marginBottom: '1rem'}}>
              <label htmlFor="eventOrder" style={modalLabelStyle}>Arbetsorder:</label>
              <select
                id="eventOrder"
                value={currentEventData.orderId}
                onChange={e => setCurrentEventData({...currentEventData, orderId: e.target.value})}
                style={modalInputStyle}
              >
                <option value="">Ingen specifik order</option>
                {orders.map(order => (
                  <option key={order.id} value={order.id}>
                    #{order.orderNumber} - {order.title} ({order.customerDetails?.name || customers.find(c => c.id === order.customerId)?.name || 'Okänd kund'})
                  </option>
                ))}
              </select>
            </div>

            <div style={{marginBottom: '1rem'}}>
              <label htmlFor="eventUser" style={modalLabelStyle}>Tilldela användare:</label>
              <select
                id="eventUser"
                value={currentEventData.userId}
                onChange={e => setCurrentEventData({...currentEventData, userId: e.target.value})}
                required
                style={modalInputStyle}
              >
                <option value="">Välj användare</option>
                {schedulableUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.name} (ID: {user.uid ? user.uid.substring(0,6) : user.id.substring(0,6)})</option>
                ))}
              </select>
            </div>

            <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem'}}>
              <div style={{flex: 1}}>
                <label htmlFor="eventStart" style={modalLabelStyle}>Starttid:</label>
                <input
                  id="eventStart" type="datetime-local"
                  value={currentEventData.start ? new Date(currentEventData.start).toISOString().substring(0,16) : ''}
                  onChange={e => setCurrentEventData({...currentEventData, start: e.target.value})}
                  style={modalInputStyle}
                />
              </div>
              <div style={{flex: 1}}>
                <label htmlFor="eventEnd" style={modalLabelStyle}>Sluttid:</label>
                <input
                  id="eventEnd" type="datetime-local"
                  value={currentEventData.end ? new Date(currentEventData.end).toISOString().substring(0,16) : ''}
                  onChange={e => setCurrentEventData({...currentEventData, end: e.target.value})}
                  style={modalInputStyle}
                />
              </div>
            </div>
            
            <div style={{marginBottom: '1.5rem'}}>
              <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#374151'}}>
                  <input
                      type="checkbox"
                      checked={currentEventData.allDay || false}
                      onChange={e => setCurrentEventData({ ...currentEventData, allDay: e.target.checked })}
                      style={{marginRight: '0.75rem', height: '1rem', width: '1rem'}}
                  />
                  Heldagshändelse
              </label>
            </div>

            <div style={{marginBottom: '1.5rem'}}>
              <label htmlFor="eventDescription" style={{...modalLabelStyle, display: 'block'}}>Beskrivning:</label>
              <textarea
                id="eventDescription"
                value={currentEventData.description}
                onChange={e => setCurrentEventData({...currentEventData, description: e.target.value})}
                rows={4} // Increased rows
                style={{...modalInputStyle, height: 'auto'}} // auto height for textarea
              />
            </div>
            
            {/* Divider before buttons */}
            <div style={{ borderTop: '1px solid #e5e7eb', margin: '2rem 0 1.5rem 0' }}></div>

            {/* Buttons */}
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div>
                    {(currentEventData.id || currentEventData.tempEventRef) && (
                        <button onClick={handleDeleteEvent} style={modalButtonDangerStyle}>
                            Ta bort
                        </button>
                    )}
                </div>
                <div style={{display: 'flex', gap: '0.75rem'}}>
                    <button
                        onClick={handleModalClose}
                        style={modalButtonSecondaryStyle}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                    >
                        Avbryt
                    </button>
                    <button onClick={handleModalSave} style={modalButtonPrimaryStyle}>
                        {currentEventData.id ? "Spara ändringar" : "Skapa händelse"}
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div> // Closing tag for the main flex container
  );
}