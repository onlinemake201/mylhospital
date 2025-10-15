import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Pill, Clock, User, Plus, X, Edit2, Trash2, FileText } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useHospital } from '@/contexts/HospitalContext';
import { Medication, MedicationRegistry } from '@/types';

type TabType = 'registry' | 'assignment' | 'billing';

export default function MedicationsScreen() {
  const { 
    medications, 
    medicationRegistry, 
    patients, 
    addMedication, 
    updateMedication, 
    deleteMedication,
    addMedicationRegistry,
    updateMedicationRegistry,
    deleteMedicationRegistry,
    addInvoice,
  } = useHospital();
  
  const [activeTab, setActiveTab] = useState<TabType>('registry');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMedication, setEditingMedication] = useState<MedicationRegistry | null>(null);
  const [selectedMedication, setSelectedMedication] = useState<MedicationRegistry | null>(null);
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    route: 'oral' as MedicationRegistry['route'],
    unitPrice: '',
    stockQuantity: '',
    reorderLevel: '',
  });
  const [assignmentData, setAssignmentData] = useState({
    patientId: '',
    medicationId: '',
    frequency: '',
    instructions: '',
  });
  const [billingData, setBillingData] = useState({
    patientId: '',
    selectedMedications: [] as string[],
  });

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown';
  };

  const getRouteColor = (route: MedicationRegistry['route']) => {
    switch (route) {
      case 'oral':
        return '#007AFF';
      case 'iv':
        return '#FF3B30';
      case 'im':
        return '#FF9500';
      case 'topical':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  };

  const getStockStatus = (med: MedicationRegistry): MedicationRegistry['status'] => {
    if (med.stockQuantity === 0) return 'out_of_stock';
    if (med.stockQuantity <= med.reorderLevel) return 'low_stock';
    return 'available';
  };

  const handleRegisterMedication = () => {
    if (!newMedication.name || !newMedication.dosage || !newMedication.unitPrice || !newMedication.stockQuantity) {
      Alert.alert('Fehler', 'Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    const unitPrice = parseFloat(newMedication.unitPrice);
    const stockQuantity = parseInt(newMedication.stockQuantity);
    const reorderLevel = parseInt(newMedication.reorderLevel) || 100;

    if (isNaN(unitPrice) || isNaN(stockQuantity)) {
      Alert.alert('Fehler', 'Preis und Menge müssen Zahlen sein');
      return;
    }

    const status = stockQuantity === 0 ? 'out_of_stock' : stockQuantity <= reorderLevel ? 'low_stock' : 'available';

    if (editingMedication) {
      updateMedicationRegistry(editingMedication.id, {
        name: newMedication.name,
        dosage: newMedication.dosage,
        route: newMedication.route,
        unitPrice,
        stockQuantity,
        reorderLevel,
        status,
      });
      Alert.alert('Erfolg', 'Medikament aktualisiert');
    } else {
      const newMed: MedicationRegistry = {
        id: `med${Date.now()}`,
        name: newMedication.name,
        dosage: newMedication.dosage,
        route: newMedication.route,
        unitPrice,
        stockQuantity,
        reorderLevel,
        status,
      };
      addMedicationRegistry(newMed);
      Alert.alert('Erfolg', 'Medikament registriert');
    }

    setShowCreateModal(false);
    setEditingMedication(null);
    setNewMedication({
      name: '',
      dosage: '',
      route: 'oral',
      unitPrice: '',
      stockQuantity: '',
      reorderLevel: '',
    });
  };

  const handleAssignMedication = () => {
    if (!assignmentData.patientId || !assignmentData.medicationId || !assignmentData.frequency) {
      Alert.alert('Fehler', 'Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    const med = medicationRegistry.find(m => m.id === assignmentData.medicationId);
    if (!med) {
      Alert.alert('Fehler', 'Medikament nicht gefunden');
      return;
    }

    if (med.stockQuantity === 0) {
      Alert.alert('Fehler', 'Medikament nicht auf Lager');
      return;
    }

    const medication: Medication = {
      id: `m${Date.now()}`,
      patientId: assignmentData.patientId,
      name: med.name,
      dosage: med.dosage,
      frequency: assignmentData.frequency,
      route: med.route,
      startDate: new Date().toISOString(),
      prescribedBy: 'Current User',
      status: 'active',
      instructions: assignmentData.instructions || undefined,
    };

    addMedication(medication);
    
    updateMedicationRegistry(med.id, {
      stockQuantity: med.stockQuantity - 1,
      status: getStockStatus({ ...med, stockQuantity: med.stockQuantity - 1 }),
    });

    setAssignmentData({
      patientId: '',
      medicationId: '',
      frequency: '',
      instructions: '',
    });
    Alert.alert('Erfolg', 'Medikament zugewiesen und Lagerbestand aktualisiert');
  };

  const handleCreateInvoice = () => {
    if (!billingData.patientId || billingData.selectedMedications.length === 0) {
      Alert.alert('Fehler', 'Bitte Patient und Medikamente auswählen');
      return;
    }

    const patient = patients.find(p => p.id === billingData.patientId);
    if (!patient) return;

    const items = billingData.selectedMedications.map(medId => {
      const med = medications.find(m => m.id === medId);
      const regMed = medicationRegistry.find(rm => rm.name === med?.name && rm.dosage === med?.dosage);
      if (!med || !regMed) return null;

      const quantity = 1;
      const unitPrice = regMed.unitPrice;
      const total = unitPrice * quantity;

      return {
        id: `item-${Date.now()}-${medId}`,
        description: `${med.name} - ${med.dosage}`,
        code: regMed.id,
        quantity,
        unitPrice,
        total,
        medicationId: medId,
      };
    }).filter(Boolean) as any[];

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.19;
    const total = subtotal + tax;

    const invoice = {
      id: `inv-${Date.now()}`,
      patientId: billingData.patientId,
      patientName: `${patient.firstName} ${patient.lastName}`,
      date: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      items,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      status: 'draft' as const,
      type: 'medication' as const,
    };

    addInvoice(invoice);
    setBillingData({
      patientId: '',
      selectedMedications: [],
    });
    Alert.alert('Erfolg', 'Rechnung erstellt und in Rechnungen gespeichert');
  };

  const handleDeleteMedication = (med: MedicationRegistry) => {
    Alert.alert(
      'Medikament löschen',
      `Möchten Sie ${med.name} wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => {
            deleteMedicationRegistry(med.id);
            setSelectedMedication(null);
            Alert.alert('Erfolg', 'Medikament gelöscht');
          },
        },
      ]
    );
  };

  const renderRegistryTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentPadding}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Medikamenten-Register</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={20} color="#007AFF" />
          <Text style={styles.addButtonText}>Registrieren</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.resultCount}>
        {medicationRegistry.length} {medicationRegistry.length === 1 ? 'Medikament' : 'Medikamente'}
      </Text>

      {medicationRegistry.map(med => {
        const status = getStockStatus(med);
        return (
          <TouchableOpacity
            key={med.id}
            onPress={() => setSelectedMedication(selectedMedication?.id === med.id ? null : med)}
            activeOpacity={0.7}
          >
            <Card style={[styles.medicationCard, selectedMedication?.id === med.id && styles.medicationCardSelected]}>
              <View style={styles.registryHeader}>
                <View style={styles.medicationInfo}>
                  <View style={[styles.routeIndicator, { backgroundColor: getRouteColor(med.route) }]}>
                    <Pill size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.nameContainer}>
                    <Text style={styles.medicationName}>{med.name}</Text>
                    <Text style={styles.dosage}>{med.dosage}</Text>
                  </View>
                </View>
                <View style={[styles.routeBadge, { backgroundColor: getRouteColor(med.route) + '20' }]}>
                  <Text style={[styles.routeText, { color: getRouteColor(med.route) }]}>
                    {med.route.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.stockInfo}>
                <View style={styles.stockRow}>
                  <Text style={styles.stockLabel}>Lagerbestand:</Text>
                  <Text style={[
                    styles.stockValue,
                    status === 'out_of_stock' && styles.stockOutOfStock,
                    status === 'low_stock' && styles.stockLowStock,
                  ]}>
                    {med.stockQuantity} Stück
                  </Text>
                </View>
                <View style={styles.stockRow}>
                  <Text style={styles.stockLabel}>Preis:</Text>
                  <Text style={styles.priceValue}>€{med.unitPrice.toFixed(2)}</Text>
                </View>
                <View style={styles.stockRow}>
                  <Text style={styles.stockLabel}>Status:</Text>
                  <Badge 
                    label={status === 'available' ? 'Verfügbar' : status === 'low_stock' ? 'Niedrig' : 'Ausverkauft'} 
                    variant={status === 'available' ? 'success' : status === 'low_stock' ? 'warning' : 'danger'} 
                  />
                </View>
              </View>

              {selectedMedication?.id === med.id && (
                <View style={styles.medicationActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                      setEditingMedication(med);
                      setNewMedication({
                        name: med.name,
                        dosage: med.dosage,
                        route: med.route,
                        unitPrice: med.unitPrice.toString(),
                        stockQuantity: med.stockQuantity.toString(),
                        reorderLevel: med.reorderLevel.toString(),
                      });
                      setShowCreateModal(true);
                      setSelectedMedication(null);
                    }}
                  >
                    <Edit2 size={16} color="#007AFF" />
                    <Text style={styles.editButtonText}>Bearbeiten</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteMedication(med)}
                  >
                    <Trash2 size={16} color="#FF3B30" />
                    <Text style={styles.deleteButtonText}>Löschen</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Card>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderAssignmentTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentPadding}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Medikament zuweisen</Text>
      </View>

      <Card style={styles.formCard}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Patient auswählen *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {patients.map(patient => (
              <TouchableOpacity
                key={patient.id}
                style={[
                  styles.patientChip,
                  assignmentData.patientId === patient.id && styles.patientChipActive,
                ]}
                onPress={() => setAssignmentData({ ...assignmentData, patientId: patient.id })}
              >
                <Text
                  style={[
                    styles.patientChipText,
                    assignmentData.patientId === patient.id && styles.patientChipTextActive,
                  ]}
                >
                  {patient.firstName} {patient.lastName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Medikament aus Register *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {medicationRegistry.filter(m => m.stockQuantity > 0).map(med => (
              <TouchableOpacity
                key={med.id}
                style={[
                  styles.medChip,
                  assignmentData.medicationId === med.id && styles.medChipActive,
                ]}
                onPress={() => setAssignmentData({ ...assignmentData, medicationId: med.id })}
              >
                <Text
                  style={[
                    styles.medChipText,
                    assignmentData.medicationId === med.id && styles.medChipTextActive,
                  ]}
                >
                  {med.name} {med.dosage} (€{med.unitPrice.toFixed(2)})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Häufigkeit *</Text>
          <TextInput
            style={styles.input}
            value={assignmentData.frequency}
            onChangeText={(text) => setAssignmentData({ ...assignmentData, frequency: text })}
            placeholder="z.B. 2x täglich"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Anweisungen</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={assignmentData.instructions}
            onChangeText={(text) => setAssignmentData({ ...assignmentData, instructions: text })}
            placeholder="Besondere Anweisungen..."
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity
          style={styles.assignButton}
          onPress={handleAssignMedication}
        >
          <Text style={styles.assignButtonText}>Medikament zuweisen</Text>
        </TouchableOpacity>
      </Card>

      <View style={styles.assignedSection}>
        <Text style={styles.sectionTitle}>Zugewiesene Medikamente</Text>
        <Text style={styles.resultCount}>
          {medications.filter(m => m.status === 'active').length} aktive Medikamente
        </Text>

        {medications.filter(m => m.status === 'active').map(medication => (
          <Card key={medication.id} style={styles.medicationCard}>
            <View style={styles.header}>
              <View style={styles.medicationInfo}>
                <View style={[styles.routeIndicator, { backgroundColor: getRouteColor(medication.route) }]}>
                  <Pill size={20} color="#FFFFFF" />
                </View>
                <View style={styles.nameContainer}>
                  <Text style={styles.medicationName}>{medication.name}</Text>
                  <Text style={styles.dosage}>{medication.dosage}</Text>
                </View>
              </View>
              <Badge label={medication.status} variant="success" />
            </View>

            <View style={styles.patientInfo}>
              <User size={16} color="#8E8E93" />
              <Text style={styles.patientName}>{getPatientName(medication.patientId)}</Text>
            </View>

            <View style={styles.details}>
              <View style={styles.detailRow}>
                <Clock size={16} color="#8E8E93" />
                <Text style={styles.detailText}>{medication.frequency}</Text>
              </View>
            </View>
          </Card>
        ))}
      </View>
    </ScrollView>
  );

  const renderBillingTab = () => {
    const patientMedications = billingData.patientId
      ? medications.filter(m => m.patientId === billingData.patientId && m.status === 'active')
      : [];

    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentPadding}>
        <View style={styles.tabHeader}>
          <Text style={styles.tabTitle}>Rechnung erstellen</Text>
        </View>

        <Card style={styles.formCard}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Patient auswählen *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {patients.map(patient => (
                <TouchableOpacity
                  key={patient.id}
                  style={[
                    styles.patientChip,
                    billingData.patientId === patient.id && styles.patientChipActive,
                  ]}
                  onPress={() => {
                    setBillingData({ patientId: patient.id, selectedMedications: [] });
                  }}
                >
                  <Text
                    style={[
                      styles.patientChipText,
                      billingData.patientId === patient.id && styles.patientChipTextActive,
                    ]}
                  >
                    {patient.firstName} {patient.lastName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {billingData.patientId && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Medikamente auswählen *</Text>
              {patientMedications.length > 0 ? (
                patientMedications.map(med => {
                  const regMed = medicationRegistry.find(rm => rm.name === med.name && rm.dosage === med.dosage);
                  return (
                    <TouchableOpacity
                      key={med.id}
                      style={[
                        styles.medicationItem,
                        billingData.selectedMedications.includes(med.id) && styles.medicationItemActive,
                      ]}
                      onPress={() => {
                        setBillingData(prev => ({
                          ...prev,
                          selectedMedications: prev.selectedMedications.includes(med.id)
                            ? prev.selectedMedications.filter(id => id !== med.id)
                            : [...prev.selectedMedications, med.id],
                        }));
                      }}
                    >
                      <View style={styles.medicationInfo}>
                        <Text style={styles.medicationName}>{med.name}</Text>
                        <Text style={styles.medicationDosage}>
                          {med.dosage} {regMed ? `- €${regMed.unitPrice.toFixed(2)}` : ''}
                        </Text>
                      </View>
                      {billingData.selectedMedications.includes(med.id) && (
                        <View style={styles.checkmark}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={styles.noMedicationsText}>
                  Keine aktiven Medikamente für diesen Patienten
                </Text>
              )}
            </View>
          )}

          {billingData.selectedMedications.length > 0 && (
            <View style={styles.billingInfo}>
              <View style={styles.billingRow}>
                <Text style={styles.billingLabel}>Ausgewählte Medikamente:</Text>
                <Text style={styles.billingValue}>{billingData.selectedMedications.length}</Text>
              </View>
              <View style={styles.billingRow}>
                <Text style={styles.billingLabel}>Geschätzter Gesamtpreis:</Text>
                <Text style={styles.billingValue}>
                  €{billingData.selectedMedications.reduce((sum, medId) => {
                    const med = medications.find(m => m.id === medId);
                    const regMed = medicationRegistry.find(rm => rm.name === med?.name && rm.dosage === med?.dosage);
                    return sum + (regMed?.unitPrice || 0);
                  }, 0).toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.createInvoiceButton}
                onPress={handleCreateInvoice}
              >
                <FileText size={20} color="#FFFFFF" />
                <Text style={styles.createInvoiceButtonText}>Rechnung erstellen</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>
      </ScrollView>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Medikamente',
          headerLargeTitle: true,
        }}
      />
      <View style={styles.container}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'registry' && styles.tabActive]}
            onPress={() => setActiveTab('registry')}
          >
            <Text style={[styles.tabText, activeTab === 'registry' && styles.tabTextActive]}>
              Register
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'assignment' && styles.tabActive]}
            onPress={() => setActiveTab('assignment')}
          >
            <Text style={[styles.tabText, activeTab === 'assignment' && styles.tabTextActive]}>
              Zuweisung
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'billing' && styles.tabActive]}
            onPress={() => setActiveTab('billing')}
          >
            <Text style={[styles.tabText, activeTab === 'billing' && styles.tabTextActive]}>
              Rechnung
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'registry' && renderRegistryTab()}
        {activeTab === 'assignment' && renderAssignmentTab()}
        {activeTab === 'billing' && renderBillingTab()}

        <Modal
          visible={showCreateModal}
          animationType="slide"
          transparent
          onRequestClose={() => {
            setShowCreateModal(false);
            setEditingMedication(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingMedication ? 'Medikament bearbeiten' : 'Medikament registrieren'}</Text>
                <TouchableOpacity onPress={() => {
                  setShowCreateModal(false);
                  setEditingMedication(null);
                }}>
                  <X size={24} color="#8E8E93" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Medikamentenname *</Text>
                  <TextInput
                    style={styles.input}
                    value={newMedication.name}
                    onChangeText={(text) => setNewMedication({ ...newMedication, name: text })}
                    placeholder="z.B. Aspirin"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Dosierung *</Text>
                  <TextInput
                    style={styles.input}
                    value={newMedication.dosage}
                    onChangeText={(text) => setNewMedication({ ...newMedication, dosage: text })}
                    placeholder="z.B. 100mg"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Preis pro Einheit (€) *</Text>
                  <TextInput
                    style={styles.input}
                    value={newMedication.unitPrice}
                    onChangeText={(text) => setNewMedication({ ...newMedication, unitPrice: text })}
                    placeholder="z.B. 5.50"
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Lagerbestand (Stück) *</Text>
                  <TextInput
                    style={styles.input}
                    value={newMedication.stockQuantity}
                    onChangeText={(text) => setNewMedication({ ...newMedication, stockQuantity: text })}
                    placeholder="z.B. 500"
                    keyboardType="number-pad"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Mindestbestand (Stück)</Text>
                  <TextInput
                    style={styles.input}
                    value={newMedication.reorderLevel}
                    onChangeText={(text) => setNewMedication({ ...newMedication, reorderLevel: text })}
                    placeholder="z.B. 100"
                    keyboardType="number-pad"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Verabreichungsweg</Text>
                  <View style={styles.routeButtons}>
                    {(['oral', 'iv', 'im', 'topical', 'other'] as const).map((route) => (
                      <TouchableOpacity
                        key={route}
                        style={[
                          styles.routeButton,
                          newMedication.route === route && styles.routeButtonActive,
                        ]}
                        onPress={() => setNewMedication({ ...newMedication, route })}
                      >
                        <Text
                          style={[
                            styles.routeButtonText,
                            newMedication.route === route && styles.routeButtonTextActive,
                          ]}
                        >
                          {route.toUpperCase()}
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
                    setEditingMedication(null);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Abbrechen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleRegisterMedication}
                >
                  <Text style={styles.confirmButtonText}>{editingMedication ? 'Aktualisieren' : 'Registrieren'}</Text>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#007AFF',
  },
  tabContent: {
    flex: 1,
  },
  tabContentPadding: {
    padding: 16,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#000000',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E5F3FF',
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  resultCount: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  medicationCard: {
    marginBottom: 12,
  },
  medicationCardSelected: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  registryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  medicationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  routeIndicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nameContainer: {
    flex: 1,
  },
  medicationName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#000000',
    marginBottom: 2,
  },
  dosage: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500' as const,
  },
  routeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  routeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  stockInfo: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  stockValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#34C759',
  },
  stockOutOfStock: {
    color: '#FF3B30',
  },
  stockLowStock: {
    color: '#FF9500',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  medicationActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#E5F3FF',
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FF3B30',
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  patientName: {
    fontSize: 15,
    color: '#3C3C43',
    fontWeight: '500' as const,
  },
  details: {
    flexDirection: 'row',
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#3C3C43',
  },
  formCard: {
    marginBottom: 24,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
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
  patientChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  patientChipActive: {
    backgroundColor: '#007AFF',
  },
  patientChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#000000',
  },
  patientChipTextActive: {
    color: '#FFFFFF',
  },
  medChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  medChipActive: {
    backgroundColor: '#34C759',
  },
  medChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#000000',
  },
  medChipTextActive: {
    color: '#FFFFFF',
  },
  assignButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  assignButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  assignedSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#000000',
    marginBottom: 12,
  },
  medicationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    marginBottom: 8,
  },
  medicationItemActive: {
    backgroundColor: '#E5F3FF',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  medicationDosage: {
    fontSize: 14,
    color: '#8E8E93',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  noMedicationsText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 20,
  },
  billingInfo: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  billingLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#000000',
  },
  billingValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#007AFF',
  },
  createInvoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#34C759',
    paddingVertical: 16,
    borderRadius: 12,
  },
  createInvoiceButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  routeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  routeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
  },
  routeButtonActive: {
    backgroundColor: '#007AFF',
  },
  routeButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#000000',
  },
  routeButtonTextActive: {
    color: '#FFFFFF',
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
    maxHeight: 400,
    padding: 20,
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
});
