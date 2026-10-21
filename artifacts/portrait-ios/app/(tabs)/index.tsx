import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';
import { useArchive } from '@/lib/people';

function normalizeBirthDate(value: string) {
  const trimmed = value.trim();
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(trimmed);
  const iso = match ? `${match[3]}-${match[2]}-${match[1]}` : trimmed;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso) return null;
  if (date > new Date()) return null;
  return iso;
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { people, ready, storageError, addPerson } = useArchive();
  const [modalOpen, setModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setBirthDate('');
  };

  const savePerson = async () => {
    const date = normalizeBirthDate(birthDate);
    if (!firstName.trim() || !middleName.trim() || !lastName.trim()) {
      Alert.alert('Заполните ФИО', 'Укажите имя, отчество и фамилию.');
      return;
    }
    if (!date) {
      Alert.alert('Проверьте дату', 'Введите дату в формате ДД.ММ.ГГГГ.');
      return;
    }
    setSaving(true);
    try {
      const person = await addPerson({
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        lastName: lastName.trim(),
        birthDate: date,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModalOpen(false);
      resetForm();
      router.push(`/report/${person.id}`);
    } catch {
      Alert.alert('Не удалось сохранить', 'Проверьте доступное место и попробуйте ещё раз.');
    } finally {
      setSaving(false);
    }
  };

  const recent = people.slice(0, 3);
  const surface = colors.card;
  const pageTop = Platform.OS === 'web' ? 67 : 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[styles.content, { paddingTop: pageTop + 22, paddingBottom: 120 }]}
        keyboardShouldPersistTaps="handled"
        bottomOffset={40}
      >
        <View style={styles.topLine}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>ВАША МЕТОДИКА</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Цифровой портрет</Text>
          </View>
          <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
            <Feather name="aperture" size={21} color={colors.primaryForeground} />
          </View>
        </View>

        <View style={[styles.intro, { backgroundColor: colors.primary }]}>
          <View style={styles.introOrb}><View style={styles.introOrbInner} /></View>
          <Text style={styles.introLabel}>Персональный разбор</Text>
          <Text style={styles.introTitle}>Начните с даты рождения</Text>
          <Text style={styles.introBody}>
            Добавьте человека в архив. Расчётный алгоритм подключим по вашим книгам и таблицам.
          </Text>
          <Pressable
            testID="add-person"
            accessibilityRole="button"
            onPress={() => setModalOpen(true)}
            style={({ pressed }) => [styles.primaryButton, { opacity: pressed ? 0.82 : 1 }]}
          >
            <Feather name="plus" size={18} color={colors.primary} />
            <Text style={[styles.primaryButtonText, { color: colors.primary }]}>Новый портрет</Text>
          </Pressable>
        </View>

        {storageError ? (
          <View style={[styles.notice, { backgroundColor: colors.destructive + '12' }]}>
            <Feather name="alert-circle" size={18} color={colors.destructive} />
            <Text style={[styles.noticeText, { color: colors.destructive }]}>{storageError}</Text>
          </View>
        ) : null}

        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Недавние записи</Text>
          <Pressable onPress={() => router.push('/archive')} accessibilityRole="button">
            <Text style={[styles.link, { color: colors.primary }]}>Весь архив</Text>
          </Pressable>
        </View>

        {!ready ? (
          <View style={[styles.emptyCard, { backgroundColor: surface }]}>
            <Text style={[styles.muted, { color: colors.mutedForeground }]}>Загружаем архив…</Text>
          </View>
        ) : recent.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: surface }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
              <Feather name="book-open" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Здесь будет ваш архив</Text>
            <Text style={[styles.muted, { color: colors.mutedForeground }]}>
              Сохранённые люди и портреты останутся на этом устройстве.
            </Text>
          </View>
        ) : (
          <View style={styles.recentList}>
            {recent.map((person) => (
              <Pressable
                key={person.id}
                onPress={() => router.push(`/report/${person.id}`)}
                style={({ pressed }) => [
                  styles.personRow,
                  { backgroundColor: surface, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {person.firstName.slice(0, 1).toLocaleUpperCase('ru-RU')}
                  </Text>
                </View>
                <View style={styles.personInfo}>
                  <Text numberOfLines={1} style={[styles.personName, { color: colors.foreground }]}>
                    {person.lastName} {person.firstName} {person.middleName}
                  </Text>
                  <Text style={[styles.personDate, { color: colors.mutedForeground }]}>
                    {new Date(`${person.birthDate}T00:00:00`).toLocaleDateString('ru-RU')}
                  </Text>
                </View>
                <Feather name="chevron-right" size={19} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </View>
        )}
      </KeyboardAwareScrollViewCompat>

      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalOpen(false)}>
        <View style={[styles.modalScreen, { backgroundColor: colors.background }]}>
          <KeyboardAwareScrollViewCompat
            contentContainerStyle={[styles.modalContent, { paddingBottom: Platform.OS === 'web' ? 34 : 30 }]}
            keyboardShouldPersistTaps="handled"
            bottomOffset={64}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.eyebrow, { color: colors.primary }]}>НОВАЯ ЗАПИСЬ</Text>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Данные человека</Text>
              </View>
              <Pressable onPress={() => setModalOpen(false)} accessibilityLabel="Закрыть" style={[styles.closeButton, { backgroundColor: colors.card }]}>
                <Feather name="x" size={20} color={colors.foreground} />
              </Pressable>
            </View>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Фамилия</Text>
            <TextInput
              testID="last-name"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Иванова"
              autoCapitalize="words"
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            />
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Имя</Text>
            <TextInput
              testID="first-name"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Мария"
              autoCapitalize="words"
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            />
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Отчество</Text>
            <TextInput
              testID="middle-name"
              value={middleName}
              onChangeText={setMiddleName}
              placeholder="Александровна"
              autoCapitalize="words"
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            />
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Дата рождения</Text>
            <TextInput
              testID="birth-date"
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="ДД.ММ.ГГГГ"
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            />
            <Text style={[styles.helper, { color: colors.mutedForeground }]}>
              Запись сохранится в локальном архиве приложения.
            </Text>
            <Pressable
              testID="save-person"
              onPress={savePerson}
              disabled={saving}
              style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.primary, opacity: pressed || saving ? 0.8 : 1 }]}
            >
              <Text style={[styles.saveButtonText, { color: colors.primaryForeground }]}>
                {saving ? 'Сохраняем…' : 'Сохранить и открыть'}
              </Text>
              {!saving ? <Feather name="arrow-right" size={18} color={colors.primaryForeground} /> : null}
            </Pressable>
          </KeyboardAwareScrollViewCompat>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 22, gap: 22 },
  topLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontSize: 10, letterSpacing: 1.7, fontWeight: '700', marginBottom: 7 },
  title: { fontSize: 27, fontWeight: '700', letterSpacing: -0.7 },
  brandMark: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  intro: { minHeight: 250, borderRadius: 26, padding: 22, overflow: 'hidden', justifyContent: 'flex-end' },
  introOrb: { position: 'absolute', right: -9, top: 1, width: 150, height: 150, borderRadius: 100, borderWidth: 1, borderColor: '#FFFFFF40', alignItems: 'center', justifyContent: 'center' },
  introOrbInner: { width: 92, height: 92, borderRadius: 60, borderWidth: 1, borderColor: '#FFFFFF55' },
  introLabel: { color: '#E6ECE5', fontSize: 12, marginBottom: 10 },
  introTitle: { color: '#FFFFFF', fontSize: 23, lineHeight: 29, fontWeight: '700', maxWidth: 250 },
  introBody: { color: '#E1E8E1', fontSize: 14, lineHeight: 20, marginTop: 9, marginBottom: 20, maxWidth: 320 },
  primaryButton: { minHeight: 49, backgroundColor: '#F2E9D8', paddingHorizontal: 17, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', gap: 9 },
  primaryButtonText: { fontWeight: '700', fontSize: 14 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  link: { fontSize: 13, fontWeight: '600' },
  emptyCard: { borderRadius: 20, padding: 20, alignItems: 'center', gap: 9 },
  emptyIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  muted: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  recentList: { gap: 9 },
  personRow: { borderRadius: 17, paddingHorizontal: 13, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 17, fontWeight: '700' },
  personInfo: { flex: 1, gap: 4 },
  personName: { fontSize: 13, fontWeight: '600' },
  personDate: { fontSize: 12 },
  notice: { borderRadius: 14, padding: 12, flexDirection: 'row', gap: 8 },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 17 },
  modalScreen: { flex: 1 },
  modalContent: { paddingHorizontal: 23, paddingTop: 24, gap: 10, flexGrow: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  modalTitle: { fontSize: 25, fontWeight: '700', letterSpacing: -0.5 },
  closeButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginTop: 7 },
  input: { minHeight: 51, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 15 },
  helper: { fontSize: 12, lineHeight: 18, marginTop: 3, marginBottom: 12 },
  saveButton: { minHeight: 53, borderRadius: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  saveButtonText: { fontSize: 15, fontWeight: '700' },
});
