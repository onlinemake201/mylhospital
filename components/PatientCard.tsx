import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { User, Calendar, AlertCircle } from 'lucide-react-native';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Patient } from '@/types';

interface PatientCardProps {
  patient: Patient;
  onPress?: () => void;
}

export function PatientCard({ patient, onPress }: PatientCardProps) {
  const getStatusVariant = (status: Patient['status']) => {
    switch (status) {
      case 'admitted':
        return 'info';
      case 'emergency':
        return 'danger';
      case 'outpatient':
        return 'success';
      case 'discharged':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
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
          <Badge label={patient.status} variant={getStatusVariant(patient.status)} />
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Calendar size={16} color="#8E8E93" />
            <Text style={styles.detailText}>
              DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
            </Text>
          </View>
          {patient.bloodType && (
            <View style={styles.detailRow}>
              <Text style={styles.bloodType}>{patient.bloodType}</Text>
            </View>
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
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#000000',
    marginBottom: 2,
  },
  mrn: {
    fontSize: 14,
    color: '#8E8E93',
  },
  details: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
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
  bloodType: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  allergies: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFE5E5',
    padding: 8,
    borderRadius: 8,
  },
  allergyText: {
    fontSize: 13,
    color: '#FF3B30',
    fontWeight: '500' as const,
  },
});
