import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, Alert } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Search, Plus, Filter, X, Edit2, Trash2 } from 'lucide-react-native';
import { PatientCard } from '@/components/PatientCard';
import { useHospital } from '@/contexts/HospitalContext';
import { Patient } from '@/types';

export default function PatientsScreen() {
  const router = useRouter();
  const { edit } = useLocalSearchParams();
  const { patients, addPatient, updatePatient, deletePatient } = useHospital();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<Patient['status'] | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [newPatient, setNewPatient] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    bloodType: '',
    weight: '',
    contactNumber: '',
    allergies: '',
    status: 'outpatient' as Patient['status'],
  });

  const filteredPatients = patients.filter(patient => {
    const matchesSearch =
      patient.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.mrn.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === 'all' || patient.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  useEffect(() => {
    if (edit) {
      console.log('Edit query param detected:', edit);
      const patientToEdit = patients.find(p => p.id === edit);
      if (patientToEdit) {
        console.log('Found patient to edit:', patientToEdit);
        setEditingPatient(patientToEdit);
        setNewPatient({
          firstName: patientToEdit.firstName,
          lastName: patientToEdit.lastName,
          dateOfBirth: patientToEdit.dateOfBirth,
          gender: patientToEdit.gender,
          bloodType: patientToEdit.bloodType || '',
          weight: patientToEdit.weight?.toString() || '',
          contactNumber: patientToEdit.contactNumber,
          allergies: patientToEdit.allergies.join(', '),
          status: patientToEdit.status,
        });
        setShowCreateModal(true);
        router.setParams({ edit: undefined });
      }
    }
  }, [edit, patients]);

  const statusFilters: { label: string; value: Patient['status'] | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Admitted', value: 'admitted' },
    { label: 'Outpatient', value: 'outpatient' },
    { label: 'Emergency', value: 'emergency' },
    { label: 'Discharged', value: 'discharged' },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Patients',
          headerLargeTitle: true,
          headerRight: () => (
            <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateModal(true)}>
              <Plus size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#8E8E93" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search patients..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#8E8E93"
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {statusFilters.map(filter => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.filterChip,
                filterStatus === filter.value && styles.filterChipActive,
              ]}
              onPress={() => setFilterStatus(filter.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterStatus === filter.value && styles.filterChipTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          <Text style={styles.resultCount}>
            {filteredPatients.length} {filteredPatients.length === 1 ? 'patient' : 'patients'}
          </Text>
          {filteredPatients.map(patient => (
            <View key={patient.id} style={styles.patientCardContainer}>
              <View
                style={[
                  styles.patientCardWrapper,
                  selectedPatient?.id === patient.id && styles.patientCardSelected
                ]}
              >
                <TouchableOpacity
                  onPress={() => {
                    if (selectedPatient?.id === patient.id) {
                      setSelectedPatient(null);
                    } else {
                      setSelectedPatient(patient);
                    }
                  }}
                  onLongPress={() => router.push(`/patient-details/${patient.id}`)}
                  activeOpacity={0.7}
                >
                  <PatientCard patient={patient} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        {selectedPatient && (
          <View style={styles.bottomActionsContainer}>
            <View style={styles.selectedPatientInfo}>
              <Text style={styles.selectedPatientName}>
                {selectedPatient.firstName} {selectedPatient.lastName}
              </Text>
              <TouchableOpacity onPress={() => setSelectedPatient(null)}>
                <X size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            <View style={styles.patientActions}>
              <TouchableOpacity
                style={styles.editPatientButton}
                onPress={() => {
                  setEditingPatient(selectedPatient);
                  setNewPatient({
                    firstName: selectedPatient.firstName,
                    lastName: selectedPatient.lastName,
                    dateOfBirth: selectedPatient.dateOfBirth,
                    gender: selectedPatient.gender,
                    bloodType: selectedPatient.bloodType || '',
                    weight: selectedPatient.weight?.toString() || '',
                    contactNumber: selectedPatient.contactNumber,
                    allergies: selectedPatient.allergies.join(', '),
                    status: selectedPatient.status,
                  });
                  setShowCreateModal(true);
                  setSelectedPatient(null);
                }}
              >
                <Edit2 size={18} color="#007AFF" />
                <Text style={styles.editPatientText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deletePatientButton}
                onPress={() => {
                  Alert.alert(
                    'Delete Patient',
                    `Do you really want to delete ${selectedPatient.firstName} ${selectedPatient.lastName}?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => {
                          deletePatient(selectedPatient.id);
                          setSelectedPatient(null);
                          Alert.alert('Success', 'Patient deleted');
                        },
                      },
                    ]
                  );
                }}
              >
                <Trash2 size={18} color="#FF3B30" />
                <Text style={styles.deletePatientText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!selectedPatient && (
          <View style={styles.floatingButtonContainer}>
            <TouchableOpacity
              style={styles.floatingButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Plus size={24} color="#FFFFFF" />
              <Text style={styles.floatingButtonText}>New Patient</Text>
            </TouchableOpacity>
          </View>
        )}

        <Modal
          visible={showCreateModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingPatient ? 'Edit Patient' : 'New Patient'}</Text>
                <TouchableOpacity onPress={() => {
                  setShowCreateModal(false);
                  setEditingPatient(null);
                }}>
                  <X size={24} color="#8E8E93" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>First Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={newPatient.firstName}
                    onChangeText={(text) => setNewPatient({ ...newPatient, firstName: text })}
                    placeholder="Enter first name"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Last Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={newPatient.lastName}
                    onChangeText={(text) => setNewPatient({ ...newPatient, lastName: text })}
                    placeholder="Enter last name"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Date of Birth * (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.input}
                    value={newPatient.dateOfBirth}
                    onChangeText={(text) => setNewPatient({ ...newPatient, dateOfBirth: text })}
                    placeholder="1990-01-01"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Gender</Text>
                  <View style={styles.genderButtons}>
                    {(['male', 'female', 'other'] as const).map((gender) => (
                      <TouchableOpacity
                        key={gender}
                        style={[
                          styles.genderButton,
                          newPatient.gender === gender && styles.genderButtonActive,
                        ]}
                        onPress={() => setNewPatient({ ...newPatient, gender })}
                      >
                        <Text
                          style={[
                            styles.genderButtonText,
                            newPatient.gender === gender && styles.genderButtonTextActive,
                          ]}
                        >
                          {gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : 'Other'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Blood Type</Text>
                  <TextInput
                    style={styles.input}
                    value={newPatient.bloodType}
                    onChangeText={(text) => setNewPatient({ ...newPatient, bloodType: text })}
                    placeholder="A+, B-, O+, etc."
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Weight (KG)</Text>
                  <TextInput
                    style={styles.input}
                    value={newPatient.weight}
                    onChangeText={(text) => setNewPatient({ ...newPatient, weight: text })}
                    placeholder="e.g. 75"
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Phone Number *</Text>
                  <TextInput
                    style={styles.input}
                    value={newPatient.contactNumber}
                    onChangeText={(text) => setNewPatient({ ...newPatient, contactNumber: text })}
                    placeholder="+1 555 123 4567"
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Allergies (comma separated)</Text>
                  <TextInput
                    style={styles.input}
                    value={newPatient.allergies}
                    onChangeText={(text) => setNewPatient({ ...newPatient, allergies: text })}
                    placeholder="Penicillin, Nuts, etc."
                    multiline
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Status</Text>
                  <View style={styles.statusButtons}>
                    {(['admitted', 'outpatient', 'emergency', 'discharged'] as const).map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusButton,
                          newPatient.status === status && styles.statusButtonActive,
                        ]}
                        onPress={() => setNewPatient({ ...newPatient, status })}
                      >
                        <Text
                          style={[
                            styles.statusButtonText,
                            newPatient.status === status && styles.statusButtonTextActive,
                          ]}
                        >
                          {status === 'admitted' ? 'Admitted' : status === 'outpatient' ? 'Outpatient' : status === 'emergency' ? 'Emergency' : 'Discharged'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowCreateModal(false);
                    setEditingPatient(null);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={() => {
                    console.log('Form submitted with data:', newPatient);
                    
                    if (!newPatient.firstName || !newPatient.lastName || !newPatient.dateOfBirth || !newPatient.contactNumber) {
                      Alert.alert('Error', 'Please fill in all required fields');
                      return;
                    }
                    
                    try {
                      if (editingPatient) {
                        console.log('Updating patient:', editingPatient.id);
                        updatePatient(editingPatient.id, {
                          firstName: newPatient.firstName,
                          lastName: newPatient.lastName,
                          dateOfBirth: newPatient.dateOfBirth,
                          gender: newPatient.gender,
                          bloodType: newPatient.bloodType || undefined,
                          weight: newPatient.weight ? parseFloat(newPatient.weight) : undefined,
                          contactNumber: newPatient.contactNumber,
                          allergies: newPatient.allergies ? newPatient.allergies.split(',').map(a => a.trim()).filter(a => a) : [],
                          status: newPatient.status,
                          admissionDate: newPatient.status === 'admitted' && !editingPatient.admissionDate ? new Date().toISOString().split('T')[0] : editingPatient.admissionDate,
                        });
                        Alert.alert('Success', 'Patient updated successfully');
                      } else {
                        const patient: Patient = {
                          id: `p${Date.now()}`,
                          mrn: `MRN-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                          firstName: newPatient.firstName,
                          lastName: newPatient.lastName,
                          dateOfBirth: newPatient.dateOfBirth,
                          gender: newPatient.gender,
                          bloodType: newPatient.bloodType || undefined,
                          weight: newPatient.weight ? parseFloat(newPatient.weight) : undefined,
                          contactNumber: newPatient.contactNumber,
                          allergies: newPatient.allergies ? newPatient.allergies.split(',').map(a => a.trim()).filter(a => a) : [],
                          status: newPatient.status,
                          admissionDate: newPatient.status === 'admitted' ? new Date().toISOString().split('T')[0] : undefined,
                        };
                        console.log('Creating new patient:', patient);
                        addPatient(patient);
                        Alert.alert('Success', 'Patient created successfully');
                      }
                      
                      setShowCreateModal(false);
                      setEditingPatient(null);
                      setNewPatient({
                        firstName: '',
                        lastName: '',
                        dateOfBirth: '',
                        gender: 'male',
                        bloodType: '',
                        weight: '',
                        contactNumber: '',
                        allergies: '',
                        status: 'outpatient',
                      });
                    } catch (error) {
                      console.error('Error saving patient:', error);
                      Alert.alert('Error', 'Could not save patient');
                    }
                  }}
                >
                  <Text style={styles.confirmButtonText}>{editingPatient ? 'Update' : 'Create'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterScroll: {
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#3C3C43',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  resultCount: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  addButton: {
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#000000',
  },
  modalScroll: {
    maxHeight: 500,
  },
  formGroup: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#000000',
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#007AFF',
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#000000',
  },
  genderButtonTextActive: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  modalButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#000000',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  patientActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
  },
  editPatientButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#E5F3FF',
    borderRadius: 12,
  },
  editPatientText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  deletePatientButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#FFE5E5',
    borderRadius: 12,
  },
  deletePatientText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FF3B30',
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'transparent',
  },
  floatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  bottomActionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedPatientInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  selectedPatientName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000000',
  },
  patientCardContainer: {
    marginBottom: 12,
  },
  patientCardWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  patientCardSelected: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    minWidth: '47%',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#007AFF',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#000000',
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
  },
});
