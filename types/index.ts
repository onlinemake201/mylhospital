export type UserRole = 
  | 'superadmin'
  | 'hospital_admin'
  | 'doctor'
  | 'nurse'
  | 'pharmacist'
  | 'lab_technician'
  | 'radiologist'
  | 'or_staff'
  | 'emergency'
  | 'billing'
  | 'reception'
  | 'patient';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  hospitalId: string;
  departmentId?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodType?: string;
  allergies: string[];
  insurance?: Insurance;
  contactNumber: string;
  emergencyContact?: EmergencyContact;
  admissionDate?: string;
  status: 'admitted' | 'outpatient' | 'discharged' | 'emergency';
}

export interface Insurance {
  provider: string;
  policyNumber: string;
  validUntil: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  duration: number;
  type: 'consultation' | 'follow_up' | 'procedure' | 'emergency';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  room?: string;
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  route: 'oral' | 'iv' | 'im' | 'topical' | 'other';
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  status: 'active' | 'completed' | 'discontinued';
  instructions?: string;
}

export interface MedicationRegistry {
  id: string;
  name: string;
  dosage: string;
  route: 'oral' | 'iv' | 'im' | 'topical' | 'other';
  unitPrice: number;
  stockQuantity: number;
  status: 'available' | 'low_stock' | 'out_of_stock';
  reorderLevel: number;
}

export interface MedicationAdministration {
  id: string;
  medicationId: string;
  patientId: string;
  scheduledTime: string;
  administeredTime?: string;
  administeredBy?: string;
  status: 'scheduled' | 'administered' | 'missed' | 'refused';
  notes?: string;
}

export interface VitalSign {
  id: string;
  patientId: string;
  timestamp: string;
  temperature?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  recordedBy: string;
}

export interface LabOrder {
  id: string;
  patientId: string;
  patientName: string;
  orderedBy: string;
  orderedByName: string;
  orderDate: string;
  tests: LabTest[];
  priority: 'routine' | 'urgent' | 'stat';
  status: 'ordered' | 'collected' | 'processing' | 'completed' | 'cancelled';
  notes?: string;
}

export interface LabTest {
  id: string;
  name: string;
  code: string;
  category: string;
  result?: string;
  unit?: string;
  referenceRange?: string;
  status: 'pending' | 'completed' | 'abnormal';
}

export interface LabResult {
  id: string;
  orderId: string;
  patientId: string;
  testName: string;
  result: string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'abnormal' | 'critical';
  completedDate: string;
  verifiedBy: string;
}

export interface EmergencyCase {
  id: string;
  patientId: string;
  patientName: string;
  arrivalTime: string;
  chiefComplaint: string;
  triageLevel: 1 | 2 | 3 | 4 | 5;
  triageColor: 'red' | 'orange' | 'yellow' | 'green' | 'blue';
  vitalSigns: VitalSign;
  assignedTo?: string;
  status: 'waiting' | 'in_treatment' | 'admitted' | 'discharged';
  location?: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paymentMethod?: string;
  type?: 'medication' | 'service' | 'consultation';
}

export interface InvoiceItem {
  id: string;
  description: string;
  code?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  medicationId?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  assignedBy: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  category: string;
  patientId?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}
