import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { FlaskConical, User, Calendar, AlertTriangle, CheckCircle, Clock, Plus } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useHospital } from '@/contexts/HospitalContext';
import { LabOrder } from '@/types';

export default function LaboratoryScreen() {
  const { labOrders } = useHospital();
  const [filter, setFilter] = useState<LabOrder['status'] | 'all'>('all');

  const filteredOrders = labOrders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const getStatusVariant = (status: LabOrder['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'ordered':
        return 'info';
      case 'collected':
        return 'info';
      case 'cancelled':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: LabOrder['priority']) => {
    switch (priority) {
      case 'stat':
        return '#FF3B30';
      case 'urgent':
        return '#FF9500';
      case 'routine':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Laboratory',
          headerLargeTitle: true,
          headerRight: () => (
            <TouchableOpacity style={styles.addButton}>
              <Plus size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {(['all', 'ordered', 'collected', 'processing', 'completed'] as const).map(status => (
            <TouchableOpacity
              key={status}
              style={[styles.filterChip, filter === status && styles.filterChipActive]}
              onPress={() => setFilter(status)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === status && styles.filterChipTextActive,
                ]}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          <Text style={styles.resultCount}>
            {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
          </Text>

          {filteredOrders.map(order => (
            <Card key={order.id} style={styles.orderCard}>
              <View style={styles.header}>
                <View style={styles.orderInfo}>
                  <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(order.priority) }]}>
                    <FlaskConical size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.idContainer}>
                    <Text style={styles.orderId}>Order #{order.id}</Text>
                    <Badge
                      label={order.priority.toUpperCase()}
                      variant={order.priority === 'stat' ? 'danger' : order.priority === 'urgent' ? 'warning' : 'success'}
                    />
                  </View>
                </View>
                <Badge label={order.status} variant={getStatusVariant(order.status)} />
              </View>

              <View style={styles.patientSection}>
                <User size={16} color="#8E8E93" />
                <Text style={styles.patientName}>{order.patientName}</Text>
              </View>

              <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                  <Calendar size={16} color="#8E8E93" />
                  <Text style={styles.detailText}>
                    Ordered: {new Date(order.orderDate).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <User size={16} color="#8E8E93" />
                  <Text style={styles.detailText}>By: {order.orderedByName}</Text>
                </View>
              </View>

              <View style={styles.testsSection}>
                <Text style={styles.testsLabel}>Tests ({order.tests.length}):</Text>
                {order.tests.map(test => (
                  <View key={test.id} style={styles.testItem}>
                    <View style={styles.testInfo}>
                      {test.status === 'completed' ? (
                        <CheckCircle size={16} color="#34C759" />
                      ) : test.status === 'abnormal' ? (
                        <AlertTriangle size={16} color="#FF3B30" />
                      ) : (
                        <Clock size={16} color="#8E8E93" />
                      )}
                      <View style={styles.testDetails}>
                        <Text style={styles.testName}>{test.name}</Text>
                        <Text style={styles.testCode}>{test.code} • {test.category}</Text>
                      </View>
                    </View>
                    {test.result && (
                      <View style={styles.resultContainer}>
                        <Text style={styles.resultValue}>{test.result}</Text>
                        {test.unit && <Text style={styles.resultUnit}>{test.unit}</Text>}
                      </View>
                    )}
                  </View>
                ))}
              </View>

              {order.notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Notes:</Text>
                  <Text style={styles.notesText}>{order.notes}</Text>
                </View>
              )}
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
  filterScroll: {
    maxHeight: 50,
    marginVertical: 16,
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
  orderCard: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priorityIndicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  idContainer: {
    flex: 1,
    gap: 6,
  },
  orderId: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#000000',
  },
  patientSection: {
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
  orderDetails: {
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
  testsSection: {
    marginTop: 8,
  },
  testsLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#000000',
    marginBottom: 12,
  },
  testItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    marginBottom: 8,
  },
  testInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  testDetails: {
    flex: 1,
  },
  testName: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#000000',
    marginBottom: 2,
  },
  testCode: {
    fontSize: 12,
    color: '#8E8E93',
  },
  resultContainer: {
    alignItems: 'flex-end',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  resultUnit: {
    fontSize: 12,
    color: '#8E8E93',
  },
  notesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF4E5',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FF9500',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#3C3C43',
    lineHeight: 18,
  },
  addButton: {
    marginRight: 8,
  },
});
