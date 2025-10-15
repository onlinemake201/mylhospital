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
  Image,
} from 'react-native';
import { Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { UserPlus, Search, MoreVertical, Lock, Trash2, Power, UserCog, Settings, Building2, Upload, Languages } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { useUserManagement } from '@/contexts/UserManagementContext';
import { useHospital } from '@/contexts/HospitalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { User, UserRole } from '@/types';

export default function AdminScreen() {
  const { user: currentUser } = useAuth();
  const { users, createUser, updateUser, deleteUser, toggleUserStatus, resetPassword, isLoading } = useUserManagement();
  const { hospitalSettings, updateHospitalSettings } = useHospital();
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('doctor');
  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'language'>('users');
  const [settingsForm, setSettingsForm] = useState({
    name: hospitalSettings.name,
    address: hospitalSettings.address,
    phone: hospitalSettings.phone,
    email: hospitalSettings.email,
    website: hospitalSettings.website || '',
    taxId: hospitalSettings.taxId || '',
  });

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
    setSelectedUser(user);
    setNewPassword('');
    setShowActionsModal(false);
    setShowResetPasswordModal(true);
  };

  const handleConfirmResetPassword = async () => {
    if (!selectedUser || !newPassword) {
      Alert.alert('Fehler', 'Bitte geben Sie ein neues Passwort ein');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Fehler', 'Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }
    try {
      await resetPassword(selectedUser.id, newPassword);
      setShowResetPasswordModal(false);
      setNewPassword('');
      Alert.alert('Erfolg', `Passwort für ${selectedUser.name} wurde zurückgesetzt`);
    } catch {
      Alert.alert('Fehler', 'Passwort konnte nicht zurückgesetzt werden');
    }
  };

  const handleSaveSettings = async () => {
    if (!settingsForm.name || !settingsForm.address) {
      Alert.alert('Fehler', 'Name und Adresse sind Pflichtfelder');
      return;
    }
    try {
      await updateHospitalSettings(settingsForm);
      setShowSettingsModal(false);
      Alert.alert('Erfolg', 'Einstellungen gespeichert');
    } catch {
      Alert.alert('Fehler', 'Einstellungen konnten nicht gespeichert werden');
    }
  };

  const handlePickLogo = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Berechtigung erforderlich', 'Bitte erlauben Sie den Zugriff auf Ihre Fotos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const base64Image = result.assets[0].base64;
        if (base64Image) {
          const dataUri = `data:image/jpeg;base64,${base64Image}`;
          await updateHospitalSettings({ logo: dataUri });
          Alert.alert('Erfolg', 'Logo hochgeladen');
        }
      }
    } catch (error) {
      console.error('Error picking logo:', error);
      Alert.alert('Fehler', 'Logo konnte nicht hochgeladen werden');
    }
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
          title: 'Administration',
          headerLargeTitle: true,
        }}
      />
      <View style={styles.container}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'users' && styles.tabButtonActive]}
            onPress={() => setActiveTab('users')}
          >
            <UserCog size={20} color={activeTab === 'users' ? '#007AFF' : '#8E8E93'} />
            <Text style={[styles.tabButtonText, activeTab === 'users' && styles.tabButtonTextActive]}>
              {t.admin.users}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'settings' && styles.tabButtonActive]}
            onPress={() => setActiveTab('settings')}
          >
            <Building2 size={20} color={activeTab === 'settings' ? '#007AFF' : '#8E8E93'} />
            <Text style={[styles.tabButtonText, activeTab === 'settings' && styles.tabButtonTextActive]}>
              {t.admin.hospital}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'language' && styles.tabButtonActive]}
            onPress={() => setActiveTab('language')}
          >
            <Languages size={20} color={activeTab === 'language' ? '#007AFF' : '#8E8E93'} />
            <Text style={[styles.tabButtonText, activeTab === 'language' && styles.tabButtonTextActive]}>
              {t.admin.language}
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'users' ? (
          <>
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
          </>
        ) : activeTab === 'settings' ? (
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            <Card style={styles.settingsCard}>
              <View style={styles.settingsHeader}>
                <Building2 size={24} color="#007AFF" />
                <Text style={styles.settingsTitle}>Krankenhauseinstellungen</Text>
              </View>
              <Text style={styles.settingsDescription}>
                Diese Informationen werden auf allen Rechnungen angezeigt
              </Text>
            </Card>

            <Card style={styles.settingsCard}>
              <Text style={styles.sectionTitle}>Logo</Text>
              <View style={styles.logoSection}>
                {hospitalSettings.logo ? (
                  <Image source={{ uri: hospitalSettings.logo }} style={styles.logoPreview} />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Building2 size={48} color="#C7C7CC" />
                  </View>
                )}
                <TouchableOpacity style={styles.uploadButton} onPress={handlePickLogo}>
                  <Upload size={20} color="#007AFF" />
                  <Text style={styles.uploadButtonText}>Logo hochladen</Text>
                </TouchableOpacity>
              </View>
            </Card>

            <Card style={styles.settingsCard}>
              <Text style={styles.sectionTitle}>Krankenhaus-Informationen</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  setSettingsForm({
                    name: hospitalSettings.name,
                    address: hospitalSettings.address,
                    phone: hospitalSettings.phone,
                    email: hospitalSettings.email,
                    website: hospitalSettings.website || '',
                    taxId: hospitalSettings.taxId || '',
                  });
                  setShowSettingsModal(true);
                }}
              >
                <Settings size={20} color="#007AFF" />
                <Text style={styles.editButtonText}>Bearbeiten</Text>
              </TouchableOpacity>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>{hospitalSettings.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Adresse:</Text>
                <Text style={styles.infoValue}>{hospitalSettings.address}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Telefon:</Text>
                <Text style={styles.infoValue}>{hospitalSettings.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>E-Mail:</Text>
                <Text style={styles.infoValue}>{hospitalSettings.email}</Text>
              </View>
              {hospitalSettings.website && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Website:</Text>
                  <Text style={styles.infoValue}>{hospitalSettings.website}</Text>
                </View>
              )}
              {hospitalSettings.taxId && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Steuernummer:</Text>
                  <Text style={styles.infoValue}>{hospitalSettings.taxId}</Text>
                </View>
              )}
            </Card>
          </ScrollView>
        ) : (
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            <Card style={styles.settingsCard}>
              <View style={styles.settingsHeader}>
                <Languages size={24} color="#007AFF" />
                <Text style={styles.settingsTitle}>{t.admin.languageSettings}</Text>
              </View>
              <Text style={styles.settingsDescription}>
                {t.admin.selectLanguage}
              </Text>
            </Card>

            <Card style={styles.settingsCard}>
              <Text style={styles.sectionTitle}>{t.admin.language}</Text>
              <View style={styles.languageOptions}>
                <TouchableOpacity
                  style={[
                    styles.languageOption,
                    language === 'de' && styles.languageOptionActive,
                  ]}
                  onPress={() => updateHospitalSettings({ language: 'de' })}
                >
                  <View style={styles.languageContent}>
                    <Text style={styles.languageFlag}>🇩🇪</Text>
                    <View style={styles.languageInfo}>
                      <Text style={[
                        styles.languageLabel,
                        language === 'de' && styles.languageLabelActive,
                      ]}>
                        {t.admin.german}
                      </Text>
                      <Text style={styles.languageSubLabel}>Deutsch</Text>
                    </View>
                  </View>
                  {language === 'de' && (
                    <View style={styles.checkMark}>
                      <Text style={styles.checkMarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.languageOption,
                    language === 'en' && styles.languageOptionActive,
                  ]}
                  onPress={() => updateHospitalSettings({ language: 'en' })}
                >
                  <View style={styles.languageContent}>
                    <Text style={styles.languageFlag}>🇬🇧</Text>
                    <View style={styles.languageInfo}>
                      <Text style={[
                        styles.languageLabel,
                        language === 'en' && styles.languageLabelActive,
                      ]}>
                        {t.admin.english}
                      </Text>
                      <Text style={styles.languageSubLabel}>English</Text>
                    </View>
                  </View>
                  {language === 'en' && (
                    <View style={styles.checkMark}>
                      <Text style={styles.checkMarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </Card>
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

        <Modal
          visible={showSettingsModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowSettingsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Krankenhaus-Einstellungen</Text>
              
              <ScrollView style={styles.formScroll}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Krankenhausname"
                  value={settingsForm.name}
                  onChangeText={(text) => setSettingsForm({ ...settingsForm, name: text })}
                />
                
                <Text style={styles.inputLabel}>Adresse *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Straße, PLZ, Stadt"
                  value={settingsForm.address}
                  onChangeText={(text) => setSettingsForm({ ...settingsForm, address: text })}
                  multiline
                  numberOfLines={3}
                />

                <Text style={styles.inputLabel}>Telefon</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+49 123 456789"
                  value={settingsForm.phone}
                  onChangeText={(text) => setSettingsForm({ ...settingsForm, phone: text })}
                  keyboardType="phone-pad"
                />

                <Text style={styles.inputLabel}>E-Mail</Text>
                <TextInput
                  style={styles.input}
                  placeholder="info@krankenhaus.de"
                  value={settingsForm.email}
                  onChangeText={(text) => setSettingsForm({ ...settingsForm, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Text style={styles.inputLabel}>Website</Text>
                <TextInput
                  style={styles.input}
                  placeholder="www.krankenhaus.de"
                  value={settingsForm.website}
                  onChangeText={(text) => setSettingsForm({ ...settingsForm, website: text })}
                  autoCapitalize="none"
                />

                <Text style={styles.inputLabel}>Steuernummer</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DE123456789"
                  value={settingsForm.taxId}
                  onChangeText={(text) => setSettingsForm({ ...settingsForm, taxId: text })}
                />
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowSettingsModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Abbrechen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleSaveSettings}
                >
                  <Text style={styles.confirmButtonText}>Speichern</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showResetPasswordModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowResetPasswordModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Passwort zurücksetzen</Text>
              <Text style={styles.modalSubtitle}>{selectedUser?.name}</Text>
              
              <Text style={styles.inputLabel}>Neues Passwort *</Text>
              <TextInput
                style={styles.input}
                placeholder="Mindestens 6 Zeichen"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowResetPasswordModal(false);
                    setNewPassword('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Abbrechen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleConfirmResetPassword}
                >
                  <Text style={styles.confirmButtonText}>Zurücksetzen</Text>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#007AFF',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#8E8E93',
  },
  tabButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600' as const,
  },
  settingsCard: {
    marginBottom: 16,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#000000',
  },
  settingsDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#000000',
    marginBottom: 16,
  },
  logoSection: {
    alignItems: 'center',
    gap: 16,
  },
  logoPreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#E5F3FF',
    borderRadius: 12,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  editButton: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E5F3FF',
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  infoLabel: {
    fontSize: 15,
    color: '#8E8E93',
    width: 100,
    fontWeight: '500' as const,
  },
  infoValue: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
  },
  formScroll: {
    maxHeight: 400,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  languageOptions: {
    gap: 12,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageOptionActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E5F3FF',
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  languageFlag: {
    fontSize: 32,
  },
  languageInfo: {
    flexDirection: 'column',
  },
  languageLabel: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#000000',
    marginBottom: 4,
  },
  languageLabelActive: {
    color: '#007AFF',
  },
  languageSubLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  checkMark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMarkText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
  },
});
