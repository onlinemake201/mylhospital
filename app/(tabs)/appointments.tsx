import React, { useState, useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Calendar, Clock, MapPin, Plus, X, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useHospital } from '@/contexts/HospitalContext';
import { Appointment, Patient } from '@/types';

type ViewMode = 'day' | 'week' | 'month';

export default function AppointmentsScreen() {
  const { appointments, patients, addAppointment, updateAppointment, deleteAppointment, addPatient } = useHospital();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [newAppointment, setNewAppointment] = useState({
    patientId: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    duration: 30,
    type: 'consultation' as Appointment['type'],
    status: 'scheduled' as Appointment['status'],
    room: '',
    notes: '',
  });
  const [newPatient, setNewPatient] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    bloodType: '',
    contactNumber: '',
    allergies: '',
    status: 'outpatient' as Patient['status'],
  });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
    
    const days: (Date | null)[] = [];
    for (let i = 0; i < adjustedStartDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getWeekDays = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date);
    monday.setDate(diff);
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setSelectedDate(newDate);
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => apt.date === dateStr);
  };

  const getDateRangeText = () => {
    if (viewMode === 'day') {
      return selectedDate.toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } else if (viewMode === 'week') {
      const weekDays = getWeekDays(selectedDate);
      const start = weekDays[0].toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
      const end = weekDays[6].toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
      return `${start} - ${end}`;
    } else {
      return selectedDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    }
  };

  const filteredAppointments = useMemo(() => {
    if (viewMode === 'day') {
      return getAppointmentsForDate(selectedDate);
    } else if (viewMode === 'week') {
      const weekDays = getWeekDays(selectedDate);
      const startDate = weekDays[0].toISOString().split('T')[0];
      const endDate = weekDays[6].toISOString().split('T')[0];
      return appointments.filter(apt => apt.date >= startDate && apt.date <= endDate);
    } else {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
      return appointments.filter(apt => apt.date >= startDate && apt.date <= endDate);
    }
  }, [appointments, selectedDate, viewMode]);

  const getStatusVariant = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'scheduled':
        return 'info';
      case 'in_progress':
        return 'warning';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getTypeColor = (type: Appointment['type']) => {
    switch (type) {
      case 'consultation':
        return '#007AFF';
      case 'follow_up':
        return '#34C759';
      case 'procedure':
        return '#FF9500';
      case 'emergency':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const handleCreateAppointment = () => {
    console.log('Creating appointment with data:', newAppointment);
    console.log('Available patients:', patients.length);
    
    if (!newAppointment.patientId || !newAppointment.date || !newAppointment.time) {
      Alert.alert('Fehler', 'Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    const patient = patients.find(p => p.id === newAppointment.patientId);
    console.log('Found patient:', patient);
    
    if (!patient) {
      Alert.alert('Fehler', 'Patient nicht gefunden');
      return;
    }

    if (editingAppointment) {
      updateAppointment(editingAppointment.id, {
        patientId: newAppointment.patientId,
        patientName: `${patient.firstName} ${patient.lastName}`,
        date: newAppointment.date,
        time: newAppointment.time,
        duration: newAppointment.duration,
        type: newAppointment.type,
        status: newAppointment.status,
        room: newAppointment.room || undefined,
        notes: newAppointment.notes || undefined,
      });
      Alert.alert('Erfolg', 'Termin erfolgreich aktualisiert');
    } else {
      const appointment: Appointment = {
        id: `apt${Date.now()}`,
        patientId: newAppointment.patientId,
        patientName: `${patient.firstName} ${patient.lastName}`,
        doctorId: 'd1',
        doctorName: 'Dr. Sarah Johnson',
        date: newAppointment.date,
        time: newAppointment.time,
        duration: newAppointment.duration,
        type: newAppointment.type,
        status: newAppointment.status,
        room: newAppointment.room || undefined,
        notes: newAppointment.notes || undefined,
      };
      addAppointment(appointment);
      Alert.alert('Erfolg', 'Termin erfolgreich erstellt');
    }

    setShowCreateModal(false);
    setEditingAppointment(null);
    setNewAppointment({
      patientId: '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      duration: 30,
      type: 'consultation',
      status: 'scheduled',
      room: '',
      notes: '',
    });
  };

  const handleCreateNewPatient = () => {
    if (!newPatient.firstName || !newPatient.lastName || !newPatient.dateOfBirth || !newPatient.contactNumber) {
      Alert.alert('Fehler', 'Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    const patient: Patient = {
      id: `p${Date.now()}`,
      mrn: `MRN-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      firstName: newPatient.firstName,
      lastName: newPatient.lastName,
      dateOfBirth: newPatient.dateOfBirth,
      gender: newPatient.gender,
      bloodType: newPatient.bloodType || undefined,
      contactNumber: newPatient.contactNumber,
      allergies: newPatient.allergies ? newPatient.allergies.split(',').map(a => a.trim()).filter(a => a) : [],
      status: newPatient.status,
      admissionDate: newPatient.status === 'admitted' ? new Date().toISOString().split('T')[0] : undefined,
    };

    addPatient(patient);
    setNewAppointment({ ...newAppointment, patientId: patient.id });
    setShowNewPatientModal(false);
    setNewPatient({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'male',
      bloodType: '',
      contactNumber: '',
      allergies: '',
      status: 'outpatient',
    });
    Alert.alert('Erfolg', 'Patient erfolgreich erstellt und ausgewählt');
  };

  const handleDeleteAppointment = (appointment: Appointment) => {
    Alert.alert(
      'Termin löschen',
      `Möchten Sie den Termin für ${appointment.patientName} wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => {
            deleteAppointment(appointment.id);
            setSelectedAppointment(null);
            Alert.alert('Erfolg', 'Termin gelöscht');
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Schedule',
          headerLargeTitle: true,
          headerRight: () => (
            <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateModal(true)}>
              <Plus size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        <View style={styles.viewModeSelector}>
          {(['day', 'week', 'month'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.viewModeButton,
                viewMode === mode && styles.viewModeButtonActive,
              ]}
              onPress={() => setViewMode(mode)}
            >
              <Text
                style={[
                  styles.viewModeText,
                  viewMode === mode && styles.viewModeTextActive,
                ]}
              >
                {mode === 'day' ? 'Tag' : mode === 'week' ? 'Woche' : 'Monat'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.dateNavigator}>
          <TouchableOpacity style={styles.navButton} onPress={() => navigateDate('prev')}>
            <ChevronLeft size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.dateDisplay}>
            <Calendar size={20} color="#007AFF" />
            <Text style={styles.dateText}>{getDateRangeText()}</Text>
          </View>
          <TouchableOpacity style={styles.navButton} onPress={() => navigateDate('next')}>
            <ChevronRight size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.createButtonContainer}>
          <TouchableOpacity 
            style={styles.createAppointmentButton} 
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.8}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.createAppointmentButtonText}>Termin erstellen</Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'month' && (
          <ScrollView style={styles.list}>
            <View style={styles.monthView}>
              <View style={styles.weekDaysHeader}>
                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                  <Text key={day} style={styles.weekDayText}>{day}</Text>
                ))}
              </View>
              <View style={styles.monthGrid}>
                {getDaysInMonth(selectedDate).map((day, index) => {
                  if (!day) {
                    return <View key={`empty-${index}`} style={styles.dayCell} />;
                  }
                  const dayAppointments = getAppointmentsForDate(day);
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isSelected = day.toDateString() === selectedDate.toDateString();
                  return (
                    <TouchableOpacity
                      key={day.toISOString()}
                      style={[
                        styles.dayCell,
                        isToday && styles.dayCellToday,
                        isSelected && styles.dayCellSelected,
                      ]}
                      onPress={() => {
                        setSelectedDate(day);
                        setViewMode('day');
                      }}
                    >
                      <Text
                        style={[
                          styles.dayNumber,
                          isToday && styles.dayNumberToday,
                          isSelected && styles.dayNumberSelected,
                        ]}
                      >
                        {day.getDate()}
                      </Text>
                      {dayAppointments.length > 0 && (
                        <View style={styles.appointmentDots}>
                          {dayAppointments.slice(0, 3).map((_, i) => (
                            <View key={i} style={styles.appointmentDot} />
                          ))}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        )}

        {viewMode === 'week' && (
          <ScrollView horizontal style={styles.weekViewScroll}>
            <View style={styles.weekView}>
              {getWeekDays(selectedDate).map((day) => {
                const dayAppointments = getAppointmentsForDate(day);
                const isToday = day.toDateString() === new Date().toDateString();
                return (
                  <View key={day.toISOString()} style={styles.weekDayColumn}>
                    <View style={[styles.weekDayHeader, isToday && styles.weekDayHeaderToday]}>
                      <Text style={[styles.weekDayName, isToday && styles.weekDayNameToday]}>
                        {day.toLocaleDateString('de-DE', { weekday: 'short' })}
                      </Text>
                      <Text style={[styles.weekDayDate, isToday && styles.weekDayDateToday]}>
                        {day.getDate()}
                      </Text>
                    </View>
                    <ScrollView style={styles.weekDayAppointments}>
                      {dayAppointments.map((apt) => (
                        <TouchableOpacity
                          key={apt.id}
                          style={styles.weekAppointmentCard}
                          onPress={() => {
                            setSelectedDate(day);
                            setViewMode('day');
                          }}
                        >
                          <Text style={styles.weekAppointmentTime}>{apt.time}</Text>
                          <Text style={styles.weekAppointmentPatient} numberOfLines={1}>
                            {apt.patientName}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}

        {viewMode === 'day' && (
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            <Text style={styles.resultCount}>
              {filteredAppointments.length} {filteredAppointments.length === 1 ? 'Termin' : 'Termine'}
            </Text>

            {filteredAppointments.length === 0 ? (
              <View style={styles.emptyState}>
                <Calendar size={48} color="#C7C7CC" />
                <Text style={styles.emptyTitle}>Keine Termine</Text>
                <Text style={styles.emptyText}>Für dieses Datum sind keine Termine geplant</Text>
              </View>
            ) : (
              filteredAppointments.map(appointment => (
                <TouchableOpacity
                  key={appointment.id}
                  onPress={() => setSelectedAppointment(selectedAppointment?.id === appointment.id ? null : appointment)}
                  activeOpacity={0.7}
                >
                  <Card style={[styles.appointmentCard, selectedAppointment?.id === appointment.id && styles.appointmentCardSelected]}>
                    <View style={styles.appointmentHeader}>
                      <View style={styles.timeContainer}>
                        <View style={[styles.typeIndicator, { backgroundColor: getTypeColor(appointment.type) }]} />
                        <View>
                          <Text style={styles.time}>{appointment.time}</Text>
                          <Text style={styles.duration}>{appointment.duration} min</Text>
                        </View>
                      </View>
                      <Badge label={appointment.status} variant={getStatusVariant(appointment.status)} />
                    </View>

                    <View style={styles.appointmentBody}>
                      <Text style={styles.patientName}>{appointment.patientName}</Text>
                      <Text style={styles.appointmentType}>{appointment.type.replace('_', ' ')}</Text>

                      <View style={styles.details}>
                        <View style={styles.detailRow}>
                          <Clock size={16} color="#8E8E93" />
                          <Text style={styles.detailText}>Dr. {appointment.doctorName}</Text>
                        </View>
                        {appointment.room && (
                          <View style={styles.detailRow}>
                            <MapPin size={16} color="#8E8E93" />
                            <Text style={styles.detailText}>{appointment.room}</Text>
                          </View>
                        )}
                      </View>

                      {appointment.notes && (
                        <View style={styles.notesContainer}>
                          <Text style={styles.notesLabel}>Notizen:</Text>
                          <Text style={styles.notesText}>{appointment.notes}</Text>
                        </View>
                      )}
                    </View>

                    {selectedAppointment?.id === appointment.id && (
                      <View style={styles.appointmentActions}>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => {
                            setEditingAppointment(appointment);
                            setNewAppointment({
                              patientId: appointment.patientId,
                              date: appointment.date,
                              time: appointment.time,
                              duration: appointment.duration,
                              type: appointment.type,
                              status: appointment.status,
                              room: appointment.room || '',
                              notes: appointment.notes || '',
                            });
                            setShowCreateModal(true);
                            setSelectedAppointment(null);
                          }}
                        >
                          <Edit2 size={16} color="#007AFF" />
                          <Text style={styles.editButtonText}>Bearbeiten</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteAppointment(appointment)}
                        >
                          <Trash2 size={16} color="#FF3B30" />
                          <Text style={styles.deleteButtonText}>Löschen</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </Card>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}

        <Modal
          visible={showCreateModal}
          animationType="slide"
          transparent
          onRequestClose={() => {
            setShowCreateModal(false);
            setEditingAppointment(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingAppointment ? 'Termin bearbeiten' : 'Neuer Termin'}</Text>
                <TouchableOpacity onPress={() => {
                  setShowCreateModal(false);
                  setEditingAppointment(null);
                }}>
                  <X size={24} color="#8E8E93" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Patient *</Text>
                    <TouchableOpacity onPress={() => setShowNewPatientModal(true)}>
                      <Text style={styles.newPatientLink}>+ Neuer Patient</Text>
                    </TouchableOpacity>
                  </View>
                  {patients.length === 0 ? (
                    <View style={styles.noPatients}>
                      <Text style={styles.noPatientText}>Keine Patienten vorhanden</Text>
                      <TouchableOpacity onPress={() => setShowNewPatientModal(true)} style={styles.addFirstPatientButton}>
                        <Text style={styles.addFirstPatientText}>+ Ersten Patient erstellen</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.patientScroll}>
                      {patients.map(patient => (
                        <TouchableOpacity
                          key={patient.id}
                          style={[
                            styles.patientChip,
                            newAppointment.patientId === patient.id && styles.patientChipActive,
                          ]}
                          onPress={() => {
                            console.log('Patient selected:', patient.id, patient.firstName, patient.lastName);
                            setNewAppointment({ ...newAppointment, patientId: patient.id });
                          }}
                        >
                          <Text
                            style={[
                              styles.patientChipText,
                              newAppointment.patientId === patient.id && styles.patientChipTextActive,
                            ]}
                          >
                            {patient.firstName} {patient.lastName}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Datum *</Text>
                  <TextInput
                    style={styles.input}
                    value={newAppointment.date}
                    onChangeText={(text) => setNewAppointment({ ...newAppointment, date: text })}
                    placeholder="YYYY-MM-DD"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Uhrzeit *</Text>
                  <TextInput
                    style={styles.input}
                    value={newAppointment.time}
                    onChangeText={(text) => setNewAppointment({ ...newAppointment, time: text })}
                    placeholder="HH:MM"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Dauer (Minuten)</Text>
                  <TextInput
                    style={styles.input}
                    value={String(newAppointment.duration)}
                    onChangeText={(text) => setNewAppointment({ ...newAppointment, duration: parseInt(text) || 30 })}
                    keyboardType="number-pad"
                    placeholder="30"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Termintyp</Text>
                  <View style={styles.typeButtons}>
                    {(['consultation', 'follow_up', 'procedure', 'emergency'] as const).map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.typeButton,
                          newAppointment.type === type && styles.typeButtonActive,
                        ]}
                        onPress={() => setNewAppointment({ ...newAppointment, type })}
                      >
                        <Text
                          style={[
                            styles.typeButtonText,
                            newAppointment.type === type && styles.typeButtonTextActive,
                          ]}
                        >
                          {type === 'consultation' ? 'Konsultation' : type === 'follow_up' ? 'Nachsorge' : type === 'procedure' ? 'Eingriff' : 'Notfall'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Status</Text>
                  <View style={styles.statusButtons}>
                    {(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const).map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusButton,
                          newAppointment.status === status && styles.statusButtonActive,
                        ]}
                        onPress={() => setNewAppointment({ ...newAppointment, status })}
                      >
                        <Text
                          style={[
                            styles.statusButtonText,
                            newAppointment.status === status && styles.statusButtonTextActive,
                          ]}
                        >
                          {status === 'scheduled' ? 'Geplant' : status === 'confirmed' ? 'Bestätigt' : status === 'in_progress' ? 'Läuft' : status === 'completed' ? 'Abgeschlossen' : 'Abgesagt'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Raum</Text>
                  <TextInput
                    style={styles.input}
                    value={newAppointment.room}
                    onChangeText={(text) => setNewAppointment({ ...newAppointment, room: text })}
                    placeholder="z.B. Raum 301"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Notizen</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={newAppointment.notes}
                    onChangeText={(text) => setNewAppointment({ ...newAppointment, notes: text })}
                    placeholder="Zusätzliche Informationen..."
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowCreateModal(false);
                    setEditingAppointment(null);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Abbrechen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleCreateAppointment}
                >
                  <Text style={styles.confirmButtonText}>{editingAppointment ? 'Aktualisieren' : 'Erstellen'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showNewPatientModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowNewPatientModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Neuer Patient</Text>
                <TouchableOpacity onPress={() => setShowNewPatientModal(false)}>
                  <X size={24} color="#8E8E93" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Vorname *</Text>
                  <TextInput
                    style={styles.input}
                    value={newPatient.firstName}
                    onChangeText={(text) => setNewPatient({ ...newPatient, firstName: text })}
                    placeholder="Vorname eingeben"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Nachname *</Text>
                  <TextInput
                    style={styles.input}
                    value={newPatient.lastName}
                    onChangeText={(text) => setNewPatient({ ...newPatient, lastName: text })}
                    placeholder="Nachname eingeben"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Geburtsdatum * (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.input}
                    value={newPatient.dateOfBirth}
                    onChangeText={(text) => setNewPatient({ ...newPatient, dateOfBirth: text })}
                    placeholder="1990-01-01"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Telefonnummer *</Text>
                  <TextInput
                    style={styles.input}
                    value={newPatient.contactNumber}
                    onChangeText={(text) => setNewPatient({ ...newPatient, contactNumber: text })}
                    placeholder="+49 123 456789"
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Geschlecht</Text>
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
                          {gender === 'male' ? 'Männlich' : gender === 'female' ? 'Weiblich' : 'Divers'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowNewPatientModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Abbrechen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleCreateNewPatient}
                >
                  <Text style={styles.confirmButtonText}>Erstellen</Text>
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
  viewModeSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: '#007AFF',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#000000',
  },
  viewModeTextActive: {
    color: '#FFFFFF',
  },
  dateNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000000',
  },
  monthView: {
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#8E8E93',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  dayCellToday: {
    backgroundColor: '#E5F3FF',
  },
  dayCellSelected: {
    backgroundColor: '#007AFF',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#000000',
  },
  dayNumberToday: {
    color: '#007AFF',
    fontWeight: '700' as const,
  },
  dayNumberSelected: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  appointmentDots: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  appointmentDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#007AFF',
  },
  weekViewScroll: {
    flex: 1,
  },
  weekView: {
    flexDirection: 'row',
    minWidth: '100%',
  },
  weekDayColumn: {
    width: 120,
    borderRightWidth: 1,
    borderRightColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  weekDayHeader: {
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  weekDayHeaderToday: {
    backgroundColor: '#E5F3FF',
  },
  weekDayName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#8E8E93',
    marginBottom: 4,
  },
  weekDayNameToday: {
    color: '#007AFF',
  },
  weekDayDate: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#000000',
  },
  weekDayDateToday: {
    color: '#007AFF',
  },
  weekDayAppointments: {
    flex: 1,
  },
  weekAppointmentCard: {
    padding: 8,
    margin: 4,
    backgroundColor: '#F2F2F7',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  weekAppointmentTime: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#007AFF',
    marginBottom: 2,
  },
  weekAppointmentPatient: {
    fontSize: 12,
    color: '#000000',
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
  appointmentCard: {
    marginBottom: 12,
  },
  appointmentCardSelected: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  time: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#000000',
  },
  duration: {
    fontSize: 13,
    color: '#8E8E93',
  },
  appointmentBody: {
    gap: 8,
  },
  patientName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#000000',
  },
  appointmentType: {
    fontSize: 14,
    color: '#8E8E93',
    textTransform: 'capitalize',
  },
  details: {
    gap: 8,
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#3C3C43',
  },
  notesContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#8E8E93',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
  },
  appointmentActions: {
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#000000',
  },
  newPatientLink: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#007AFF',
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
  patientScroll: {
    maxHeight: 120,
  },
  patientChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
    marginBottom: 8,
  },
  noPatients: {
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    alignItems: 'center',
  },
  noPatientText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  addFirstPatientButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  addFirstPatientText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
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
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    minWidth: '47%',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#000000',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#007AFF',
  },
  statusButtonText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#000000',
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
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
  createButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  createAppointmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createAppointmentButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
