import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { User, AlertCircle } from 'lucide-react-native';
import { Patient } from '@/types';

interface PatientCardProps {
  patient: Patient;
  compact?: boolean;
}

export function PatientCard({ patient, compact = false }: PatientCardProps) {
  const getStatusColor = (status: Patient['status']) => {
    switch (status) {
      case 'admitted':
        return '#007AFF';
      case 'emergency':
        return '#FF3B30';
      case 'outpatient':
        return '#34C759';
      case 'discharged':
        return '#8E8E93';
      default:
        return '#8E8E93';
    }
  };

  const getStatusLabel = (status: Patient['status']) => {
    switch (status) {
      case 'admitted':
        return 'Admitted';
      case 'emergency':
        return 'Emergency';
      case 'outpatient':
        return 'Outpatient';
      case 'discharged':
        return 'Discharged';
      default:
        return status;
    }
  };

  const calculateAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (compact) {
    return (
      <View style={styles.compactCard}>
        <View style={styles.compactTop}>
          <View style={styles.compactAvatar}>
            <Text style={styles.compactAvatarText}>
              {patient.firstName[0]}{patient.lastName[0]}
            </Text>
          </View>
          <View style={[styles.compactStatusBadge, { backgroundColor: getStatusColor(patient.status) }]}>
            <Text style={styles.compactStatusText}>{getStatusLabel(patient.status)}</Text>
          </View>
        </View>
        
        <Text style={styles.compactName} numberOfLines={2}>
          {patient.firstName} {patient.lastName}
        </Text>
        
        <View style={styles.compactDetailsRow}>
          <Text style={styles.compactMrn} numberOfLines={1}>{patient.mrn}</Text>
        </View>
        
        <View style={styles.compactMetrics}>
          <View style={styles.compactMetricItem}>
            <Text style={styles.compactMetricLabel}>Age</Text>
            <Text style={styles.compactMetricValue}>{calculateAge(patient.dateOfBirth)}</Text>
          </View>
          {patient.bloodType && (
            <View style={styles.compactMetricItem}>
              <Text style={styles.compactMetricLabel}>Blood</Text>
              <Text style={styles.compactMetricValue}>{patient.bloodType}</Text>
            </View>
          )}
          {!patient.bloodType && (
            <View style={styles.compactMetricItem}>
              <Text style={styles.compactMetricLabel}>Gender</Text>
              <Text style={styles.compactMetricValue}>{patient.gender[0].toUpperCase()}</Text>
            </View>
          )}
        </View>
        
        {patient.allergies.length > 0 && (
          <View style={styles.compactAllergies}>
            <AlertCircle size={10} color="#FF3B30" />
            <Text style={styles.compactAllergyText} numberOfLines={1}>
              {patient.allergies.join(', ')}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.patientInfo}>
          <View style={styles.avatar}>
            <User size={24} color="#007AFF" />
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>
              {patient.firstName} {patient.lastName}
            </Text>
            <Text style={styles.mrn}>MRN: {patient.mrn}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(patient.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(patient.status) }]}>
            {getStatusLabel(patient.status)}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <Text style={styles.detailText}>
          Age: {calculateAge(patient.dateOfBirth)}y
        </Text>
        {patient.bloodType && (
          <>
            <Text style={styles.detailSeparator}>•</Text>
            <Text style={styles.bloodType}>{patient.bloodType}</Text>
          </>
        )}
      </View>

      {patient.allergies.length > 0 && (
        <View style={styles.allergies}>
          <AlertCircle size={16} color="#FF3B30" />
          <Text style={styles.allergyText}>
            Allergies: {patient.allergies.join(', ')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  compactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
  },
  compactTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  compactAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactAvatarText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  compactStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  compactStatusText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  compactName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#000000',
    marginBottom: 4,
    lineHeight: 18,
  },
  compactDetailsRow: {
    marginBottom: 10,
  },
  compactMrn: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500' as const,
  },
  compactMetrics: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  compactMetricItem: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  compactMetricLabel: {
    fontSize: 9,
    color: '#8E8E93',
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  compactMetricValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#007AFF',
  },
  compactAllergies: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFE5E5',
    padding: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  compactAllergyText: {
    fontSize: 9,
    color: '#FF3B30',
    fontWeight: '600' as const,
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000000',
    marginBottom: 2,
  },
  mrn: {
    fontSize: 12,
    color: '#8E8E93',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'lowercase' as const,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#3C3C43',
  },
  detailSeparator: {
    fontSize: 12,
    color: '#8E8E93',
  },
  bloodType: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  allergies: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFE5E5',
    padding: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  allergyText: {
    fontSize: 11,
    color: '#FF3B30',
    fontWeight: '500' as const,
  },
});
