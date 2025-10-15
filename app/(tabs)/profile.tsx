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
  Image,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { LogOut, Camera, Edit2, Save, X } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [editedAvatar, setEditedAvatar] = useState(user?.avatar || '');
  const [tempAvatarUrl, setTempAvatarUrl] = useState('');

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Nicht angemeldet</Text>
      </View>
    );
  }

  const handleLogout = async () => {
    Alert.alert(
      'Abmelden',
      'Möchten Sie sich wirklich abmelden?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Abmelden',
          style: 'destructive',
          onPress: async () => {
            console.log('Profile: Logout button pressed');
            try {
              const result = await logout();
              console.log('Profile: Logout result:', result);
              if (result.success) {
                console.log('Profile: Logout successful, navigating to login...');
                router.replace('/login');
              } else {
                Alert.alert('Fehler', result.error || 'Abmeldung fehlgeschlagen');
              }
            } catch (error) {
              console.error('Profile: Logout error:', error);
              Alert.alert('Fehler', 'Abmeldung fehlgeschlagen');
            }
          },
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        name: editedName,
        avatar: editedAvatar,
      });
      setIsEditing(false);
      Alert.alert('Erfolg', 'Profil erfolgreich aktualisiert');
    } catch {
      Alert.alert('Fehler', 'Profil konnte nicht aktualisiert werden');
    }
  };

  const handleChangeAvatar = () => {
    setTempAvatarUrl(editedAvatar);
    setShowImageModal(true);
  };

  const roleLabels: Record<string, string> = {
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
          title: 'Profil',
          headerLargeTitle: true,
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <LogOut size={22} color="#FF3B30" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Card style={styles.profileCard}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {editedAvatar ? (
                <Image source={{ uri: editedAvatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
              )}
              {isEditing && (
                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={handleChangeAvatar}
                >
                  <Camera size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.infoSection}>
            {isEditing ? (
              <View style={styles.editContainer}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="Vollständiger Name"
                />
              </View>
            ) : (
              <Text style={styles.name}>{user.name}</Text>
            )}
            <Text style={styles.email}>{user.email}</Text>
            <View style={styles.badgeContainer}>
              <Badge label={roleLabels[user.role] || user.role} variant="info" />
              <Badge
                label={user.isActive ? 'Aktiv' : 'Inaktiv'}
                variant={user.isActive ? 'success' : 'danger'}
              />
            </View>
          </View>

          <View style={styles.actions}>
            {isEditing ? (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => {
                    setIsEditing(false);
                    setEditedName(user.name);
                    setEditedAvatar(user.avatar || '');
                  }}
                >
                  <X size={20} color="#000000" />
                  <Text style={styles.cancelButtonText}>Abbrechen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.saveButton]}
                  onPress={handleSaveProfile}
                >
                  <Save size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Speichern</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => setIsEditing(true)}
              >
                <Edit2 size={20} color="#007AFF" />
                <Text style={styles.editButtonText}>Profil bearbeiten</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        <Card style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Krankenhaus ID</Text>
            <Text style={styles.detailValue}>{user.hospitalId}</Text>
          </View>

          {user.departmentId && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Abteilung ID</Text>
              <Text style={styles.detailValue}>{user.departmentId}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Erstellt am</Text>
            <Text style={styles.detailValue}>
              {new Date(user.createdAt).toLocaleDateString('de-DE')}
            </Text>
          </View>

          {user.lastLogin && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Letzter Login</Text>
              <Text style={styles.detailValue}>
                {new Date(user.lastLogin).toLocaleString('de-DE')}
              </Text>
            </View>
          )}
        </Card>

        <TouchableOpacity style={styles.logoutCard} onPress={handleLogout}>
          <LogOut size={24} color="#FF3B30" />
          <Text style={styles.logoutText}>Abmelden</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showImageModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profilbild ändern</Text>
              <TouchableOpacity onPress={() => setShowImageModal(false)}>
                <X size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Bild-URL eingeben:</Text>
              <TextInput
                style={styles.modalInput}
                value={tempAvatarUrl}
                onChangeText={setTempAvatarUrl}
                placeholder="https://example.com/avatar.jpg"
                autoCapitalize="none"
              />

              {tempAvatarUrl && (
                <View style={styles.previewContainer}>
                  <Text style={styles.previewLabel}>Vorschau:</Text>
                  <Image
                    source={{ uri: tempAvatarUrl }}
                    style={styles.previewImage}
                    onError={() => Alert.alert('Fehler', 'Bild konnte nicht geladen werden')}
                  />
                </View>
              )}

              <Text style={styles.suggestionText}>
                Oder wählen Sie ein vordefiniertes Bild:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                  <TouchableOpacity
                    key={num}
                    onPress={() => setTempAvatarUrl(`https://i.pravatar.cc/150?img=${num}`)}
                  >
                    <Image
                      source={{ uri: `https://i.pravatar.cc/150?img=${num}` }}
                      style={styles.suggestionImage}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowImageModal(false)}
              >
                <Text style={styles.modalCancelText}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={() => {
                  setEditedAvatar(tempAvatarUrl);
                  setShowImageModal(false);
                }}
              >
                <Text style={styles.modalConfirmText}>Übernehmen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  profileCard: {
    marginBottom: 16,
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '600' as const,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  infoSection: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  editContainer: {
    width: '100%',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#000000',
  },
  name: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#000000',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  editButton: {
    backgroundColor: '#E5F3FF',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000000',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  detailsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#000000',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  detailLabel: {
    fontSize: 15,
    color: '#8E8E93',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#000000',
  },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  logoutText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#FF3B30',
  },
  logoutButton: {
    marginRight: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 40,
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
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#000000',
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#000000',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#000000',
    marginBottom: 16,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  suggestionText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  suggestionImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  modalButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#F2F2F7',
  },
  modalCancelText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#000000',
  },
  modalConfirmButton: {
    backgroundColor: '#007AFF',
  },
  modalConfirmText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
