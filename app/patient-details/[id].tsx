import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, FileText, Upload, Calendar, FileImage, ChevronDown, ChevronUp, X, Edit2, Trash2 } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useHospital } from '@/contexts/HospitalContext';
import { useAuth } from '@/contexts/AuthContext';
import { PatientVisit, PatientFile } from '@/types';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';


export default function PatientDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { patients, patientVisits, patientFiles, addPatientVisit, addPatientFile } = useHospital();
  
  const patient = patients.find(p => p.id === id);
  const visits = patientVisits.filter((v: PatientVisit) => v.patientId === id).sort((a: PatientVisit, b: PatientVisit) => 
    new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime()
  );
  const files = patientFiles.filter((f: PatientFile) => f.patientId === id);

  const [showAddVisit, setShowAddVisit] = useState(false);
  const [showUploadFile, setShowUploadFile] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null);

  const [newVisit, setNewVisit] = useState<{
    date: string;
    time: string;
    chiefComplaint: string;
    diagnosis: string;
    treatment: string;
    prescriptions: string;
    notes: string;
    category: 'consultation' | 'follow_up' | 'emergency' | 'procedure';
  }>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    chiefComplaint: '',
    diagnosis: '',
    treatment: '',
    prescriptions: '',
    notes: '',
    category: 'consultation',
  });

  const [newFile, setNewFile] = useState<{
    name: string;
    category: string;
    notes: string;
    uri: string;
    type: 'document' | 'image';
  }>({
    name: '',
    category: 'report',
    notes: '',
    uri: '',
    type: 'document',
  });

  const isDoctor = user?.role === 'doctor' || user?.role === 'superadmin';

  if (!patient) {
    return (
      <View style={styles.container}>
        <Text>Patient not found</Text>
      </View>
    );
  }

  const categories = ['all', 'consultation', 'follow_up', 'emergency', 'procedure'];
  const fileCategories = ['report', 'lab', 'imaging', 'prescription', 'other'];

  const filteredVisits = selectedCategory === 'all' 
    ? visits 
    : visits.filter((v: PatientVisit) => v.category === selectedCategory);

  const groupedFiles = fileCategories.reduce((acc, cat) => {
    acc[cat] = files.filter((f: PatientFile) => f.category === cat);
    return acc;
  }, {} as Record<string, PatientFile[]>);

  const handleAddVisit = () => {
    if (!newVisit.chiefComplaint || !newVisit.diagnosis || !newVisit.treatment) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const visit: PatientVisit = {
      id: `v${Date.now()}`,
      patientId: id as string,
      date: newVisit.date,
      time: newVisit.time,
      doctorId: user?.id || '',
      doctorName: user?.name || '',
      chiefComplaint: newVisit.chiefComplaint,
      diagnosis: newVisit.diagnosis,
      treatment: newVisit.treatment,
      prescriptions: newVisit.prescriptions ? newVisit.prescriptions.split(',').map(p => p.trim()) : undefined,
      notes: newVisit.notes || undefined,
      category: newVisit.category,
    };

    addPatientVisit(visit);
    setShowAddVisit(false);
    setNewVisit({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      chiefComplaint: '',
      diagnosis: '',
      treatment: '',
      prescriptions: '',
      notes: '',
      category: 'consultation',
    });
    Alert.alert('Success', 'Visit added successfully');
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setNewFile({
          ...newFile,
          name: asset.name,
          uri: asset.uri,
          type: 'document' as const,
        });
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Could not select file');
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setNewFile({
          ...newFile,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          uri: asset.uri,
          type: 'image',
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Could not select image');
    }
  };

  const handleUploadFile = () => {
    if (!newFile.name || !newFile.uri) {
      Alert.alert('Error', 'Please select a file');
      return;
    }

    const file: PatientFile = {
      id: `f${Date.now()}`,
      patientId: id as string,
      name: newFile.name,
      type: newFile.type,
      url: newFile.uri,
      uploadedBy: user?.name || '',
      uploadedAt: new Date().toISOString(),
      category: newFile.category,
      notes: newFile.notes || undefined,
    };

    addPatientFile(file);
    setShowUploadFile(false);
    setNewFile({
      name: '',
      category: 'report',
      notes: '',
      uri: '',
      type: 'document',
    });
    Alert.alert('Success', 'File uploaded successfully');
  };

  const lastVisit = visits[0];

  return (
    <>
      <Stack.Screen
        options={{
          title: `${patient.firstName} ${patient.lastName}`,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 12, marginRight: 8 }}>
              <TouchableOpacity 
                onPress={() => router.push(`/patients?edit=${patient.id}` as any)}
                style={{ padding: 8 }}
              >
                <Edit2 size={22} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  Alert.alert(
                    'Delete Patient',
                    `Do you really want to delete ${patient.firstName} ${patient.lastName}?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => {
                          router.back();
                          setTimeout(() => {
                            Alert.alert('Success', 'Patient deleted');
                          }, 100);
                        },
                      },
                    ]
                  );
                }}
                style={{ padding: 8 }}
              >
                <Trash2 size={22} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Card style={styles.patientInfoCard}>
          <View style={styles.patientHeader}>
            <View>
              <Text style={styles.patientName}>{patient.firstName} {patient.lastName}</Text>
              <Text style={styles.patientMRN}>MRN: {patient.mrn}</Text>
            </View>
            <Badge label={patient.status} variant="info" />
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Date of Birth</Text>
              <Text style={styles.infoValue}>{patient.dateOfBirth}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>
                {patient.gender === 'male' ? 'Male' : patient.gender === 'female' ? 'Female' : 'Other'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Blood Type</Text>
              <Text style={styles.infoValue}>{patient.bloodType || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Allergies</Text>
              <Text style={styles.infoValue}>
                {patient.allergies.length > 0 ? patient.allergies.join(', ') : 'None'}
              </Text>
            </View>
          </View>

          {lastVisit && (
            <View style={styles.lastVisitSection}>
              <Text style={styles.lastVisitTitle}>Last Visit</Text>
              <Text style={styles.lastVisitDate}>
                {lastVisit.date} at {lastVisit.time} • {lastVisit.doctorName}
              </Text>
              <Text style={styles.lastVisitDiagnosis}>{lastVisit.diagnosis}</Text>
            </View>
          )}
        </Card>

        {isDoctor && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowAddVisit(true)}
            >
              <FileText size={20} color="#007AFF" />
              <Text style={styles.actionButtonText}>Add Visit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowUploadFile(true)}
            >
              <Upload size={20} color="#007AFF" />
              <Text style={styles.actionButtonText}>Upload File</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Treatment History</Text>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContent}
          >
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === cat && styles.categoryChipTextActive,
                  ]}
                >
                  {cat === 'all' ? 'All' : 
                   cat === 'consultation' ? 'Consultation' :
                   cat === 'follow_up' ? 'Follow-up' :
                   cat === 'emergency' ? 'Emergency' : 'Procedure'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {filteredVisits.map((visit: PatientVisit) => (
            <Card key={visit.id} style={styles.visitCard}>
              <TouchableOpacity
                onPress={() => setExpandedVisit(expandedVisit === visit.id ? null : visit.id)}
              >
                <View style={styles.visitHeader}>
                  <View style={styles.visitInfo}>
                    <Text style={styles.visitDate}>
                      {visit.date} • {visit.time}
                    </Text>
                    <Text style={styles.visitDoctor}>{visit.doctorName}</Text>
                  </View>
                  <View style={styles.visitHeaderRight}>
                    <Badge 
                      label={
                        visit.category === 'consultation' ? 'Consultation' :
                        visit.category === 'follow_up' ? 'Follow-up' :
                        visit.category === 'emergency' ? 'Emergency' : 'Procedure'
                      } 
                      variant="info" 
                    />
                    {expandedVisit === visit.id ? (
                      <ChevronUp size={20} color="#8E8E93" />
                    ) : (
                      <ChevronDown size={20} color="#8E8E93" />
                    )}
                  </View>
                </View>
              </TouchableOpacity>

              {expandedVisit === visit.id && (
                <View style={styles.visitDetails}>
                  <View style={styles.visitDetailItem}>
                    <Text style={styles.visitDetailLabel}>Chief Complaint:</Text>
                    <Text style={styles.visitDetailText}>{visit.chiefComplaint}</Text>
                  </View>
                  <View style={styles.visitDetailItem}>
                    <Text style={styles.visitDetailLabel}>Diagnosis:</Text>
                    <Text style={styles.visitDetailText}>{visit.diagnosis}</Text>
                  </View>
                  <View style={styles.visitDetailItem}>
                    <Text style={styles.visitDetailLabel}>Treatment:</Text>
                    <Text style={styles.visitDetailText}>{visit.treatment}</Text>
                  </View>
                  {visit.prescriptions && visit.prescriptions.length > 0 && (
                    <View style={styles.visitDetailItem}>
                      <Text style={styles.visitDetailLabel}>Prescriptions:</Text>
                      {visit.prescriptions.map((p: string, i: number) => (
                        <Text key={i} style={styles.visitDetailText}>• {p}</Text>
                      ))}
                    </View>
                  )}
                  {visit.notes && (
                    <View style={styles.visitDetailItem}>
                      <Text style={styles.visitDetailLabel}>Notes:</Text>
                      <Text style={styles.visitDetailText}>{visit.notes}</Text>
                    </View>
                  )}
                </View>
              )}
            </Card>
          ))}

          {filteredVisits.length === 0 && (
            <Card style={styles.emptyCard}>
              <Calendar size={48} color="#8E8E93" />
              <Text style={styles.emptyText}>No visits found</Text>
            </Card>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Files & Documents</Text>
          
          {Object.entries(groupedFiles).map(([category, categoryFiles]) => {
            if (categoryFiles.length === 0) return null;
            
            return (
              <View key={category} style={styles.fileCategory}>
                <Text style={styles.fileCategoryTitle}>
                  {category === 'report' ? 'Reports' :
                   category === 'lab' ? 'Lab Results' :
                   category === 'imaging' ? 'Imaging' :
                   category === 'prescription' ? 'Prescriptions' : 'Other'}
                </Text>
                {categoryFiles.map(file => (
                  <Card key={file.id} style={styles.fileCard}>
                    <View style={styles.fileInfo}>
                      <FileImage size={24} color="#007AFF" />
                      <View style={styles.fileDetails}>
                        <Text style={styles.fileName}>{file.name}</Text>
                        <Text style={styles.fileMetadata}>
                          {file.uploadedAt.split('T')[0]} • {file.uploadedBy}
                        </Text>
                        {file.notes && (
                          <Text style={styles.fileNotes}>{file.notes}</Text>
                        )}
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            );
          })}

          {files.length === 0 && (
            <Card style={styles.emptyCard}>
              <FileText size={48} color="#8E8E93" />
              <Text style={styles.emptyText}>No files available</Text>
            </Card>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showAddVisit}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddVisit(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Visit</Text>
              <TouchableOpacity onPress={() => setShowAddVisit(false)}>
                <X size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Date *</Text>
                <TextInput
                  style={styles.input}
                  value={newVisit.date}
                  onChangeText={(text) => setNewVisit({ ...newVisit, date: text })}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Time *</Text>
                <TextInput
                  style={styles.input}
                  value={newVisit.time}
                  onChangeText={(text) => setNewVisit({ ...newVisit, time: text })}
                  placeholder="HH:MM"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryButtons}>
                  {(['consultation', 'follow_up', 'emergency', 'procedure'] as const).map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryButton,
                        newVisit.category === cat && styles.categoryButtonActive,
                      ]}
                onPress={() => setNewVisit({ ...newVisit, category: cat })}
                    >
                      <Text
                        style={[
                          styles.categoryButtonText,
                          newVisit.category === cat && styles.categoryButtonTextActive,
                        ]}
                      >
                        {cat === 'consultation' ? 'Consultation' :
                         cat === 'follow_up' ? 'Follow-up' :
                         cat === 'emergency' ? 'Emergency' : 'Procedure'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Chief Complaint *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newVisit.chiefComplaint}
                  onChangeText={(text) => setNewVisit({ ...newVisit, chiefComplaint: text })}
                  placeholder="Describe the chief complaint"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Diagnosis *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newVisit.diagnosis}
                  onChangeText={(text) => setNewVisit({ ...newVisit, diagnosis: text })}
                  placeholder="Enter diagnosis"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Treatment *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newVisit.treatment}
                  onChangeText={(text) => setNewVisit({ ...newVisit, treatment: text })}
                  placeholder="Describe treatment"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Prescriptions (comma separated)</Text>
                <TextInput
                  style={styles.input}
                  value={newVisit.prescriptions}
                  onChangeText={(text) => setNewVisit({ ...newVisit, prescriptions: text })}
                  placeholder="Medication 1, Medication 2"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newVisit.notes}
                  onChangeText={(text) => setNewVisit({ ...newVisit, notes: text })}
                  placeholder="Additional notes"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddVisit(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddVisit}
              >
                <Text style={styles.confirmButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showUploadFile}
        animationType="slide"
        transparent
        onRequestClose={() => setShowUploadFile(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload File</Text>
              <TouchableOpacity onPress={() => setShowUploadFile(false)}>
                <X size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.uploadButtons}>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handlePickDocument}
                >
                  <FileText size={24} color="#007AFF" />
                  <Text style={styles.uploadButtonText}>Choose Document</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handlePickImage}
                >
                  <FileImage size={24} color="#007AFF" />
                  <Text style={styles.uploadButtonText}>Choose Image</Text>
                </TouchableOpacity>
              </View>

              {newFile.uri && (
                <View style={styles.selectedFilePreview}>
                  <Text style={styles.selectedFileName}>{newFile.name}</Text>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryButtons}>
                  {fileCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryButton,
                        newFile.category === cat && styles.categoryButtonActive,
                      ]}
                      onPress={() => setNewFile({ ...newFile, category: cat })}
                    >
                      <Text
                        style={[
                          styles.categoryButtonText,
                          newFile.category === cat && styles.categoryButtonTextActive,
                        ]}
                      >
                        {cat === 'report' ? 'Report' :
                         cat === 'lab' ? 'Lab' :
                         cat === 'imaging' ? 'Imaging' :
                         cat === 'prescription' ? 'Prescription' : 'Other'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newFile.notes}
                  onChangeText={(text) => setNewFile({ ...newFile, notes: text })}
                  placeholder="Additional information"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowUploadFile(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleUploadFile}
              >
                <Text style={styles.confirmButtonText}>Upload</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    padding: 16,
  },
  backButton: {
    marginLeft: 8,
    padding: 8,
  },
  patientInfoCard: {
    marginBottom: 16,
    padding: 16,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  patientName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#000000',
    marginBottom: 2,
  },
  patientMRN: {
    fontSize: 13,
    color: '#8E8E93',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
    minWidth: '47%',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#000000',
  },
  lastVisitSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  lastVisitTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#8E8E93',
    marginBottom: 4,
  },
  lastVisitDate: {
    fontSize: 13,
    color: '#000000',
    marginBottom: 2,
  },
  lastVisitDiagnosis: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#000000',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#000000',
    marginBottom: 12,
  },
  categoryScroll: {
    maxHeight: 50,
    marginBottom: 12,
  },
  categoryContent: {
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  categoryChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#3C3C43',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  visitCard: {
    marginBottom: 12,
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visitInfo: {
    flex: 1,
  },
  visitDate: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#000000',
    marginBottom: 2,
  },
  visitDoctor: {
    fontSize: 13,
    color: '#8E8E93',
  },
  visitHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  visitDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  visitDetailItem: {
    marginBottom: 12,
  },
  visitDetailLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#8E8E93',
    marginBottom: 4,
  },
  visitDetailText: {
    fontSize: 15,
    color: '#000000',
    lineHeight: 20,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
  },
  fileCategory: {
    marginBottom: 16,
  },
  fileCategoryTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000000',
    marginBottom: 8,
  },
  fileCard: {
    marginBottom: 8,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#000000',
    marginBottom: 2,
  },
  fileMetadata: {
    fontSize: 13,
    color: '#8E8E93',
  },
  fileNotes: {
    fontSize: 13,
    color: '#3C3C43',
    marginTop: 4,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flex: 1,
    minWidth: '47%',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#000000',
  },
  categoryButtonTextActive: {
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
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
  },
  uploadButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#007AFF',
  },
  selectedFilePreview: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#E5F3FF',
    borderRadius: 12,
  },
  selectedFileName: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500' as const,
  },
});
