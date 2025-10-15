import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { UserPlus, Search, MoreVertical, Lock, Trash2, Power, UserCog } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { useUserManagement } from '@/contexts/UserManagementContext';
import { User, UserRole } from '@/types';

export default function AdminScreen() {
  const { user: currentUser } = useAuth();
  const { users, createUser, updateUser, deleteUser, toggleUserStatus, resetPassword, isLoading } = useUserManagement();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('doctor');

  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    role: 'doctor' as UserRole,
    hospitalId: 'hosp-001',
    departmentId: '',
  });

  if (currentUser?.role !== 'superadmin' && currentUser?.role !== 'hospital_admin') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Keine Berechtigung für diese Seite</Text>
      </View>
    );
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateUser = async () => {
    if (!newUserData.name || !newUserData.email) {
      Alert.alert('Fehler', 'Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    try {
      await createUser(newUserData);
      setShowCreateModal(false);
      setNewUserData({
        name: '',
        email: '',
        role: 'doctor',
        hospitalId: 'hosp-001',
        departmentId: '',
      });
      Alert.alert('Erfolg', 'Benutzer erfolgreich erstellt');
    } catch {
      Alert.alert('Fehler', 'Benutzer konnte nicht erstellt werden');
    }
  };

  const handleDeleteUser = (user: User) => {
    Alert.alert(
      'Benutzer löschen',
      `Möchten Sie ${user.name} wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            await deleteUser(user.id);
            setShowActionsModal(false);
            Alert.alert('Erfolg', 'Benutzer gelöscht');
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (user: User) => {
    await toggleUserStatus(user.id);
    setShowActionsModal(false);
    Alert.alert('Erfolg', user.isActive ? 'Benutzer deaktiviert' : 'Benutzer aktiviert');
  };

  const handleResetPassword = (user: User) => {
    Alert.prompt(
      'Passwort zurücksetzen',
      `Neues Passwort für ${user.name}:`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Zurücksetzen',
          onPress: async (password) => {
            if (password) {
              await resetPassword(user.id, password);
              setShowActionsModal(false);
              Alert.alert('Erfolg', 'Passwort zurückgesetzt');
            }
          },
        },
      ],
      'secure-text'
    );
  };

  const handleChangeRole = (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setShowActionsModal(false);
    setShowRoleModal(true);
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;
    try {
      await updateUser(selectedUser.id, { role: selectedRole });
      setShowRoleModal(false);
      Alert.alert('Erfolg', 'Rolle erfolgreich geändert');
    } catch {
      Alert.alert('Fehler', 'Rolle konnte nicht geändert werden');
    }
  };

  const roleLabels: Record<UserRole, string> = {
    superadmin: 'Superadmin',
    hospital_admin: 'Krankenhaus Admin',
    doctor: 'Arzt',
    nurse: 'Pflege',
    pharmacist: 'Apotheke',
    lab_technician: 'Labor',
    radiologist: 'Radiologie',
    or_staff: 'OP',
    emergency: 'Notaufnahme',
    billing: 'Abrechnung',
    reception: 'Empfang',
    patient: 'Patient',
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Benutzerverwaltung',
          headerLargeTitle: true,
        }}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#8E8E93" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Benutzer suchen..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <UserPlus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {filteredUsers.map(user => (
              <Card key={user.id} style={styles.userCard}>
                <View style={styles.userHeader}>
                  <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </Text>
                    </View>
                    <View style={styles.userDetails}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <Text style={styles.userEmail}>{user.email}</Text>
                      <View style={styles.userMeta}>
                        <Badge label={roleLabels[user.role]} variant="info" />
                        <Badge
                          label={user.isActive ? 'Aktiv' : 'Inaktiv'}
                          variant={user.isActive ? 'success' : 'danger'}
                        />
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedUser(user);
                      setShowActionsModal(true);
                    }}
                  >
                    <MoreVertical size={20} color="#8E8E93" />
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </ScrollView>
        )}

        <Modal
          visible={showCreateModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Neuer Benutzer</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={newUserData.name}
                onChangeText={(text) => setNewUserData({ ...newUserData, name: text })}
              />
              
              <TextInput
                style={styles.input}
                placeholder="E-Mail"
                value={newUserData.email}
                onChangeText={(text) => setNewUserData({ ...newUserData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <View style={styles.roleSelector}>
                <Text style={styles.inputLabel}>Rolle:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {Object.entries(roleLabels).map(([role, label]) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleButton,
                        newUserData.role === role && styles.roleButtonActive,
                      ]}
                      onPress={() => setNewUserData({ ...newUserData, role: role as UserRole })}
                    >
                      <Text
                        style={[
                          styles.roleButtonText,
                          newUserData.role === role && styles.roleButtonTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Abbrechen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleCreateUser}
                >
                  <Text style={styles.confirmButtonText}>Erstellen</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showActionsModal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowActionsModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowActionsModal(false)}
          >
            <View style={styles.actionsModal}>
              <Text style={styles.actionsTitle}>{selectedUser?.name}</Text>
              
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => selectedUser && handleToggleStatus(selectedUser)}
              >
                <Power size={20} color={selectedUser?.isActive ? '#FF3B30' : '#34C759'} />
                <Text style={styles.actionText}>
                  {selectedUser?.isActive ? 'Deaktivieren' : 'Aktivieren'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => selectedUser && handleChangeRole(selectedUser)}
              >
                <UserCog size={20} color="#007AFF" />
                <Text style={styles.actionText}>Rolle ändern</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => selectedUser && handleResetPassword(selectedUser)}
              >
                <Lock size={20} color="#007AFF" />
                <Text style={styles.actionText}>Passwort zurücksetzen</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => selectedUser && handleDeleteUser(selectedUser)}
              >
                <Trash2 size={20} color="#FF3B30" />
                <Text style={[styles.actionText, styles.dangerText]}>Löschen</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal
          visible={showRoleModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowRoleModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Rolle ändern</Text>
              <Text style={styles.modalSubtitle}>{selectedUser?.name}</Text>

              <View style={styles.roleSelector}>
                <Text style={styles.inputLabel}>Neue Rolle:</Text>
                <ScrollView style={styles.roleScrollView} contentContainerStyle={styles.roleScrollContent}>
                  {Object.entries(roleLabels).map(([role, label]) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleOptionButton,
                        selectedRole === role && styles.roleOptionButtonActive,
                      ]}
                      onPress={() => setSelectedRole(role as UserRole)}
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          selectedRole === role && styles.roleOptionTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowRoleModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Abbrechen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleSaveRole}
                >
                  <Text style={styles.confirmButtonText}>Speichern</Text>
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
  header: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },
  createButton: {
    width: 44,
    height: 44,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  userCard: {
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600' as const,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#000000',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#000000',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#000000',
    marginBottom: 8,
  },
  roleSelector: {
    marginBottom: 20,
  },
  roleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  roleButtonActive: {
    backgroundColor: '#007AFF',
  },
  roleButtonText: {
    fontSize: 14,
    color: '#000000',
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
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
  actionsModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#000000',
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  actionText: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 12,
  },
  dangerText: {
    color: '#FF3B30',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 40,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 20,
    textAlign: 'center',
  },
  roleScrollView: {
    maxHeight: 300,
  },
  roleScrollContent: {
    gap: 8,
  },
  roleOptionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    marginBottom: 8,
  },
  roleOptionButtonActive: {
    backgroundColor: '#007AFF',
  },
  roleOptionText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500' as const,
  },
  roleOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
});
