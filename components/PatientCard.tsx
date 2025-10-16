import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { User, Calendar, AlertCircle } from 'lucide-react-native';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Patient } from '@/types';

interface PatientCardProps {
  patient: Patient;
}

export function PatientCard({ patient }: PatientCardProps) {
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
  );
}

const styles = StyleSheet.create({
  card: {
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
  details: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#3C3C43',
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
