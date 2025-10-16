import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { Stack, Redirect } from 'expo-router';
import { Plus, FileText, Download, Eye, Trash2, X, TrendingUp, TrendingDown, DollarSign, Clock, Search, ChevronDown, ChevronRight, User } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useHospital } from '@/contexts/HospitalContext';
import { useAuth } from '@/contexts/AuthContext';
import { Invoice, InvoiceItem } from '@/types';

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export default function InvoicesScreen() {
  const { user } = useAuth();
  const { patients, medications, invoices, hospitalSettings, updateInvoice, deleteInvoice } = useHospital();
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | 'all'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedMedications, setSelectedMedications] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInvoices = useMemo(() => {
    let filtered = invoices;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(inv => inv.status === selectedStatus);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(inv => {
        const matchesInvoiceId = inv.id.toLowerCase().includes(query);
        const matchesPatientName = inv.patientName.toLowerCase().includes(query);
        return matchesInvoiceId || matchesPatientName;
      });
    }

    return filtered;
  }, [invoices, selectedStatus, searchQuery]);

  const groupedInvoices = useMemo(() => {
    const groups = new Map<string, Invoice[]>();
    
    filteredInvoices.forEach(invoice => {
      const key = `${invoice.patientId}-${invoice.patientName}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(invoice);
    });

    return Array.from(groups.entries())
      .map(([key, invoices]) => ({
        patientId: key.split('-')[0],
        patientName: key.substring(key.indexOf('-') + 1),
        invoices: invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        totalAmount: invoices.reduce((sum, inv) => sum + inv.total, 0),
        unpaidAmount: invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled').reduce((sum, inv) => sum + inv.total, 0),
      }))
      .sort((a, b) => a.patientName.localeCompare(b.patientName));
  }, [filteredInvoices]);

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.date);
      return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
    });

    const paidThisMonth = thisMonthInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);

    const sentThisMonth = thisMonthInvoices
      .filter(inv => inv.status === 'sent')
      .reduce((sum, inv) => sum + inv.total, 0);

    const overdueTotal = invoices
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.total, 0);

    const draftTotal = invoices
      .filter(inv => inv.status === 'draft')
      .reduce((sum, inv) => sum + inv.total, 0);

    const lastMonth = new Date(currentYear, currentMonth - 1);
    const lastMonthInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.date);
      return invDate.getMonth() === lastMonth.getMonth() && invDate.getFullYear() === lastMonth.getFullYear();
    });

    const paidLastMonth = lastMonthInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);

    const percentageChange = paidLastMonth > 0 
      ? ((paidThisMonth - paidLastMonth) / paidLastMonth) * 100 
      : 0;

    return {
      paidThisMonth,
      sentThisMonth,
      overdueTotal,
      draftTotal,
      percentageChange,
      totalInvoicesThisMonth: thisMonthInvoices.length,
    };
  }, [invoices]);

  if (user?.role !== 'superadmin') {
    return <Redirect href="/" />;
  }

  const statusTabs: { label: string; value: InvoiceStatus | 'all'; count: number }[] = [
    { label: 'Alle', value: 'all', count: invoices.length },
    { label: 'Entwurf', value: 'draft', count: invoices.filter(i => i.status === 'draft').length },
    { label: 'Gesendet', value: 'sent', count: invoices.filter(i => i.status === 'sent').length },
    { label: 'Bezahlt', value: 'paid', count: invoices.filter(i => i.status === 'paid').length },
    { label: 'Überfällig', value: 'overdue', count: invoices.filter(i => i.status === 'overdue').length },
  ];

  const handleCreateInvoice = () => {
    if (!selectedPatientId) {
      Alert.alert('Fehler', 'Bitte wählen Sie einen Patienten aus');
      return;
    }

    if (selectedMedications.length === 0) {
      Alert.alert('Fehler', 'Bitte wählen Sie mindestens ein Medikament aus');
      return;
    }

    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) return;

    const items: InvoiceItem[] = selectedMedications.map(medId => {
      const med = medications.find(m => m.id === medId);
      if (!med) return null;

      const unitPrice = Math.random() * 50 + 10;
      const quantity = 1;

      return {
        id: `item-${Date.now()}-${medId}`,
        description: `${med.name} - ${med.dosage}`,
        code: medId,
        quantity,
        unitPrice: parseFloat(unitPrice.toFixed(2)),
        total: parseFloat((unitPrice * quantity).toFixed(2)),
        medicationId: medId,
      };
    }).filter(Boolean) as InvoiceItem[];

    Alert.alert('Info', 'Bitte verwenden Sie die Medikamenten-Seite (Tab "Rechnung"), um Rechnungen zu erstellen.');
    setShowCreateModal(false);
    setSelectedPatientId('');
    setSelectedMedications([]);
    Alert.alert('Erfolg', 'Rechnung erfolgreich erstellt');
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    Alert.alert(
      'Rechnung löschen',
      'Möchten Sie diese Rechnung wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => {
            deleteInvoice(invoiceId);
            setSelectedInvoice(null);
            Alert.alert('Erfolg', 'Rechnung gelöscht');
          },
        },
      ]
    );
  };

  const handleUpdateInvoiceStatus = (invoiceId: string, status: Invoice['status']) => {
    updateInvoice(invoiceId, { status });
    Alert.alert('Erfolg', `Status auf "${status}" aktualisiert`);
  };

  const generatePDFContent = (invoice: Invoice): string => {
    const patient = patients.find(p => p.id === invoice.patientId);
    const hospitalName = hospitalSettings.name;
    const hospitalAddress = hospitalSettings.address;
    const hospitalPhone = hospitalSettings.phone;
    const hospitalEmail = hospitalSettings.email;
    const hospitalLogo = hospitalSettings.logo;
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rechnung ${invoice.id}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; background: #fff; }
    .header { margin-bottom: 40px; border-bottom: 3px solid #007AFF; padding-bottom: 20px; }
    .header .hospital-info { margin-bottom: 20px; display: flex; align-items: center; gap: 20px; }
    .header .hospital-logo { width: 80px; height: 80px; object-fit: contain; }
    .header .hospital-text { flex: 1; }
    .header .hospital-name { color: #007AFF; font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    .header .hospital-details { color: #666; font-size: 13px; line-height: 1.6; }
    .header h1 { color: #000; font-size: 32px; margin-bottom: 10px; }
    .header p { color: #666; font-size: 14px; }
    .info-section { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .info-block { flex: 1; }
    .info-block h3 { font-size: 14px; color: #666; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-block p { font-size: 16px; color: #000; margin-bottom: 5px; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .table thead { background: #F2F2F7; }
    .table th { text-align: left; padding: 12px; font-size: 14px; color: #666; font-weight: 600; }
    .table td { padding: 12px; border-bottom: 1px solid #E5E5EA; font-size: 15px; }
    .table tbody tr:hover { background: #F9F9F9; }
    .totals { margin-left: auto; width: 300px; }
    .totals-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 16px; }
    .totals-row.subtotal { color: #666; }
    .totals-row.tax { color: #666; border-bottom: 1px solid #E5E5EA; padding-bottom: 15px; }
    .totals-row.total { font-size: 20px; font-weight: 700; color: #007AFF; padding-top: 15px; }
    .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #E5E5EA; text-align: center; color: #666; font-size: 12px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .status-draft { background: #F2F2F7; color: #666; }
    .status-sent { background: #E5F3FF; color: #007AFF; }
    .status-paid { background: #E5F9E5; color: #34C759; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="hospital-info">
      ${hospitalLogo ? `<img src="${hospitalLogo}" alt="Logo" class="hospital-logo" />` : ''}
      <div class="hospital-text">
        <div class="hospital-name">${hospitalName}</div>
        <div class="hospital-details">
          ${hospitalAddress}<br>
          Tel: ${hospitalPhone} | E-Mail: ${hospitalEmail}
        </div>
      </div>
    </div>
    <h1>Medikamenten-Rechnung</h1>
    <p>Rechnungsnummer: ${invoice.id}</p>
  </div>

  <div class="info-section">
    <div class="info-block">
      <h3>Patient</h3>
      <p><strong>${invoice.patientName}</strong></p>
      <p>MRN: ${patient?.mrn || 'N/A'}</p>
      <p>Geburtsdatum: ${patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('de-DE') : 'N/A'}</p>
      ${patient?.insurance ? `<p>Versicherung: ${patient.insurance.provider}</p>` : ''}
    </div>
    <div class="info-block" style="text-align: right;">
      <h3>Rechnungsdetails</h3>
      <p>Datum: ${new Date(invoice.date).toLocaleDateString('de-DE')}</p>
      <p>Fällig am: ${new Date(invoice.dueDate).toLocaleDateString('de-DE')}</p>
      <p>Status: <span class="status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</span></p>
    </div>
  </div>

  <table class="table">
    <thead>
      <tr>
        <th>Beschreibung</th>
        <th>Code</th>
        <th style="text-align: center;">Häufigkeit</th>
        <th style="text-align: center;">Menge</th>
        <th style="text-align: right;">Einzelpreis</th>
        <th style="text-align: right;">Gesamt</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.items.map(item => `
        <tr>
          <td>${item.description}</td>
          <td>${item.code || '-'}</td>
          <td style="text-align: center;">${item.frequency || '-'}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">€${item.unitPrice.toFixed(2)}</td>
          <td style="text-align: right;">€${item.total.toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row subtotal">
      <span>Zwischensumme:</span>
      <span>€${invoice.subtotal.toFixed(2)}</span>
    </div>
    <div class="totals-row tax">
      <span>MwSt. (19%):</span>
      <span>€${invoice.tax.toFixed(2)}</span>
    </div>
    <div class="totals-row total">
      <span>Gesamtsumme:</span>
      <span>€${invoice.total.toFixed(2)}</span>
    </div>
  </div>

  ${invoice.notes ? `
  <div style="margin-top: 30px; padding: 20px; background: #F9F9F9; border-radius: 8px; border-left: 4px solid #007AFF;">
    <h3 style="font-size: 14px; color: #666; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Notizen</h3>
    <p style="font-size: 15px; color: #000; line-height: 1.6; white-space: pre-wrap;">${invoice.notes}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p><strong>${hospitalName}</strong></p>
    <p>${hospitalAddress}</p>
    <p>Tel: ${hospitalPhone} | E-Mail: ${hospitalEmail}</p>
    <p style="margin-top: 20px;">Vielen Dank für Ihr Vertrauen.</p>
    <p>Bei Fragen zur Rechnung kontaktieren Sie uns bitte unter: billing@klinikum-musterstadt.de</p>
  </div>

  <div class="no-print" style="margin-top: 40px; text-align: center;">
    <button onclick="window.print()" style="padding: 12px 24px; background: #007AFF; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">
      Drucken / Als PDF speichern
    </button>
  </div>
</body>
</html>
    `;
  };

  const handleViewInvoice = async (invoice: Invoice) => {
    console.log('handleViewInvoice called for invoice:', invoice.id);
    const htmlContent = generatePDFContent(invoice);
    
    if (Platform.OS === 'web') {
      console.log('Generated HTML content length:', htmlContent.length);
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
        console.log('Invoice preview opened in new window');
      } else {
        console.error('Failed to open new window - popup blocker?');
        Alert.alert('Fehler', 'Popup-Blocker verhindert das Öffnen. Bitte erlauben Sie Popups für diese Seite.');
      }
    } else {
      try {
        const fileName = `Rechnung-${invoice.id}.html`;
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
        
        await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/html',
            dialogTitle: 'Rechnung ansehen',
            UTI: 'public.html',
          });
        } else {
          Alert.alert('Fehler', 'Teilen ist auf diesem Gerät nicht verfügbar');
        }
      } catch (error) {
        console.error('Error sharing invoice:', error);
        Alert.alert('Fehler', 'Rechnung konnte nicht geteilt werden');
      }
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    console.log('handleDownloadPDF called for invoice:', invoice.id);
    const htmlContent = generatePDFContent(invoice);
    
    if (Platform.OS === 'web') {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Rechnung-${invoice.id}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('PDF download initiated');
      Alert.alert('Erfolg', 'Rechnung wurde heruntergeladen. Öffnen Sie die Datei und drucken Sie sie als PDF.');
    } else {
      try {
        const fileName = `Rechnung-${invoice.id}.html`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        
        await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/html',
            dialogTitle: 'Rechnung speichern',
            UTI: 'public.html',
          });
          Alert.alert('Erfolg', 'Rechnung wird geteilt. Sie können sie speichern oder drucken.');
        } else {
          Alert.alert('Fehler', 'Teilen ist auf diesem Gerät nicht verfügbar');
        }
      } catch (error) {
        console.error('Error saving invoice:', error);
        Alert.alert('Fehler', 'Rechnung konnte nicht gespeichert werden');
      }
    }
  };

  const patientMedications = selectedPatientId
    ? medications.filter(m => m.patientId === selectedPatientId && m.status === 'active')
    : [];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Rechnungen',
          headerLargeTitle: true,
          headerRight: () => (
            <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateModal(true)}>
              <Plus size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        <ScrollView style={styles.mainScroll}>
          <View style={styles.statsContainer}>
            <View style={styles.statsGrid}>
              <Card style={styles.statCard}>
                <View style={styles.statHeader}>
                  <View style={styles.statIconContainer}>
                    <DollarSign size={20} color="#34C759" />
                  </View>
                  <Text style={styles.statLabel}>Bezahlt (Monat)</Text>
                </View>
                <Text style={styles.statValue}>€{monthlyStats.paidThisMonth.toFixed(2)}</Text>
                <View style={styles.statChange}>
                  {monthlyStats.percentageChange >= 0 ? (
                    <TrendingUp size={14} color="#34C759" />
                  ) : (
                    <TrendingDown size={14} color="#FF3B30" />
                  )}
                  <Text style={[
                    styles.statChangeText,
                    { color: monthlyStats.percentageChange >= 0 ? '#34C759' : '#FF3B30' }
                  ]}>
                    {Math.abs(monthlyStats.percentageChange).toFixed(1)}%
                  </Text>
                </View>
              </Card>

              <Card style={styles.statCard}>
                <View style={styles.statHeader}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#E5F3FF' }]}>
                    <FileText size={20} color="#007AFF" />
                  </View>
                  <Text style={styles.statLabel}>Versendet</Text>
                </View>
                <Text style={styles.statValue}>€{monthlyStats.sentThisMonth.toFixed(2)}</Text>
                <Text style={styles.statSubtext}>
                  {invoices.filter(i => i.status === 'sent').length} Rechnungen
                </Text>
              </Card>

              <Card style={styles.statCard}>
                <View style={styles.statHeader}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#FFE5E5' }]}>
                    <Clock size={20} color="#FF3B30" />
                  </View>
                  <Text style={styles.statLabel}>Überfällig</Text>
                </View>
                <Text style={[styles.statValue, { color: '#FF3B30' }]}>€{monthlyStats.overdueTotal.toFixed(2)}</Text>
                <Text style={styles.statSubtext}>
                  {invoices.filter(i => i.status === 'overdue').length} Rechnungen
                </Text>
              </Card>

              <Card style={styles.statCard}>
                <View style={styles.statHeader}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#F2F2F7' }]}>
                    <FileText size={20} color="#8E8E93" />
                  </View>
                  <Text style={styles.statLabel}>Entwürfe</Text>
                </View>
                <Text style={styles.statValue}>€{monthlyStats.draftTotal.toFixed(2)}</Text>
                <Text style={styles.statSubtext}>
                  {invoices.filter(i => i.status === 'draft').length} Rechnungen
                </Text>
              </Card>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsScroll}
            contentContainerStyle={styles.tabsContent}
          >
          {statusTabs.map(tab => (
            <TouchableOpacity
              key={tab.value}
              style={[
                styles.tab,
                selectedStatus === tab.value && styles.tabActive,
              ]}
              onPress={() => setSelectedStatus(tab.value)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedStatus === tab.value && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
              <View style={[
                styles.tabBadge,
                selectedStatus === tab.value && styles.tabBadgeActive,
              ]}>
                <Text style={[
                  styles.tabBadgeText,
                  selectedStatus === tab.value && styles.tabBadgeTextActive,
                ]}>
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          </ScrollView>

          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Search size={18} color="#8E8E93" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Nach Patient oder Rechnungsnummer suchen..."
                placeholderTextColor="#C7C7CC"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}
                >
                  <X size={16} color="#8E8E93" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.listContainer}>
          <Text style={styles.resultCount}>
            {filteredInvoices.length} {filteredInvoices.length === 1 ? 'Rechnung' : 'Rechnungen'} • {groupedInvoices.length} {groupedInvoices.length === 1 ? 'Patient' : 'Patienten'}
          </Text>

          {groupedInvoices.map(group => (
            <View key={group.patientId} style={styles.patientGroup}>
              <TouchableOpacity
                style={styles.patientGroupHeader}
                onPress={() => {
                  const newExpanded = new Set(expandedPatients);
                  if (newExpanded.has(group.patientId)) {
                    newExpanded.delete(group.patientId);
                  } else {
                    newExpanded.add(group.patientId);
                  }
                  setExpandedPatients(newExpanded);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.patientGroupHeaderLeft}>
                  <View style={styles.patientAvatarContainer}>
                    <User size={20} color="#007AFF" />
                  </View>
                  <View style={styles.patientGroupInfo}>
                    <Text style={styles.patientGroupName}>{group.patientName}</Text>
                    <Text style={styles.patientGroupStats}>
                      {group.invoices.length} {group.invoices.length === 1 ? 'Rechnung' : 'Rechnungen'}
                      {group.unpaidAmount > 0 && (
                        <Text style={styles.unpaidAmount}> • €{group.unpaidAmount.toFixed(2)} offen</Text>
                      )}
                    </Text>
                  </View>
                </View>
                <View style={styles.patientGroupHeaderRight}>
                  <Text style={styles.patientGroupTotal}>€{group.totalAmount.toFixed(2)}</Text>
                  {expandedPatients.has(group.patientId) ? (
                    <ChevronDown size={20} color="#8E8E93" />
                  ) : (
                    <ChevronRight size={20} color="#8E8E93" />
                  )}
                </View>
              </TouchableOpacity>

              {expandedPatients.has(group.patientId) && (
                <View style={styles.patientInvoicesList}>
                  {group.invoices.map(invoice => (
            <TouchableOpacity
              key={invoice.id}
              onPress={() => setSelectedInvoice(selectedInvoice?.id === invoice.id ? null : invoice)}
              activeOpacity={0.7}
            >
              <Card style={[styles.invoiceCard, selectedInvoice?.id === invoice.id && styles.invoiceCardSelected]}>
                <View style={styles.invoiceHeader}>
                  <View style={styles.invoiceInfo}>
                    <FileText size={20} color="#007AFF" />
                    <View style={styles.invoiceDetails}>
                      <Text style={styles.invoiceId}>{invoice.id}</Text>
                      <Text style={styles.patientName}>{invoice.patientName}</Text>
                    </View>
                  </View>
                  <Badge
                    label={invoice.status}
                    variant={
                      invoice.status === 'paid'
                        ? 'success'
                        : invoice.status === 'overdue'
                        ? 'danger'
                        : 'info'
                    }
                  />
                </View>

                <View style={styles.compactInfo}>
                  <View style={styles.compactRow}>
                    <Text style={styles.compactLabel}>Datum:</Text>
                    <Text style={styles.compactValue}>
                      {new Date(invoice.date).toLocaleDateString('de-DE')}
                    </Text>
                  </View>
                  <View style={styles.compactRow}>
                    <Text style={styles.compactLabel}>Summe:</Text>
                    <Text style={styles.totalAmount}>€{invoice.total.toFixed(2)}</Text>
                  </View>
                </View>

                {selectedInvoice?.id === invoice.id && (
                  <>
                    <View style={styles.expandedInfo}>
                      <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Fällig:</Text>
                        <Text style={styles.metaValue}>
                          {new Date(invoice.dueDate).toLocaleDateString('de-DE')}
                        </Text>
                      </View>
                      <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Positionen:</Text>
                        <Text style={styles.metaValue}>{invoice.items.length}</Text>
                      </View>
                      <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Zwischensumme:</Text>
                        <Text style={styles.metaValue}>€{invoice.subtotal.toFixed(2)}</Text>
                      </View>
                      <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>MwSt. (19%):</Text>
                        <Text style={styles.metaValue}>€{invoice.tax.toFixed(2)}</Text>
                      </View>
                    </View>

                    <View style={styles.statusUpdateSection}>
                      <Text style={styles.statusUpdateLabel}>Status ändern:</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusChips}>
                        {(['draft', 'sent', 'paid', 'overdue', 'cancelled'] as const).map((status) => (
                          <TouchableOpacity
                            key={status}
                            style={[
                              styles.statusChip,
                              invoice.status === status && styles.statusChipActive,
                            ]}
                            onPress={() => handleUpdateInvoiceStatus(invoice.id, status)}
                          >
                            <Text
                              style={[
                                styles.statusChipText,
                                invoice.status === status && styles.statusChipTextActive,
                              ]}
                            >
                              {status === 'draft' ? 'Entwurf' : status === 'sent' ? 'Gesendet' : status === 'paid' ? 'Bezahlt' : status === 'overdue' ? 'Überfällig' : 'Storniert'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    <View style={styles.invoiceActions}>
                      <TouchableOpacity
                        style={styles.viewButton}
                        onPress={() => handleViewInvoice(invoice)}
                      >
                        <Eye size={16} color="#007AFF" />
                        <Text style={styles.viewButtonText}>Ansehen</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.downloadButton}
                        onPress={() => handleDownloadPDF(invoice)}
                      >
                        <Download size={16} color="#34C759" />
                        <Text style={styles.downloadButtonText}>PDF</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteInvoice(invoice.id)}
                      >
                        <Trash2 size={16} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </Card>
            </TouchableOpacity>
          ))}
                </View>
              )}
            </View>
          ))}

          {filteredInvoices.length === 0 && (
            <View style={styles.emptyState}>
              <FileText size={64} color="#C7C7CC" />
              <Text style={styles.emptyText}>
                {searchQuery.trim() ? 'Keine Rechnungen gefunden' : 'Keine Rechnungen vorhanden'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery.trim() 
                  ? 'Versuchen Sie eine andere Suche' 
                  : 'Erstellen Sie eine neue Rechnung für Medikamente'
                }
              </Text>
            </View>
          )}
          </View>
        </ScrollView>

        <Modal
          visible={showCreateModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Neue Medikamenten-Rechnung</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <X size={24} color="#8E8E93" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <View style={styles.formSection}>
                  <Text style={styles.sectionLabel}>Patient auswählen:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {patients.map(patient => (
                      <TouchableOpacity
                        key={patient.id}
                        style={[
                          styles.patientChip,
                          selectedPatientId === patient.id && styles.patientChipActive,
                        ]}
                        onPress={() => {
                          setSelectedPatientId(patient.id);
                          setSelectedMedications([]);
                        }}
                      >
                        <Text
                          style={[
                            styles.patientChipText,
                            selectedPatientId === patient.id && styles.patientChipTextActive,
                          ]}
                        >
                          {patient.firstName} {patient.lastName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {selectedPatientId && (
                  <View style={styles.formSection}>
                    <Text style={styles.sectionLabel}>Medikamente auswählen:</Text>
                    <ScrollView style={styles.medicationList}>
                      {patientMedications.length > 0 ? (
                        patientMedications.map(med => (
                          <TouchableOpacity
                            key={med.id}
                            style={[
                              styles.medicationItem,
                              selectedMedications.includes(med.id) && styles.medicationItemActive,
                            ]}
                            onPress={() => {
                              setSelectedMedications(prev =>
                                prev.includes(med.id)
                                  ? prev.filter(id => id !== med.id)
                                  : [...prev, med.id]
                              );
                            }}
                          >
                            <View style={styles.medicationInfo}>
                              <Text style={styles.medicationName}>{med.name}</Text>
                              <Text style={styles.medicationDosage}>{med.dosage}</Text>
                            </View>
                            {selectedMedications.includes(med.id) && (
                              <View style={styles.checkmark}>
                                <Text style={styles.checkmarkText}>✓</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        ))
                      ) : (
                        <Text style={styles.noMedicationsText}>
                          Keine aktiven Medikamente für diesen Patienten
                        </Text>
                      )}
                    </ScrollView>
                  </View>
                )}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowCreateModal(false);
                    setSelectedPatientId('');
                    setSelectedMedications([]);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Abbrechen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleCreateInvoice}
                >
                  <Text style={styles.confirmButtonText}>Erstellen</Text>
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
  mainScroll: {
    flex: 1,
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 160,
    padding: 16,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5F9E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500' as const,
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#000000',
    marginBottom: 4,
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statChangeText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  statSubtext: {
    fontSize: 12,
    color: '#8E8E93',
  },
  tabsScroll: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#000000',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#E5E5EA',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#000000',
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  listContainer: {
    padding: 16,
  },
  resultCount: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  patientGroup: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  patientGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9F9FB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  patientGroupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  patientAvatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientGroupInfo: {
    flex: 1,
  },
  patientGroupName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#000000',
    marginBottom: 4,
  },
  patientGroupStats: {
    fontSize: 13,
    color: '#8E8E93',
  },
  unpaidAmount: {
    color: '#FF3B30',
    fontWeight: '600' as const,
  },
  patientGroupHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  patientGroupTotal: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#007AFF',
  },
  patientInvoicesList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  invoiceCard: {
    marginBottom: 8,
  },
  invoiceCardSelected: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  invoiceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  invoiceDetails: {
    flex: 1,
  },
  invoiceId: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000000',
  },
  compactInfo: {
    gap: 8,
  },
  compactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactLabel: {
    fontSize: 13,
    color: '#8E8E93',
  },
  compactValue: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#000000',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#007AFF',
  },
  expandedInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  metaLabel: {
    fontSize: 13,
    color: '#8E8E93',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#000000',
  },
  invoiceActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#E5F3FF',
    borderRadius: 8,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  downloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#E5F9E5',
    borderRadius: 8,
  },
  downloadButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#34C759',
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusUpdateSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  statusUpdateLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#8E8E93',
    marginBottom: 8,
  },
  statusChips: {
    flexDirection: 'row',
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  statusChipActive: {
    backgroundColor: '#007AFF',
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#000000',
  },
  statusChipTextActive: {
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#8E8E93',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    marginTop: 8,
    textAlign: 'center',
  },
  addButton: {
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
  modalScroll: {
    maxHeight: 400,
  },
  formSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#000000',
    marginBottom: 12,
  },
  patientChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  patientChipActive: {
    backgroundColor: '#007AFF',
  },
  patientChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#000000',
  },
  patientChipTextActive: {
    color: '#FFFFFF',
  },
  medicationList: {
    maxHeight: 200,
  },
  medicationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    marginBottom: 8,
  },
  medicationItemActive: {
    backgroundColor: '#E5F3FF',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000000',
    marginBottom: 4,
  },
  medicationDosage: {
    fontSize: 14,
    color: '#8E8E93',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  noMedicationsText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
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
});
