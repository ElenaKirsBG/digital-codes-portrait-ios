import { Feather } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useArchive } from '@/lib/people';
import { exportPersonCardPdf } from '@/lib/pdf';

export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { people, deletePerson } = useArchive();
  const [exporting, setExporting] = useState(false);
  const person = people.find((item) => item.id === id);
  const fullName = person ? `${person.lastName} ${person.firstName} ${person.middleName}` : '';

  const exportCard = async () => {
    if (!person) return;
    setExporting(true);
    try {
      await exportPersonCardPdf(person);
    } catch {
      Alert.alert('Не удалось подготовить PDF', 'Попробуйте ещё раз.');
    } finally {
      setExporting(false);
    }
  };

  const remove = () => {
    if (!person) return;
    Alert.alert('Удалить запись?', `${fullName} будет удалён из локального архива.`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          void deletePerson(person.id).then(() => router.back()).catch(() => Alert.alert('Ошибка', 'Запись не удалена.'));
        },
      },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Карточка', headerShown: true, headerBackTitle: 'Назад' }} />
      {person ? (
        <ScrollView contentContainerStyle={[styles.content, { paddingTop: Platform.OS === 'web' ? 67 : 18, paddingBottom: 40 }]}>
          <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
            <View style={styles.orbit}><View style={styles.orbitInner} /></View>
            <Text style={styles.profileEyebrow}>ПЕРСОНАЛЬНАЯ КАРТОЧКА</Text>
            <Text style={styles.profileName}>{fullName}</Text>
            <View style={styles.birthPill}>
              <Feather name="calendar" size={15} color="#F2E9D8" />
              <Text style={styles.birthText}>{new Date(`${person.birthDate}T00:00:00`).toLocaleDateString('ru-RU')}</Text>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={[styles.statusIcon, { backgroundColor: colors.accent }]}>
              <Feather name="layers" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Психологический портрет</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>
              Расчёт пока не сформирован. Сначала нужно разобрать и подключить правила из ваших книг и Excel-таблиц, чтобы результат соответствовал вашей методике.
            </Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.pendingLine}>
              <View style={[styles.pendingDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.pendingText, { color: colors.mutedForeground }]}>Методика ожидает исходные материалы</Text>
            </View>
          </View>

          <Text style={[styles.created, { color: colors.mutedForeground }]}>
            Добавлено {new Date(person.createdAt).toLocaleDateString('ru-RU')}
          </Text>

          <Pressable
            testID="export-profile-pdf"
            onPress={exportCard}
            disabled={exporting}
            style={({ pressed }) => [styles.shareButton, { backgroundColor: colors.primary, borderColor: colors.primary, opacity: pressed || exporting ? 0.7 : 1 }]}
          >
            {exporting ? <ActivityIndicator size="small" color={colors.primaryForeground} /> : <Feather name="share-2" size={17} color={colors.primaryForeground} />}
            <Text style={[styles.shareText, { color: colors.primaryForeground }]}>
              {exporting ? 'Готовим PDF…' : 'Экспортировать карточку в PDF'}
            </Text>
          </Pressable>
          <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
            Отправляется только карточка человека, не расчётный психологический отчёт.
          </Text>
          <Pressable onPress={remove} style={styles.deleteButton}>
            <Feather name="trash-2" size={15} color={colors.destructive} />
            <Text style={[styles.deleteText, { color: colors.destructive }]}>Удалить из архива</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <View style={styles.notFound}>
          <Feather name="file-minus" size={28} color={colors.mutedForeground} />
          <Text style={[styles.notFoundText, { color: colors.foreground }]}>Запись не найдена</Text>
          <Pressable onPress={() => router.replace('/archive')}>
            <Text style={[styles.backText, { color: colors.primary }]}>Вернуться в архив</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 21, gap: 16 },
  profileCard: { minHeight: 216, borderRadius: 24, padding: 22, overflow: 'hidden', justifyContent: 'flex-end' },
  orbit: { position: 'absolute', right: -18, top: -39, width: 175, height: 175, borderWidth: 1, borderColor: '#FFFFFF40', borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
  orbitInner: { width: 112, height: 112, borderWidth: 1, borderColor: '#FFFFFF55', borderRadius: 100 },
  profileEyebrow: { color: '#E1E8E1', letterSpacing: 1.5, fontSize: 10, fontWeight: '700', marginBottom: 10 },
  profileName: { color: '#FFFFFF', fontSize: 24, lineHeight: 30, fontWeight: '700', maxWidth: 330 },
  birthPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF22', borderRadius: 20, paddingHorizontal: 11, paddingVertical: 7, marginTop: 15 },
  birthText: { color: '#F2E9D8', fontSize: 13, fontWeight: '600' },
  section: { borderRadius: 20, padding: 18, gap: 10 },
  statusIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  body: { fontSize: 13, lineHeight: 20 },
  divider: { height: 1, marginTop: 4 },
  pendingLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pendingDot: { width: 7, height: 7, borderRadius: 4 },
  pendingText: { fontSize: 12, fontWeight: '600' },
  created: { fontSize: 12 },
  shareButton: { minHeight: 49, borderWidth: 1, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  shareText: { fontSize: 14, fontWeight: '700' },
  disclaimer: { fontSize: 11, lineHeight: 16, textAlign: 'center', paddingHorizontal: 13, marginTop: -8 },
  deleteButton: { alignSelf: 'center', flexDirection: 'row', gap: 7, alignItems: 'center', padding: 10, marginTop: 2 },
  deleteText: { fontSize: 13, fontWeight: '600' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 13 },
  notFoundText: { fontSize: 16, fontWeight: '700' },
  backText: { fontSize: 14, fontWeight: '600' },
});
