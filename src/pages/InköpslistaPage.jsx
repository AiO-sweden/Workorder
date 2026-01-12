import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, Plus, X, Check, Trash2 } from 'lucide-react';
import { spacing, borderRadius, typography, transitions } from '../components/shared/theme';

export default function InköpslistaPage() {
  const { userDetails } = useAuth();
  const [purchaseLists, setPurchaseLists] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [listItems, setListItems] = useState([]);
  const [newItemText, setNewItemText] = useState('');
  const [newListTitle, setNewListTitle] = useState('');
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [commentText, setCommentText] = useState('');

  // Fetch purchase lists
  useEffect(() => {
    if (!userDetails?.organizationId) return;
    fetchPurchaseLists();
    fetchOrders();
  }, [userDetails]);

  // Fetch items when a list is selected
  useEffect(() => {
    if (selectedList) {
      fetchListItems(selectedList.id);
    }
  }, [selectedList]);

  const fetchPurchaseLists = async () => {
    const { data, error } = await supabase
      .from('purchase_lists')
      .select('*')
      .eq('organization_id', userDetails.organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchase lists:', error);
    } else {
      setPurchaseLists(data || []);
      if (data && data.length > 0 && !selectedList) {
        setSelectedList(data[0]);
      }
    }
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('organization_id', userDetails.organizationId)
      .order('orderNumber', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders(data || []);
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

  const createNewList = async () => {
    if (!newListTitle.trim()) return;

    const { data, error } = await supabase
      .from('purchase_lists')
      .insert({
        title: newListTitle,
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
      setNewListTitle('');
      setShowNewListInput(false);
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

  const deleteList = async (listId) => {
    if (!window.confirm('Är du säker på att du vill ta bort hela inköpslistan?')) return;

    const { error } = await supabase
      .from('purchase_lists')
      .delete()
      .eq('id', listId);

    if (error) {
      console.error('Error deleting list:', error);
    } else {
      setPurchaseLists(purchaseLists.filter(l => l.id !== listId));
      if (selectedList?.id === listId) {
        setSelectedList(purchaseLists[0] || null);
        setListItems([]);
      }
    }
  };

  const getOrderTitle = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    return order ? `#${order.orderNumber} - ${order.title}` : 'Ingen arbetsorder';
  };

  const containerStyle = {
    padding: spacing['8'],
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const headerStyle = {
    marginBottom: spacing['8']
  };

  const cardStyle = {
    background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.95) 100%)',
    backdropFilter: 'blur(20px)',
    borderRadius: borderRadius.xl,
    padding: spacing['6'],
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)'
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing['4'], marginBottom: spacing['2'] }}>
          <ShoppingCart size={32} color="#3b82f6" />
          <h1 style={{ fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold, margin: 0, color: '#fff' }}>
            Inköpslista
          </h1>
        </div>
        <p style={{ fontSize: typography.fontSize.lg, color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
          Hantera inköpslistor för arbetsordrar
        </p>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: spacing['6'] }}>
        {/* Left Sidebar - Lists */}
        <div style={cardStyle}>
          <div style={{ marginBottom: spacing['4'] }}>
            <h2 style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, margin: 0, marginBottom: spacing['4'], color: '#fff' }}>
              Mina listor
            </h2>

            {/* New List Input */}
            {showNewListInput ? (
              <div style={{ marginBottom: spacing['3'] }}>
                <input
                  type="text"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      createNewList();
                    }
                  }}
                  onBlur={() => {
                    if (newListTitle.trim()) {
                      createNewList();
                    } else {
                      setShowNewListInput(false);
                    }
                  }}
                  placeholder="Namn på lista..."
                  autoFocus
                  style={{
                    width: '100%',
                    padding: spacing['2'],
                    borderRadius: borderRadius.md,
                    border: '1px solid rgba(59, 130, 246, 0.5)',
                    background: 'rgba(0, 0, 0, 0.3)',
                    color: '#fff',
                    fontSize: typography.fontSize.sm,
                    outline: 'none'
                  }}
                />
              </div>
            ) : (
              <button
                onClick={() => setShowNewListInput(true)}
                style={{
                  width: '100%',
                  padding: spacing['2'],
                  borderRadius: borderRadius.md,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: typography.fontSize.sm,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing['2'],
                  transition: transitions.all,
                  marginBottom: spacing['3']
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
              >
                <Plus size={16} />
                <span>Ny lista</span>
              </button>
            )}

            {/* List Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
              {purchaseLists.map(list => (
                <div
                  key={list.id}
                  onClick={() => setSelectedList(list)}
                  style={{
                    padding: spacing['3'],
                    borderRadius: borderRadius.md,
                    background: selectedList?.id === list.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${selectedList?.id === list.id ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                    cursor: 'pointer',
                    transition: transitions.all,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedList?.id !== list.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedList?.id !== list.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: '#fff' }}>
                      {list.title}
                    </div>
                    <div style={{ fontSize: typography.fontSize.xs, color: 'rgba(255, 255, 255, 0.5)', marginTop: spacing['1'] }}>
                      {new Date(list.created_at).toLocaleDateString('sv-SE')}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteList(list.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: spacing['1'],
                      color: 'rgba(255, 255, 255, 0.5)',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Checklist */}
        <div style={cardStyle}>
          {!selectedList ? (
            <div style={{ textAlign: 'center', padding: spacing['12'], color: 'rgba(255, 255, 255, 0.6)' }}>
              <ShoppingCart size={64} style={{ margin: '0 auto', marginBottom: spacing['4'], opacity: 0.3 }} />
              <p style={{ fontSize: typography.fontSize.lg, color: 'rgba(255, 255, 255, 0.6)' }}>Välj en inköpslista eller skapa en ny</p>
            </div>
          ) : (
            <>
              {/* List Header */}
              <div style={{ marginBottom: spacing['6'] }}>
                <h2 style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, margin: 0, color: '#fff' }}>
                  {selectedList.title}
                </h2>
                {selectedList.order_id && (
                  <p style={{ fontSize: typography.fontSize.sm, color: 'rgba(255, 255, 255, 0.6)', margin: 0, marginTop: spacing['2'] }}>
                    {getOrderTitle(selectedList.order_id)}
                  </p>
                )}
              </div>

              {/* Checklist Items */}
              <div style={{ marginBottom: spacing['6'] }}>
                {listItems.map(item => (
                  <div
                    key={item.id}
                    style={{
                      padding: `${spacing['3']} 0`,
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
                      gap: spacing['3']
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
                          padding: spacing['1'],
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
                    <div style={{ marginLeft: `calc(24px + ${spacing['3']})`, marginTop: spacing['1'] }}>
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
                            padding: spacing['1'],
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
                            padding: spacing['1'],
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
              <form onSubmit={createNewItem} style={{ display: 'flex', alignItems: 'center', gap: spacing['3'] }}>
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
                    padding: `${spacing['2']} 0`
                  }}
                />
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
