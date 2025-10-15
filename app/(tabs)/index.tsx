import React, { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LogOut, Calendar, Clock, MapPin } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { useHospital } from '@/contexts/HospitalContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const { appointments, hospitalSettings } = useHospital();
  const { t } = useLanguage();
  const router = useRouter();

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

  const upcomingAppointments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return appointments
      .filter(a => {
        const appointmentDate = new Date(a.date);
        return appointmentDate >= today && (a.status === 'scheduled' || a.status === 'confirmed');
      })
      .sort((a, b) => {
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });
  }, [appointments]);

  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

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
          {hospitalSettings.logo && (
            <View style={styles.logoContainer}>
              <Image 
                source={{ uri: hospitalSettings.logo }} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          )}
          <Text style={styles.greeting}>{t.dashboard.welcomeBack}</Text>
          <Text style={styles.name}>{user?.name}</Text>
          <Badge label={user?.role || 'User'} variant="info" style={styles.roleBadge} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.dashboard.upcomingAppointments}</Text>
            <TouchableOpacity onPress={() => router.push('/appointments')}>
              <Text style={styles.seeAll}>{t.common.seeAll}</Text>
            </TouchableOpacity>
          </View>
          
          {upcomingAppointments.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Calendar size={48} color="#C7C7CC" />
              <Text style={styles.emptyText}>Keine bevorstehenden Termine</Text>
              <Text style={styles.emptySubtext}>Alle Termine sind abgeschlossen</Text>
            </Card>
          ) : (
            upcomingAppointments.map(appointment => {
              const appointmentDate = new Date(appointment.date);
              const isToday = appointmentDate.toDateString() === new Date().toDateString();
              const isTomorrow = new Date(appointmentDate.setDate(appointmentDate.getDate())).toDateString() === 
                                new Date(new Date().setDate(new Date().getDate() + 1)).toDateString();
              
              return (
                <Card key={appointment.id} style={styles.appointmentCard}>
                  <View style={styles.appointmentRow}>
                    <View style={styles.appointmentDate}>
                      <Text style={styles.appointmentDay}>
                        {new Date(appointment.date).getDate()}
                      </Text>
                      <Text style={styles.appointmentMonth}>
                        {monthNames[new Date(appointment.date).getMonth()].substring(0, 3)}
                      </Text>
                      {isToday && (
                        <View style={styles.todayBadge}>
                          <Text style={styles.todayBadgeText}>Heute</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.appointmentInfo}>
                      <Text style={styles.patientName}>{appointment.patientName}</Text>
                      <View style={styles.appointmentMeta}>
                        <Clock size={14} color="#8E8E93" />
                        <Text style={styles.appointmentTime}>
                          {appointment.time} • {appointment.duration} min
                        </Text>
                      </View>
                      {appointment.room && (
                        <View style={styles.appointmentMeta}>
                          <MapPin size={14} color="#8E8E93" />
                          <Text style={styles.appointmentRoom}>{appointment.room}</Text>
                        </View>
                      )}
                    </View>
                    <Badge
                      label={appointment.status === 'confirmed' ? 'Bestätigt' : 'Geplant'}
                      variant={appointment.status === 'confirmed' ? 'success' : 'info'}
                    />
                  </View>
                </Card>
              );
            })
          )}
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
  logoContainer: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  logo: {
    width: 120,
    height: 60,
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

  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    marginBottom: 16,
  },
  patientName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#000000',
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 13,
    color: '#8E8E93',
    marginLeft: 4,
  },
  appointmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  logoutButton: {
    marginRight: 8,
    padding: 8,
  },
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appointmentDate: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentDay: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#000000',
  },
  appointmentMonth: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#8E8E93',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentRoom: {
    fontSize: 13,
    color: '#8E8E93',
    marginLeft: 4,
  },
  todayBadge: {
    marginTop: 2,
    backgroundColor: '#007AFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  todayBadgeText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#8E8E93',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    marginTop: 4,
  },
});
