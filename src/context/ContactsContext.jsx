import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase, formatSupabaseError } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { getPhoneKey } from '../lib/importer';

const ContactsContext = createContext(null);

export function ContactsProvider({ children }) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [calls, setCalls] = useState([]);
  const [applications, setApplications] = useState([]);
  const [trashContacts, setTrashContacts] = useState([]);
  const [trashApplications, setTrashApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [toasts, setToasts] = useState([]);

  // Ref to track timeouts for save status indicator
  const saveTimeoutRef = useRef(null);

  const markSaved = () => {
    setSaveStatus('saved');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('idle');
    }, 2500);
  };

  const showToast = useCallback((message, type = 'info', undoAction = null) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    setToasts(prev => [...prev, { id, message, type, undoAction }]);

    // Auto-remove toast after 4.5s
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch all user records on login or reload
  const refreshData = useCallback(async () => {
    if (!user) {
      setContacts([]);
      setCalls([]);
      setApplications([]);
      setTrashContacts([]);
      setTrashApplications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch active contacts
      const { data: contactsData, error: contactsErr } = await supabase
        .from('contacts')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (contactsErr) throw contactsErr;

      // 2. Fetch soft-deleted contacts for trash view
      const { data: trashData, error: trashErr } = await supabase
        .from('contacts')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (trashErr) throw trashErr;

      // 3. Fetch recent calls (last 100)
      const { data: callsData, error: callsErr } = await supabase
        .from('calls')
        .select('*, contacts(name, company, phone)')
        .order('called_at', { ascending: false })
        .limit(100);

      if (callsErr) throw callsErr;

      // 4. Fetch job applications
      const { data: appsData, error: appsErr } = await supabase
        .from('job_applications')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (appsErr) throw appsErr;

      // 5. Fetch trash applications
      const { data: trashAppsData, error: trashAppsErr } = await supabase
        .from('job_applications')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (trashAppsErr) throw trashAppsErr;

      setContacts(contactsData || []);
      setTrashContacts(trashData || []);
      setCalls(callsData || []);
      setApplications(appsData || []);
      setTrashApplications(trashAppsData || []);
    } catch (err) {
      console.error('Error fetching data from Supabase:', err);
      showToast(formatSupabaseError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Check if a phone number already exists in active contacts
  const checkDuplicatePhone = (phone, excludeId = null) => {
    const key = getPhoneKey(phone);
    if (!key) return null;
    return contacts.find(c => c.id !== excludeId && getPhoneKey(c.phone) === key);
  };

  // ----------------------------------------------------------------------------
  // CONTACTS CRUD
  // ----------------------------------------------------------------------------

  // Add Contact (Optimistic insert with rollback)
  const addContact = async (contactPayload) => {
    // 1. Check duplicate locally
    const dup = checkDuplicatePhone(contactPayload.phone);
    if (dup) {
      throw new Error(`Phone number is already saved as ${dup.name} (${dup.company}).`);
    }

    setSaveStatus('saving');
    const tempId = 'temp-' + Date.now();
    const optimisticContact = {
      id: tempId,
      ...contactPayload,
      status: contactPayload.status || 'Not Called',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setContacts(prev => [optimisticContact, ...prev]);

    try {
      const payload = {
        ...contactPayload,
        ...(user?.id ? { user_id: user.id } : {})
      };
      const { data, error } = await supabase
        .from('contacts')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      // Replace temporary optimistic row with real server row
      setContacts(prev => prev.map(c => (c.id === tempId ? data : c)));
      markSaved();
      showToast(`Contact "${data.name}" added successfully.`, 'success');
      return data;
    } catch (err) {
      // Rollback optimistic state
      setContacts(prev => prev.filter(c => c.id !== tempId));
      setSaveStatus('error');
      const friendlyMsg = formatSupabaseError(err);
      showToast(friendlyMsg, 'error');
      throw new Error(friendlyMsg);
    }
  };

  // Update Contact (Optimistic update with rollback)
  const updateContact = async (id, updates) => {
    // Check duplicate if phone is modified
    if (updates.phone) {
      const dup = checkDuplicatePhone(updates.phone, id);
      if (dup) {
        throw new Error(`Phone number is already saved as ${dup.name} (${dup.company}).`);
      }
    }

    setSaveStatus('saving');
    const previous = contacts.find(c => c.id === id);
    if (!previous) return;

    const updatedOptimistic = {
      ...previous,
      ...updates,
      updated_at: new Date().toISOString()
    };

    setContacts(prev => prev.map(c => (c.id === id ? updatedOptimistic : c)));

    try {
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setContacts(prev => prev.map(c => (c.id === id ? data : c)));
      markSaved();
      showToast(`Updated "${data.name}".`, 'success');
      return data;
    } catch (err) {
      // Rollback
      setContacts(prev => prev.map(c => (c.id === id ? previous : c)));
      setSaveStatus('error');
      const friendlyMsg = formatSupabaseError(err);
      showToast(friendlyMsg, 'error');
      throw new Error(friendlyMsg);
    }
  };

  // Soft delete contact with Undo capability
  const softDeleteContact = async (id) => {
    const contactToDelete = contacts.find(c => c.id === id);
    if (!contactToDelete) return;

    setSaveStatus('saving');
    // Optimistic remove
    setContacts(prev => prev.filter(c => c.id !== id));
    setTrashContacts(prev => [contactToDelete, ...prev]);

    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('contacts')
        .update({ deleted_at: now })
        .eq('id', id);

      if (error) throw error;
      markSaved();

      // Offer Undo in Toast
      showToast(
        `"${contactToDelete.name}" moved to Trash.`,
        'info',
        () => restoreContact(id)
      );
    } catch (err) {
      // Rollback
      setContacts(prev => [contactToDelete, ...prev]);
      setTrashContacts(prev => prev.filter(c => c.id !== id));
      setSaveStatus('error');
      showToast(formatSupabaseError(err), 'error');
    }
  };

  // Restore soft-deleted contact
  const restoreContact = async (id) => {
    const item = trashContacts.find(c => c.id === id);
    if (!item) return;

    setSaveStatus('saving');
    setTrashContacts(prev => prev.filter(c => c.id !== id));
    setContacts(prev => [{ ...item, deleted_at: null }, ...prev]);

    try {
      const { error } = await supabase
        .from('contacts')
        .update({ deleted_at: null })
        .eq('id', id);

      if (error) throw error;
      markSaved();
      showToast(`Restored "${item.name}".`, 'success');
    } catch (err) {
      setTrashContacts(prev => [item, ...prev]);
      setContacts(prev => prev.filter(c => c.id !== id));
      setSaveStatus('error');
      showToast(formatSupabaseError(err), 'error');
    }
  };

  // Permanently delete contact
  const permanentlyDeleteContact = async (id) => {
    const item = trashContacts.find(c => c.id === id);
    setTrashContacts(prev => prev.filter(c => c.id !== id));

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast(`Permanently deleted "${item?.name || 'Contact'}".`, 'info');
    } catch (err) {
      if (item) setTrashContacts(prev => [item, ...prev]);
      showToast(formatSupabaseError(err), 'error');
    }
  };

  // ----------------------------------------------------------------------------
  // CALLS LOGGING VIA RPC
  // ----------------------------------------------------------------------------

  const logCall = async ({ contactId, outcome, notes = '', followupDate = null }) => {
    setSaveStatus('saving');
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) throw new Error('Contact not found');

    const prevContact = { ...contact };
    const nowIso = new Date().toISOString();

    // Optimistic update of contact in memory
    const updatedContact = {
      ...contact,
      status: outcome,
      last_call_at: nowIso,
      followup_date: followupDate || contact.followup_date,
      updated_at: nowIso
    };
    setContacts(prev => prev.map(c => (c.id === contactId ? updatedContact : c)));

    try {
      // Invoke PostgreSQL transactional RPC function
      const { data, error } = await supabase.rpc('log_call', {
        p_contact_id: contactId,
        p_outcome: outcome,
        p_notes: notes || null,
        p_followup: followupDate || null
      });

      if (error) throw error;

      // Add new call record to recent calls state
      const newCallRecord = {
        id: data?.call_id || Date.now().toString(),
        contact_id: contactId,
        outcome,
        notes,
        followup_date: followupDate,
        called_at: nowIso,
        contacts: {
          name: contact.name,
          company: contact.company,
          phone: contact.phone
        }
      };
      setCalls(prev => [newCallRecord, ...prev]);

      markSaved();
      showToast(`Call logged with ${contact.name}: ${outcome}.`, 'success');
      return data;
    } catch (err) {
      // Rollback contact state
      setContacts(prev => prev.map(c => (c.id === contactId ? prevContact : c)));
      setSaveStatus('error');
      const friendlyMsg = formatSupabaseError(err);
      showToast(friendlyMsg, 'error');
      throw new Error(friendlyMsg);
    }
  };

  // Fetch all calls for a specific contact (for History Modal)
  const fetchContactCalls = async (contactId) => {
    try {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .eq('contact_id', contactId)
        .order('called_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching contact calls:', err);
      showToast(formatSupabaseError(err), 'error');
      return [];
    }
  };

  // Bulk Add Contacts
  const bulkAddContacts = async (contactsToInsert) => {
    if (!contactsToInsert || !contactsToInsert.length) return 0;

    setSaveStatus('saving');
    try {
      const payload = contactsToInsert.map(c => ({
        ...c,
        ...(user?.id ? { user_id: user.id } : {})
      }));

      const { data, error } = await supabase
        .from('contacts')
        .insert(payload)
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setContacts(prev => [...data, ...prev]);
        markSaved();
        showToast(`Successfully saved ${data.length} contact(s).`, 'success');
        return data.length;
      }
      return 0;
    } catch (err) {
      setSaveStatus('error');
      const friendlyMsg = formatSupabaseError(err);
      showToast(friendlyMsg, 'error');
      throw new Error(friendlyMsg);
    }
  };

  // ----------------------------------------------------------------------------
  // JOB APPLICATIONS CRUD
  // ----------------------------------------------------------------------------

  const addApplication = async (appPayload) => {
    setSaveStatus('saving');
    const tempId = 'temp-app-' + Date.now();
    const optimisticApp = {
      id: tempId,
      ...appPayload,
      application_status: appPayload.application_status || 'Applied',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setApplications(prev => [optimisticApp, ...prev]);

    try {
      const payload = {
        ...appPayload,
        ...(user?.id ? { user_id: user.id } : {})
      };
      const { data, error } = await supabase
        .from('job_applications')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      setApplications(prev => prev.map(a => (a.id === tempId ? data : a)));
      markSaved();
      showToast(`Application for "${data.company_name}" added.`, 'success');
      return data;
    } catch (err) {
      setApplications(prev => prev.filter(a => a.id !== tempId));
      setSaveStatus('error');
      const friendlyMsg = formatSupabaseError(err);
      showToast(friendlyMsg, 'error');
      throw new Error(friendlyMsg);
    }
  };

  const updateApplication = async (id, updates) => {
    setSaveStatus('saving');
    const previous = applications.find(a => a.id === id);
    if (!previous) return;

    const updatedOptimistic = {
      ...previous,
      ...updates,
      updated_at: new Date().toISOString()
    };
    setApplications(prev => prev.map(a => (a.id === id ? updatedOptimistic : a)));

    try {
      const { data, error } = await supabase
        .from('job_applications')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setApplications(prev => prev.map(a => (a.id === id ? data : a)));
      markSaved();
      showToast(`Updated "${data.company_name}" application.`, 'success');
      return data;
    } catch (err) {
      setApplications(prev => prev.map(a => (a.id === id ? previous : a)));
      setSaveStatus('error');
      const friendlyMsg = formatSupabaseError(err);
      showToast(friendlyMsg, 'error');
      throw new Error(friendlyMsg);
    }
  };

  const softDeleteApplication = async (id) => {
    const item = applications.find(a => a.id === id);
    if (!item) return;

    setApplications(prev => prev.filter(a => a.id !== id));
    setTrashApplications(prev => [item, ...prev]);

    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('job_applications')
        .update({ deleted_at: now })
        .eq('id', id);

      if (error) throw error;
      showToast(
        `Application for "${item.company_name}" moved to Trash.`,
        'info',
        () => restoreApplication(id)
      );
    } catch (err) {
      setApplications(prev => [item, ...prev]);
      setTrashApplications(prev => prev.filter(a => a.id !== id));
      showToast(formatSupabaseError(err), 'error');
    }
  };

  const restoreApplication = async (id) => {
    const item = trashApplications.find(a => a.id === id);
    if (!item) return;

    setTrashApplications(prev => prev.filter(a => a.id !== id));
    setApplications(prev => [{ ...item, deleted_at: null }, ...prev]);

    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ deleted_at: null })
        .eq('id', id);

      if (error) throw error;
      showToast(`Restored "${item.company_name}" application.`, 'success');
    } catch (err) {
      setTrashApplications(prev => [item, ...prev]);
      setApplications(prev => prev.filter(a => a.id !== id));
      showToast(formatSupabaseError(err), 'error');
    }
  };

  const permanentlyDeleteApplication = async (id) => {
    const item = trashApplications.find(a => a.id === id);
    setTrashApplications(prev => prev.filter(a => a.id !== id));

    try {
      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast(`Deleted application for "${item?.company_name || 'Company'}".`, 'info');
    } catch (err) {
      if (item) setTrashApplications(prev => [item, ...prev]);
      showToast(formatSupabaseError(err), 'error');
    }
  };

  const value = {
    contacts,
    calls,
    applications,
    trashContacts,
    trashApplications,
    loading,
    saveStatus,
    toasts,
    removeToast,
    showToast,
    refreshData,
    checkDuplicatePhone,
    addContact,
    updateContact,
    softDeleteContact,
    restoreContact,
    permanentlyDeleteContact,
    logCall,
    fetchContactCalls,
    bulkAddContacts,
    addApplication,
    updateApplication,
    softDeleteApplication,
    restoreApplication,
    permanentlyDeleteApplication
  };

  return <ContactsContext.Provider value={value}>{children}</ContactsContext.Provider>;
}

export function useContacts() {
  const context = useContext(ContactsContext);
  if (!context) {
    throw new Error('useContacts must be used within a ContactsProvider');
  }
  return context;
}

