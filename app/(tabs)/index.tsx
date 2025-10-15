import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Activity, Users, Calendar, AlertTriangle, LogOut, CheckCircle, Clock } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { useHospital } from '@/contexts/HospitalContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const { patients, appointments, tasks, notifications, medications } = useHospital();
  const { t } = useLanguage();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      t.auth.logout,
      t.auth.logoutConfirm,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.auth.logout,
          style: 'destructive',
          onPress: async () => {
            console.log('Dashboard: Logout initiated');
            const result = await logout();
            console.log('Dashboard: Logout result:', result);
            if (result.success) {
              console.log('Dashboard: Navigating to index (will redirect to login)');
              router.replace('/');
            } else {
              Alert.alert(t.common.error, t.auth.logoutError);
            }
          },
        },
      ]
    );
  };

  const stats = React.useMemo(() => [
    {
      icon: Users,
      label: t.dashboard.totalPatients,
      value: patients.length,
      color: '#007AFF',
      bgColor: '#E5F3FF',
    },
    {
      icon: Calendar,
      label: t.dashboard.todaysAppointments,
      value: appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length,
      color: '#34C759',
      bgColor: '#D1F4E0',
    },
    {
      icon: Activity,
      label: t.dashboard.activeMedications,
      value: medications.filter(m => m.status === 'active').length,
      color: '#FF9500',
      bgColor: '#FFF4E5',
    },
    {
      icon: AlertTriangle,
      label: t.dashboard.pendingTasks,
      value: tasks.filter(t => t.status === 'pending').length,
      color: '#FF3B30',
      bgColor: '#FFE5E5',
    },
  ], [patients, appointments, medications, tasks, refreshKey, t]);

  const upcomingAppointments = appointments
    .filter(a => a.status === 'scheduled' || a.status === 'confirmed')
    .slice(0, 3);

  const pendingTasks = tasks.filter(t => t.status === 'pending').slice(0, 3);

  return (
    <>
      <Stack.Screen
        options={{
          title: t.dashboard.title,
          headerLargeTitle: true,
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <LogOut size={20} color="#FF3B30" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>{t.dashboard.welcomeBack}</Text>
          <Text style={styles.name}>{user?.name}</Text>
          <Badge label={user?.role || 'User'} variant="info" style={styles.roleBadge} />
        </View>

        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <Card key={index} style={styles.statCard}>
              <View style={[styles.iconContainer, { backgroundColor: stat.bgColor }]}>
                <stat.icon size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Card>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.dashboard.upcomingAppointments}</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>{t.dashboard.seeAll}</Text>
            </TouchableOpacity>
          </View>
          {upcomingAppointments.map(appointment => (
            <Card key={appointment.id} style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <View>
                  <Text style={styles.patientName}>{appointment.patientName}</Text>
                  <Text style={styles.appointmentTime}>
                    {appointment.time} • {appointment.duration} min
                  </Text>
                </View>
                <Badge
                  label={appointment.status}
                  variant={appointment.status === 'confirmed' ? 'success' : 'info'}
                />
              </View>
              <View style={styles.appointmentDetails}>
                <View style={styles.detailItem}>
                  <Calendar size={14} color="#8E8E93" />
                  <Text style={styles.detailText}>{appointment.date}</Text>
                </View>
                {appointment.room && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailText}>{appointment.room}</Text>
                  </View>
                )}
              </View>
            </Card>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.dashboard.pendingTasksSection}</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>{t.dashboard.seeAll}</Text>
            </TouchableOpacity>
          </View>
          {pendingTasks.map(task => (
            <Card key={task.id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <View style={styles.taskInfo}>
                  <View style={styles.taskIconContainer}>
                    {task.status === 'completed' ? (
                      <CheckCircle size={20} color="#34C759" />
                    ) : (
                      <Clock size={20} color="#FF9500" />
                    )}
                  </View>
                  <View style={styles.taskContent}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskCategory}>{task.category}</Text>
                  </View>
                </View>
                <Badge
                  label={task.priority}
                  variant={task.priority === 'high' || task.priority === 'urgent' ? 'danger' : 'warning'}
                />
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
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
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 4,
  },
  name: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#000000',
    marginBottom: 8,
  },
  roleBadge: {
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#000000',
  },
  seeAll: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500' as const,
  },
  appointmentCard: {
    marginBottom: 12,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  patientName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#000000',
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 14,
    color: '#8E8E93',
  },
  appointmentDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#3C3C43',
  },
  taskCard: {
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskIconContainer: {
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#000000',
    marginBottom: 2,
  },
  taskCategory: {
    fontSize: 13,
    color: '#8E8E93',
  },
  logoutButton: {
    marginRight: 8,
    padding: 8,
  },
});
