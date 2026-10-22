import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { Avatar, Eyebrow, FadeIn, Ornament, SkeletonBlock, pageWidth, serif, topInset } from '@/components/ui';
import { BOOK_READINGS } from '@/lib/books';
import { useColors } from '@/hooks/useColors';
import { useArchive } from '@/lib/people';
import { normalizeBirthDate } from '@/lib/birth-date';

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
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setBirthDate('');
  };

  const savePerson = async () => {
    if (saving) return;
    setFormError(null);
    if (!ready) {
      setFormError('Архив ещё загружается. Повторите через несколько секунд.');
      return;
    }
    const date = normalizeBirthDate(birthDate);
    if (!firstName.trim() || !middleName.trim() || !lastName.trim()) {
      setFormError('Укажите имя, отчество и фамилию.');
      return;
    }
    if (!date) {
      setFormError('Проверьте дату рождения: например, 09.06.2005. Дата должна существовать и не быть в будущем.');
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
      setModalOpen(false);
      resetForm();
      router.push(`/report/${person.id}`);
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } catch {
      setFormError('Не удалось сохранить запись. Проверьте, что браузеру разрешено локальное хранение, и попробуйте ещё раз.');
    } finally {
      setSaving(false);
    }
  };

  const recent = people.slice(0, 3);
  const spotlight = BOOK_READINGS[Math.floor(Date.now() / 86400000) % BOOK_READINGS.length];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[styles.content, pageWidth, { paddingTop: topInset + 22, paddingBottom: 130 }]}
        keyboardShouldPersistTaps="handled"
        bottomOffset={40}
      >
        <FadeIn>
          <View style={[styles.intro, { backgroundColor: colors.wineDeep }]}>
            <View style={styles.orn}><Ornament size={230} color="#FBF3E440" accent={colors.gold} /></View>
            <Eyebrow>РАСШИРЕННЫЙ РАЗБОР · 140 ТЕМ</Eyebrow>
            <Text style={styles.introTitle}>Символический портрет</Text>
            <Text style={styles.introBody}>
              Введите имя и дату рождения, чтобы познакомиться с ключевыми темами портрета. Раскрывайте каждый аспект и читайте подробный разбор.
            </Text>
            <Pressable
              testID="add-person"
              accessibilityRole="button"
              onPress={() => { setFormError(null); setModalOpen(true); }}
              style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.goldSoft, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
              <Feather name="plus" size={18} color={colors.wineDeep} />
              <Text style={[styles.primaryButtonText, { color: colors.wineDeep }]}>Новый портрет</Text>
            </Pressable>
          </View>
        </FadeIn>

        {storageError ? (
          <View style={[styles.notice, { backgroundColor: colors.destructive + '14' }]}>
            <Feather name="alert-circle" size={18} color={colors.destructive} />
            <Text style={[styles.noticeText, { color: colors.destructive }]}>{storageError}</Text>
          </View>
        ) : null}

        <FadeIn delay={90}>
          <View style={styles.sectionHeading}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Недавние записи</Text>
            <Pressable onPress={() => router.push('/archive')} accessibilityRole="button" hitSlop={8}>
              <Text style={[styles.link, { color: colors.primary }]}>Весь архив</Text>
            </Pressable>
          </View>
        </FadeIn>

        {!ready ? (
          <SkeletonBlock height={72} />
        ) : recent.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="feather" size={22} color={colors.gold} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Пока ни одного портрета</Text>
            <Text style={[styles.muted, { color: colors.mutedForeground }]}>
              Сохранённые люди остаются только на этом устройстве.
            </Text>
          </View>
        ) : (
          <View style={styles.recentList}>
            {recent.map((person) => (
              <Pressable
                key={person.id}
                onPress={() => router.push(`/report/${person.id}`)}
                style={({ pressed }) => [styles.personRow, { backgroundColor: colors.card, borderColor: colors.border, transform: [{ scale: pressed ? 0.985 : 1 }] }]}
              >
                <Avatar name={person.firstName} />
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

        {spotlight ? (
          <FadeIn delay={160}>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push(`/reading/${spotlight.id}`)}
              style={({ pressed }) => [styles.spot, { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 }]}
            >
              <Eyebrow color={colors.primary}>ИЗ БИБЛИОТЕКИ</Eyebrow>
              <Text style={[styles.spotTitle, { color: colors.foreground }]}>{spotlight.title}</Text>
              <Text numberOfLines={3} style={[styles.spotText, { color: colors.foreground }]}>{spotlight.text}</Text>
              <Text style={[styles.spotSrc, { color: colors.primary }]}>
                Открыть и прочитать
              </Text>
            </Pressable>
          </FadeIn>
        ) : null}
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
                <Eyebrow>НОВАЯ ЗАПИСЬ</Eyebrow>
                <Text style={[styles.modalTitle, { fontFamily: serif }, { color: colors.foreground }]}>Данные человека</Text>
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
            {formError ? (
              <Text
                testID="form-error"
                accessibilityRole="alert"
                style={[styles.formError, { color: colors.destructive }]}
              >
                {formError}
              </Text>
            ) : null}
            <Pressable
              testID="save-person"
              accessibilityRole="button"
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
  brandMark: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  intro: { minHeight: 330, borderRadius: 28, padding: 24, overflow: 'hidden', justifyContent: 'flex-end', gap: 10 },
  orn: { position: 'absolute', right: -50, top: -40 },
  introTitle: { fontFamily: serif, color: '#FBF3E4', fontSize: 36, lineHeight: 41, letterSpacing: -0.6, maxWidth: 300 },
  introBody: { color: '#E6D9C4', fontSize: 14.5, lineHeight: 22, maxWidth: 420, marginBottom: 10 },
  primaryButton: { minHeight: 50, paddingHorizontal: 20, borderRadius: 25, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 9 },
  primaryButtonText: { fontWeight: '700', fontSize: 14.5 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: serif, fontSize: 22 },
  link: { fontSize: 13, fontWeight: '700' },
  emptyCard: { borderRadius: 20, padding: 22, alignItems: 'center', gap: 8, borderWidth: 1, borderStyle: 'dashed' },
  emptyTitle: { fontFamily: serif, fontSize: 17 },
  muted: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  recentList: { gap: 10 },
  personRow: { borderRadius: 20, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 13 },
  personInfo: { flex: 1, gap: 4 },
  personName: { fontSize: 14.5, fontWeight: '600' },
  personDate: { fontSize: 12.5 },
  notice: { borderRadius: 14, padding: 12, flexDirection: 'row', gap: 8 },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 17 },
  spot: { borderRadius: 24, padding: 20, gap: 8, marginTop: 4 },
  spotTitle: { fontFamily: serif, fontSize: 21, lineHeight: 27 },
  spotText: { fontFamily: serif, fontSize: 14.5, lineHeight: 23, opacity: 0.85 },
  spotSrc: { fontSize: 12.5, fontWeight: '700', marginTop: 4 },
  modalScreen: { flex: 1 },
  modalContent: { paddingHorizontal: 23, paddingTop: 24, gap: 10, flexGrow: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  modalTitle: { fontSize: 25, fontWeight: '700', letterSpacing: -0.5 },
  closeButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginTop: 7 },
  input: { minHeight: 51, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 15 },
  helper: { fontSize: 12, lineHeight: 18, marginTop: 3, marginBottom: 12 },
  formError: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  saveButton: { minHeight: 53, borderRadius: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  saveButtonText: { fontSize: 15, fontWeight: '700' },
});
