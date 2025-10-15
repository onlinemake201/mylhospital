import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Patient, Appointment, Medication, MedicationRegistry, LabOrder, EmergencyCase, Task, Notification, Invoice, HospitalSettings, PatientVisit, PatientFile } from '@/types';

const HOSPITAL_SETTINGS_KEY = '@hospital_settings';

export const [HospitalProvider, useHospital] = createContextHook(() => {
  const [patients, setPatients] = useState<Patient[]>([
    {
      id: 'p1',
      mrn: 'MRN-001234',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1985-03-15',
      gender: 'male',
      bloodType: 'A+',
      allergies: ['Penicillin', 'Peanuts'],
      contactNumber: '+1-555-0123',
      status: 'admitted',
      admissionDate: '2025-10-10',
      insurance: {
        provider: 'Blue Cross',
        policyNumber: 'BC-123456',
        validUntil: '2026-12-31',
      },
      emergencyContact: {
        name: 'Jane Doe',
        relationship: 'Spouse',
        phone: '+1-555-0124',
      },
    },
    {
      id: 'p2',
      mrn: 'MRN-001235',
      firstName: 'Maria',
      lastName: 'Garcia',
      dateOfBirth: '1992-07-22',
      gender: 'female',
      bloodType: 'O-',
      allergies: [],
      contactNumber: '+1-555-0125',
      status: 'outpatient',
    },
  ]);

  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: 'apt1',
      patientId: 'p1',
      patientName: 'John Doe',
      doctorId: 'd1',
      doctorName: 'Dr. Sarah Johnson',
      date: '2025-10-15',
      time: '10:00',
      duration: 30,
      type: 'consultation',
      status: 'scheduled',
      room: 'Room 301',
    },
    {
      id: 'apt2',
      patientId: 'p2',
      patientName: 'Maria Garcia',
      doctorId: 'd1',
      doctorName: 'Dr. Sarah Johnson',
      date: '2025-10-15',
      time: '14:30',
      duration: 45,
      type: 'follow_up',
      status: 'confirmed',
      room: 'Room 302',
    },
  ]);

  const [medications, setMedications] = useState<Medication[]>([
    {
      id: 'm1',
      patientId: 'p1',
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      route: 'oral',
      startDate: '2025-10-10',
      prescribedBy: 'Dr. Sarah Johnson',
      status: 'active',
      instructions: 'Take in the morning with food',
    },
  ]);

  const [labOrders, setLabOrders] = useState<LabOrder[]>([
    {
      id: 'lab1',
      patientId: 'p1',
      patientName: 'John Doe',
      orderedBy: 'd1',
      orderedByName: 'Dr. Sarah Johnson',
      orderDate: '2025-10-14',
      priority: 'routine',
      status: 'processing',
      tests: [
        {
          id: 't1',
          name: 'Complete Blood Count',
          code: 'CBC',
          category: 'Hematology',
          status: 'pending',
        },
        {
          id: 't2',
          name: 'Lipid Panel',
          code: 'LIPID',
          category: 'Chemistry',
          status: 'pending',
        },
      ],
    },
  ]);

  const [emergencyCases, setEmergencyCases] = useState<EmergencyCase[]>([
    {
      id: 'em1',
      patientId: 'p3',
      patientName: 'Robert Smith',
      arrivalTime: '2025-10-15T08:30:00',
      chiefComplaint: 'Chest pain',
      triageLevel: 2,
      triageColor: 'orange',
      status: 'in_treatment',
      location: 'ER Bay 3',
      vitalSigns: {
        id: 'vs1',
        patientId: 'p3',
        timestamp: '2025-10-15T08:35:00',
        temperature: 37.2,
        bloodPressureSystolic: 145,
        bloodPressureDiastolic: 92,
        heartRate: 98,
        respiratoryRate: 18,
        oxygenSaturation: 96,
        recordedBy: 'Nurse Williams',
      },
    },
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 'task1',
      title: 'Review lab results for John Doe',
      assignedTo: 'd1',
      assignedBy: 'system',
      dueDate: '2025-10-15T16:00:00',
      priority: 'high',
      status: 'pending',
      category: 'Lab Review',
      patientId: 'p1',
    },
  ]);

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'n1',
      userId: 'd1',
      title: 'Critical Lab Result',
      message: 'Patient John Doe has abnormal lab values requiring immediate attention',
      type: 'warning',
      timestamp: '2025-10-15T09:00:00',
      read: false,
    },
  ]);

  const [medicationRegistry, setMedicationRegistry] = useState<MedicationRegistry[]>([
    { id: 'med1', name: 'Aspirin', dosage: '100mg', route: 'oral', unitPrice: 5.50, stockQuantity: 500, status: 'available', reorderLevel: 100 },
    { id: 'med2', name: 'Ibuprofen', dosage: '400mg', route: 'oral', unitPrice: 8.20, stockQuantity: 300, status: 'available', reorderLevel: 100 },
    { id: 'med3', name: 'Paracetamol', dosage: '500mg', route: 'oral', unitPrice: 4.75, stockQuantity: 450, status: 'available', reorderLevel: 100 },
  ]);

  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [hospitalSettings, setHospitalSettings] = useState<HospitalSettings>({
    id: 'hosp-001',
    name: 'Klinikum Musterstadt',
    address: 'Musterstraße 123, 12345 Musterstadt',
    phone: '+49 123 456789',
    email: 'info@klinikum-musterstadt.de',
    website: 'www.klinikum-musterstadt.de',
    taxId: 'DE123456789',
    language: 'de',
  });

  const [patientVisits, setPatientVisits] = useState<PatientVisit[]>([
    {
      id: 'v1',
      patientId: 'p1',
      date: '2025-10-12',
      time: '10:30',
      doctorId: 'd1',
      doctorName: 'Dr. Sarah Johnson',
      chiefComplaint: 'Chronische Rückenschmerzen',
      diagnosis: 'Lumbale Spondylose',
      treatment: 'Physiotherapie empfohlen, Schmerzmedikation',
      prescriptions: ['Ibuprofen 400mg', 'Physiotherapie 10x'],
      notes: 'Patient zeigt gute Compliance, Termin in 4 Wochen',
      category: 'consultation',
    },
  ]);

  const [patientFiles, setPatientFiles] = useState<PatientFile[]>([]);

  useEffect(() => {
    const loadHospitalSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(HOSPITAL_SETTINGS_KEY);
        console.log('HospitalContext: Loading stored settings...');
        
        if (stored) {
          try {
            if (stored === 'undefined' || stored === 'null' || stored.trim() === '') {
              console.warn('HospitalContext: Invalid stored value, clearing...');
              await AsyncStorage.removeItem(HOSPITAL_SETTINGS_KEY);
              return;
            }
            
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object' && parsed.id) {
              console.log('HospitalContext: Settings loaded successfully');
              setHospitalSettings(parsed);
            } else {
              console.warn('HospitalContext: Invalid settings data structure, clearing...');
              await AsyncStorage.removeItem(HOSPITAL_SETTINGS_KEY);
            }
          } catch (parseError) {
            console.error('HospitalContext: JSON parse error:', parseError);
            console.log('HospitalContext: Stored value was:', stored);
            await AsyncStorage.removeItem(HOSPITAL_SETTINGS_KEY);
          }
        } else {
          console.log('HospitalContext: No stored settings data found, using defaults');
        }
      } catch (error) {
        console.error('HospitalContext: Failed to load settings:', error);
      }
    };
    loadHospitalSettings();
  }, []);

  const updateHospitalSettings = useCallback(async (updates: Partial<HospitalSettings>) => {
    console.log('HospitalContext: Updating hospital settings:', updates);
    const updated = { ...hospitalSettings, ...updates };
    setHospitalSettings(updated);
    try {
      await AsyncStorage.setItem(HOSPITAL_SETTINGS_KEY, JSON.stringify(updated));
      console.log('HospitalContext: Settings saved');
    } catch (error) {
      console.error('HospitalContext: Failed to save settings:', error);
    }
  }, [hospitalSettings]);

  const addPatient = useCallback((patient: Patient) => {
    console.log('HospitalContext: Adding patient:', patient);
    setPatients(prev => {
      const updated = [...prev, patient];
      console.log('HospitalContext: Updated patients list:', updated.length);
      return updated;
    });
  }, []);

  const updatePatient = useCallback((id: string, updates: Partial<Patient>) => {
    console.log('HospitalContext: Updating patient:', id, updates);
    setPatients(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      console.log('HospitalContext: Updated patients list:', updated.length);
      return updated;
    });
  }, []);

  const deletePatient = useCallback((id: string) => {
    console.log('HospitalContext: Deleting patient:', id);
    setPatients(prev => {
      const updated = prev.filter(p => p.id !== id);
      console.log('HospitalContext: Updated patients list:', updated.length);
      return updated;
    });
  }, []);

  const addAppointment = useCallback((appointment: Appointment) => {
    setAppointments(prev => [...prev, appointment]);
  }, []);

  const updateAppointment = useCallback((id: string, updates: Partial<Appointment>) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const addMedication = useCallback((medication: Medication) => {
    setMedications(prev => [...prev, medication]);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const updateTaskStatus = useCallback((id: string, status: Task['status']) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  }, []);

  const updateMedication = useCallback((id: string, updates: Partial<Medication>) => {
    setMedications(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const deleteMedication = useCallback((id: string) => {
    setMedications(prev => prev.filter(m => m.id !== id));
  }, []);

  const deleteAppointment = useCallback((id: string) => {
    console.log('HospitalContext: Deleting appointment:', id);
    setAppointments(prev => prev.filter(a => a.id !== id));
  }, []);

  const addMedicationRegistry = useCallback((med: MedicationRegistry) => {
    console.log('HospitalContext: Adding medication to registry:', med);
    setMedicationRegistry(prev => [...prev, med]);
  }, []);

  const updateMedicationRegistry = useCallback((id: string, updates: Partial<MedicationRegistry>) => {
    console.log('HospitalContext: Updating medication registry:', id, updates);
    setMedicationRegistry(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const deleteMedicationRegistry = useCallback((id: string) => {
    console.log('HospitalContext: Deleting medication from registry:', id);
    setMedicationRegistry(prev => prev.filter(m => m.id !== id));
  }, []);

  const addInvoice = useCallback((invoice: Invoice) => {
    console.log('HospitalContext: Adding invoice:', invoice);
    setInvoices(prev => [...prev, invoice]);
  }, []);

  const updateInvoice = useCallback((id: string, updates: Partial<Invoice>) => {
    console.log('HospitalContext: Updating invoice:', id, updates);
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  }, []);

  const deleteInvoice = useCallback((id: string) => {
    console.log('HospitalContext: Deleting invoice:', id);
    setInvoices(prev => prev.filter(i => i.id !== id));
  }, []);

  const addPatientVisit = useCallback((visit: PatientVisit) => {
    console.log('HospitalContext: Adding patient visit:', visit);
    setPatientVisits(prev => [...prev, visit]);
  }, []);

  const addPatientFile = useCallback((file: PatientFile) => {
    console.log('HospitalContext: Adding patient file:', file);
    setPatientFiles(prev => [...prev, file]);
  }, []);

  const deletePatientFile = useCallback((id: string) => {
    console.log('HospitalContext: Deleting patient file:', id);
    setPatientFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  return useMemo(() => ({
    patients,
    appointments,
    medications,
    medicationRegistry,
    invoices,
    labOrders,
    emergencyCases,
    tasks,
    notifications,
    hospitalSettings,
    patientVisits,
    patientFiles,
    addPatient,
    updatePatient,
    deletePatient,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    addMedication,
    updateMedication,
    deleteMedication,
    addMedicationRegistry,
    updateMedicationRegistry,
    deleteMedicationRegistry,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    markNotificationRead,
    updateTaskStatus,
    updateHospitalSettings,
    addPatientVisit,
    addPatientFile,
    deletePatientFile,
  }), [patients, appointments, medications, medicationRegistry, invoices, labOrders, emergencyCases, tasks, notifications, hospitalSettings, patientVisits, patientFiles, addPatient, updatePatient, deletePatient, addAppointment, updateAppointment, deleteAppointment, addMedication, updateMedication, deleteMedication, addMedicationRegistry, updateMedicationRegistry, deleteMedicationRegistry, addInvoice, updateInvoice, deleteInvoice, markNotificationRead, updateTaskStatus, updateHospitalSettings, addPatientVisit, addPatientFile, deletePatientFile]);
});
