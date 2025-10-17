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
        <View style={styles.compactHeader}>
          <View style={styles.compactAvatar}>
            <Text style={styles.compactAvatarText}>
              {patient.firstName[0]}{patient.lastName[0]}
            </Text>
          </View>
          <View style={styles.compactInfo}>
            <Text style={styles.compactName} numberOfLines={1}>
              {patient.firstName} {patient.lastName}
            </Text>
            <View style={styles.compactDetails}>
              <Text style={styles.compactMrn}>{patient.mrn}</Text>
              <Text style={styles.compactSeparator}>•</Text>
              <Text style={styles.compactAge}>{calculateAge(patient.dateOfBirth)}y</Text>
              {patient.bloodType && (
                <>
                  <Text style={styles.compactSeparator}>•</Text>
                  <Text style={styles.compactBloodType}>{patient.bloodType}</Text>
                </>
              )}
            </View>
          </View>
          <View style={[styles.compactStatusDot, { backgroundColor: getStatusColor(patient.status) }]} />
        </View>
        {patient.allergies.length > 0 && (
          <View style={styles.compactAllergies}>
            <AlertCircle size={12} color="#FF3B30" />
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
    borderRadius: 12,
    padding: 12,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  compactAvatarText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  compactInfo: {
    flex: 1,
  },
  compactName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000000',
    marginBottom: 2,
  },
  compactDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactMrn: {
    fontSize: 12,
    color: '#8E8E93',
  },
  compactAge: {
    fontSize: 12,
    color: '#3C3C43',
  },
  compactBloodType: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  compactSeparator: {
    fontSize: 12,
    color: '#8E8E93',
  },
  compactStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
  compactAllergies: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFE5E5',
    padding: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  compactAllergyText: {
    fontSize: 11,
    color: '#FF3B30',
    fontWeight: '500' as const,
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
