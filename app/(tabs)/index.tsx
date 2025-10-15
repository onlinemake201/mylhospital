import React, { useState, useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { useHospital } from '@/contexts/HospitalContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const { appointments } = useHospital();
  const { t } = useLanguage();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const calendarData = useMemo(() => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  }, [currentDate]);

  const getAppointmentsForDay = (day: number | null) => {
    if (!day) return [];
    
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    
    return appointments.filter(a => 
      a.date === dateStr && 
      (a.status === 'scheduled' || a.status === 'confirmed')
    );
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  
  const weekDays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

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

        <Card style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={previousMonth} style={styles.monthButton}>
              <ChevronLeft size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.monthYear}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={styles.monthButton}>
              <ChevronRight size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.weekDaysRow}>
            {weekDays.map((day, index) => (
              <View key={index} style={styles.weekDayCell}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarData.map((day, index) => {
              const dayAppointments = getAppointmentsForDay(day);
              const isToday = day === new Date().getDate() && 
                              currentDate.getMonth() === new Date().getMonth() && 
                              currentDate.getFullYear() === new Date().getFullYear();
              
              return (
                <View key={index} style={styles.dayCell}>
                  {day ? (
                    <>
                      <View style={[styles.dayNumber, isToday && styles.dayNumberToday]}>
                        <Text style={[styles.dayText, isToday && styles.dayTextToday]}>
                          {day}
                        </Text>
                      </View>
                      {dayAppointments.length > 0 && (
                        <View style={styles.appointmentDots}>
                          {dayAppointments.slice(0, 3).map((_, i) => (
                            <View key={i} style={styles.dot} />
                          ))}
                        </View>
                      )}
                    </>
                  ) : null}
                </View>
              );
            })}
          </View>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.dashboard.upcomingAppointments}</Text>
          {appointments
            .filter(a => {
              const today = new Date();
              const appointmentDate = new Date(a.date);
              return appointmentDate >= today && (a.status === 'scheduled' || a.status === 'confirmed');
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5)
            .map(appointment => (
              <Card key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.appointmentRow}>
                  <View style={styles.appointmentDate}>
                    <Text style={styles.appointmentDay}>
                      {new Date(appointment.date).getDate()}
                    </Text>
                    <Text style={styles.appointmentMonth}>
                      {monthNames[new Date(appointment.date).getMonth()].substring(0, 3)}
                    </Text>
                  </View>
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.patientName}>{appointment.patientName}</Text>
                    <Text style={styles.appointmentTime}>
                      {appointment.time} • {appointment.duration} min
                    </Text>
                    {appointment.room && (
                      <Text style={styles.appointmentRoom}>{appointment.room}</Text>
                    )}
                  </View>
                  <Badge
                    label={appointment.status === 'confirmed' ? 'Bestätigt' : 'Geplant'}
                    variant={appointment.status === 'confirmed' ? 'success' : 'info'}
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
  calendarCard: {
    marginBottom: 24,
    padding: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthButton: {
    padding: 8,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#000000',
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#8E8E93',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberToday: {
    backgroundColor: '#007AFF',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#000000',
  },
  dayTextToday: {
    color: '#FFFFFF',
  },
  appointmentDots: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#007AFF',
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
    marginTop: 2,
  },
});
