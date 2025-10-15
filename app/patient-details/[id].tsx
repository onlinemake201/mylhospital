import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, Image } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, FileText, Upload, Calendar, FileImage, ChevronDown, ChevronUp, X, Trash2 } from 'lucide-react-native';
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
    uri: string | undefined;
    type: 'document' | 'image';
  }>({
    name: '',
    category: 'report',
    notes: '',
    uri: undefined,
    type: 'document' as const,
  });

  const isDoctor = user?.role === 'doctor' || user?.role === 'superadmin';

  if (!patient) {
    return (
      <View style={styles.container}>
        <Text>Patient nicht gefunden</Text>
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
      Alert.alert('Fehler', 'Bitte alle Pflichtfelder ausfüllen');
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
    Alert.alert('Erfolg', 'Besuch erfolgreich hinzugefügt');
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
      Alert.alert('Fehler', 'Datei konnte nicht ausgewählt werden');
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
          type: 'image' as const,
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Fehler', 'Bild konnte nicht ausgewählt werden');
    }
  };

  const handleUploadFile = () => {
    if (!newFile.name || !newFile.uri) {
      Alert.alert('Fehler', 'Bitte eine Datei auswählen');
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
      uri: undefined,
      type: 'document',
    });
    Alert.alert('Erfolg', 'Datei erfolgreich hochgeladen');
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
              <Text style={styles.infoLabel}>Geburtsdatum</Text>
              <Text style={styles.infoValue}>{patient.dateOfBirth}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Geschlecht</Text>
              <Text style={styles.infoValue}>
                {patient.gender === 'male' ? 'Männlich' : patient.gender === 'female' ? 'Weiblich' : 'Divers'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Blutgruppe</Text>
              <Text style={styles.infoValue}>{patient.bloodType || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Allergien</Text>
              <Text style={styles.infoValue}>
                {patient.allergies.length > 0 ? patient.allergies.join(', ') : 'Keine'}
              </Text>
            </View>
          </View>

          {lastVisit && (
            <View style={styles.lastVisitSection}>
              <Text style={styles.lastVisitTitle}>Letzter Besuch</Text>
              <Text style={styles.lastVisitDate}>
                {lastVisit.date} um {lastVisit.time} • {lastVisit.doctorName}
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
              <Text style={styles.actionButtonText}>Besuch hinzufügen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowUploadFile(true)}
            >
              <Upload size={20} color="#007AFF" />
              <Text style={styles.actionButtonText}>Datei hochladen</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Behandlungsverlauf</Text>
          
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
                  {cat === 'all' ? 'Alle' : 
                   cat === 'consultation' ? 'Konsultation' :
                   cat === 'follow_up' ? 'Nachsorge' :
                   cat === 'emergency' ? 'Notfall' : 'Eingriff'}
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
                        visit.category === 'consultation' ? 'Konsultation' :
                        visit.category === 'follow_up' ? 'Nachsorge' :
                        visit.category === 'emergency' ? 'Notfall' : 'Eingriff'
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
                    <Text style={styles.visitDetailLabel}>Beschwerde:</Text>
                    <Text style={styles.visitDetailText}>{visit.chiefComplaint}</Text>
                  </View>
                  <View style={styles.visitDetailItem}>
                    <Text style={styles.visitDetailLabel}>Diagnose:</Text>
                    <Text style={styles.visitDetailText}>{visit.diagnosis}</Text>
                  </View>
                  <View style={styles.visitDetailItem}>
                    <Text style={styles.visitDetailLabel}>Behandlung:</Text>
                    <Text style={styles.visitDetailText}>{visit.treatment}</Text>
                  </View>
                  {visit.prescriptions && visit.prescriptions.length > 0 && (
                    <View style={styles.visitDetailItem}>
                      <Text style={styles.visitDetailLabel}>Verschreibungen:</Text>
                      {visit.prescriptions.map((p: string, i: number) => (
                        <Text key={i} style={styles.visitDetailText}>• {p}</Text>
                      ))}
                    </View>
                  )}
                  {visit.notes && (
                    <View style={styles.visitDetailItem}>
                      <Text style={styles.visitDetailLabel}>Notizen:</Text>
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
              <Text style={styles.emptyText}>Keine Besuche gefunden</Text>
            </Card>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dateien & Dokumente</Text>
          
          {Object.entries(groupedFiles).map(([category, categoryFiles]) => {
            if (categoryFiles.length === 0) return null;
            
            return (
              <View key={category} style={styles.fileCategory}>
                <Text style={styles.fileCategoryTitle}>
                  {category === 'report' ? 'Berichte' :
                   category === 'lab' ? 'Laborbefunde' :
                   category === 'imaging' ? 'Bildgebung' :
                   category === 'prescription' ? 'Rezepte' : 'Sonstiges'}
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
              <Text style={styles.emptyText}>Keine Dateien vorhanden</Text>
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
              <Text style={styles.modalTitle}>Besuch hinzufügen</Text>
              <TouchableOpacity onPress={() => setShowAddVisit(false)}>
                <X size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Datum *</Text>
                <TextInput
                  style={styles.input}
                  value={newVisit.date}
                  onChangeText={(text) => setNewVisit({ ...newVisit, date: text })}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Zeit *</Text>
                <TextInput
                  style={styles.input}
                  value={newVisit.time}
                  onChangeText={(text) => setNewVisit({ ...newVisit, time: text })}
                  placeholder="HH:MM"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Kategorie</Text>
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
                        {cat === 'consultation' ? 'Konsultation' :
                         cat === 'follow_up' ? 'Nachsorge' :
                         cat === 'emergency' ? 'Notfall' : 'Eingriff'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Hauptbeschwerde *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newVisit.chiefComplaint}
                  onChangeText={(text) => setNewVisit({ ...newVisit, chiefComplaint: text })}
                  placeholder="Beschreiben Sie die Hauptbeschwerde"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Diagnose *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newVisit.diagnosis}
                  onChangeText={(text) => setNewVisit({ ...newVisit, diagnosis: text })}
                  placeholder="Diagnose eingeben"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Behandlung *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newVisit.treatment}
                  onChangeText={(text) => setNewVisit({ ...newVisit, treatment: text })}
                  placeholder="Behandlung beschreiben"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Verschreibungen (kommagetrennt)</Text>
                <TextInput
                  style={styles.input}
                  value={newVisit.prescriptions}
                  onChangeText={(text) => setNewVisit({ ...newVisit, prescriptions: text })}
                  placeholder="Medikament 1, Medikament 2"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Notizen</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newVisit.notes}
                  onChangeText={(text) => setNewVisit({ ...newVisit, notes: text })}
                  placeholder="Zusätzliche Notizen"
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
                <Text style={styles.cancelButtonText}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddVisit}
              >
                <Text style={styles.confirmButtonText}>Hinzufügen</Text>
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
              <Text style={styles.modalTitle}>Datei hochladen</Text>
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
                  <Text style={styles.uploadButtonText}>Dokument wählen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handlePickImage}
                >
                  <FileImage size={24} color="#007AFF" />
                  <Text style={styles.uploadButtonText}>Bild wählen</Text>
                </TouchableOpacity>
              </View>

              {newFile.uri && (
                <View style={styles.selectedFilePreview}>
                  {newFile.type === 'image' ? (
                    <View style={styles.imagePreviewContainer}>
                      <Image source={{ uri: newFile.uri }} style={styles.imagePreview} resizeMode="cover" />
                      <View style={styles.imagePreviewOverlay}>
                        <Text style={styles.selectedFileName}>{newFile.name}</Text>
                        <View style={styles.imageActions}>
                          <TouchableOpacity
                            style={styles.replaceButton}
                            onPress={handlePickImage}
                          >
                            <Upload size={16} color="#007AFF" />
                            <Text style={styles.replaceButtonText}>Ersetzen</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteFileButton}
                            onPress={() => setNewFile({
                              name: '',
                              category: 'report',
                              notes: '',
                              uri: undefined,
                              type: 'document',
                            })}
                          >
                            <Trash2 size={16} color="#FF3B30" />
                            <Text style={styles.deleteFileButtonText}>Löschen</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.documentPreview}>
                      <FileText size={24} color="#007AFF" />
                      <Text style={styles.selectedFileName}>{newFile.name}</Text>
                      <View style={styles.documentActions}>
                        <TouchableOpacity
                          style={styles.replaceButton}
                          onPress={handlePickDocument}
                        >
                          <Upload size={16} color="#007AFF" />
                          <Text style={styles.replaceButtonText}>Ersetzen</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteFileButton}
                          onPress={() => setNewFile({
                            name: '',
                            category: 'report',
                            notes: '',
                            uri: undefined,
                            type: 'document',
                          })}
                        >
                          <Trash2 size={16} color="#FF3B30" />
                          <Text style={styles.deleteFileButtonText}>Löschen</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>Kategorie</Text>
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
                        {cat === 'report' ? 'Bericht' :
                         cat === 'lab' ? 'Labor' :
                         cat === 'imaging' ? 'Bildgebung' :
                         cat === 'prescription' ? 'Rezept' : 'Sonstiges'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Notizen</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newFile.notes}
                  onChangeText={(text) => setNewFile({ ...newFile, notes: text })}
                  placeholder="Zusätzliche Informationen"
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
                <Text style={styles.cancelButtonText}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleUploadFile}
              >
                <Text style={styles.confirmButtonText}>Hochladen</Text>
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
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  patientName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#000000',
    marginBottom: 4,
  },
  patientMRN: {
    fontSize: 14,
    color: '#8E8E93',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    minWidth: '47%',
  },
  infoLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#000000',
  },
  lastVisitSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  lastVisitTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#8E8E93',
    marginBottom: 8,
  },
  lastVisitDate: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 4,
  },
  lastVisitDiagnosis: {
    fontSize: 15,
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
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
  },
  imagePreviewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
  },
  selectedFileName: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500' as const,
    marginBottom: 8,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  documentPreview: {
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  documentActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  replaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E5F3FF',
    borderRadius: 8,
  },
  replaceButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  deleteFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
  },
  deleteFileButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FF3B30',
  },
});
