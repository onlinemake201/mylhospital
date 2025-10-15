import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { AlertCircle, Clock, MapPin, Activity, Plus } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useHospital } from '@/contexts/HospitalContext';
import { EmergencyCase } from '@/types';

export default function EmergencyScreen() {
  const { emergencyCases } = useHospital();

  const getTriageColor = (color: EmergencyCase['triageColor']) => {
    switch (color) {
      case 'red':
        return '#FF3B30';
      case 'orange':
        return '#FF9500';
      case 'yellow':
        return '#FFCC00';
      case 'green':
        return '#34C759';
      case 'blue':
        return '#007AFF';
      default:
        return '#8E8E93';
    }
  };

  const getTriageLabel = (level: number) => {
    switch (level) {
      case 1:
        return 'Immediate';
      case 2:
        return 'Emergent';
      case 3:
        return 'Urgent';
      case 4:
        return 'Less Urgent';
      case 5:
        return 'Non-Urgent';
      default:
        return 'Unknown';
    }
  };

  const getStatusVariant = (status: EmergencyCase['status']) => {
    switch (status) {
      case 'in_treatment':
        return 'warning';
      case 'waiting':
        return 'info';
      case 'admitted':
        return 'success';
      case 'discharged':
        return 'default';
      default:
        return 'default';
    }
  };

  const getWaitTime = (arrivalTime: string) => {
    const arrival = new Date(arrivalTime);
    const now = new Date();
    const diffMs = now.getTime() - arrival.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Emergency',
          headerLargeTitle: true,
          headerRight: () => (
            <TouchableOpacity style={styles.addButton}>
              <Plus size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        <View style={styles.statsBar}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{emergencyCases.length}</Text>
            <Text style={styles.statLabel}>Active Cases</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>
              {emergencyCases.filter(c => c.status === 'waiting').length}
            </Text>
            <Text style={styles.statLabel}>Waiting</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>
              {emergencyCases.filter(c => c.status === 'in_treatment').length}
            </Text>
            <Text style={styles.statLabel}>In Treatment</Text>
          </Card>
        </View>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {emergencyCases.map(emergencyCase => (
            <Card key={emergencyCase.id} style={styles.caseCard}>
              <View style={styles.header}>
                <View style={styles.triageContainer}>
                  <View
                    style={[
                      styles.triageIndicator,
                      { backgroundColor: getTriageColor(emergencyCase.triageColor) },
                    ]}
                  >
                    <Text style={styles.triageLevel}>{emergencyCase.triageLevel}</Text>
                  </View>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{emergencyCase.patientName}</Text>
                    <Text style={styles.triageLabel}>{getTriageLabel(emergencyCase.triageLevel)}</Text>
                  </View>
                </View>
                <Badge label={emergencyCase.status.replace('_', ' ')} variant={getStatusVariant(emergencyCase.status)} />
              </View>

              <View style={styles.complaint}>
                <AlertCircle size={16} color="#FF3B30" />
                <Text style={styles.complaintText}>{emergencyCase.chiefComplaint}</Text>
              </View>

              <View style={styles.details}>
                <View style={styles.detailRow}>
                  <Clock size={16} color="#8E8E93" />
                  <Text style={styles.detailText}>
                    Arrived: {new Date(emergencyCase.arrivalTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <View style={styles.waitTimeBadge}>
                    <Text style={styles.waitTimeText}>
                      Wait: {getWaitTime(emergencyCase.arrivalTime)}
                    </Text>
                  </View>
                </View>
                {emergencyCase.location && (
                  <View style={styles.detailRow}>
                    <MapPin size={16} color="#8E8E93" />
                    <Text style={styles.detailText}>{emergencyCase.location}</Text>
                  </View>
                )}
                {emergencyCase.assignedTo && (
                  <View style={styles.detailRow}>
                    <Activity size={16} color="#8E8E93" />
                    <Text style={styles.detailText}>Assigned to: {emergencyCase.assignedTo}</Text>
                  </View>
                )}
              </View>

              <View style={styles.vitalsSection}>
                <Text style={styles.vitalsLabel}>Vital Signs</Text>
                <View style={styles.vitalsGrid}>
                  {emergencyCase.vitalSigns.temperature && (
                    <View style={styles.vitalItem}>
                      <Text style={styles.vitalValue}>{emergencyCase.vitalSigns.temperature}°C</Text>
                      <Text style={styles.vitalLabel}>Temp</Text>
                    </View>
                  )}
                  {emergencyCase.vitalSigns.bloodPressureSystolic && (
                    <View style={styles.vitalItem}>
                      <Text style={styles.vitalValue}>
                        {emergencyCase.vitalSigns.bloodPressureSystolic}/
                        {emergencyCase.vitalSigns.bloodPressureDiastolic}
                      </Text>
                      <Text style={styles.vitalLabel}>BP</Text>
                    </View>
                  )}
                  {emergencyCase.vitalSigns.heartRate && (
                    <View style={styles.vitalItem}>
                      <Text style={styles.vitalValue}>{emergencyCase.vitalSigns.heartRate}</Text>
                      <Text style={styles.vitalLabel}>HR</Text>
                    </View>
                  )}
                  {emergencyCase.vitalSigns.oxygenSaturation && (
                    <View style={styles.vitalItem}>
                      <Text style={styles.vitalValue}>{emergencyCase.vitalSigns.oxygenSaturation}%</Text>
                      <Text style={styles.vitalLabel}>SpO2</Text>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          ))}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  statsBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  caseCard: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  triageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  triageIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  triageLevel: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#000000',
    marginBottom: 2,
  },
  triageLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  complaint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    marginBottom: 12,
  },
  complaintText: {
    flex: 1,
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500' as const,
  },
  details: {
    gap: 8,
    marginBottom: 12,
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
  waitTimeBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFF4E5',
    borderRadius: 6,
  },
  waitTimeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FF9500',
  },
  vitalsSection: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  vitalsLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#8E8E93',
    marginBottom: 12,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  vitalItem: {
    alignItems: 'center',
  },
  vitalValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000000',
    marginBottom: 2,
  },
  vitalLabel: {
    fontSize: 11,
    color: '#8E8E93',
  },
  addButton: {
    marginRight: 8,
  },
});
