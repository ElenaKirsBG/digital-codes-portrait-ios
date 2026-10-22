import { Feather } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useArchive } from '@/lib/people';
import { calculatePortrait } from '@/lib/calculation';
import { getNameInterpretations, getPositionInterpretations } from '@/lib/interpretations';
import { exportPortraitPdf } from '@/lib/pdf';

const POSITION_GROUPS = [
  { title: 'Жизненный путь', numbers: [1, 2, 3] },
  { title: 'Психика и миссия', numbers: [4, 5, 6, 7, 8] },
  { title: 'Кармические позиции', numbers: [9, 10, 11, 15, 17, 18] },
  { title: 'Гармония и восприятие', numbers: [12, 13, 14, 30] },
];

export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { people, deletePerson } = useArchive();
  const [exporting, setExporting] = useState(false);
  const person = people.find((item) => item.id === id);
  const fullName = person ? `${person.lastName} ${person.firstName} ${person.middleName}` : '';
  const calculation = person
    ? person.calculation ?? calculatePortrait(person.birthDate, person)
    : null;

  const exportCard = async () => {
    if (!person) return;
    setExporting(true);
    try {
      await exportPortraitPdf(person);
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
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Расчётный портрет</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>
              Коды и трактовки перенесены из вашей расчётной таблицы.
            </Text>
            <View style={styles.nameCodeList}>
              {calculation?.nameCodes.map((item) => (
                <View key={item.field} style={[styles.nameCode, { backgroundColor: colors.background }]}>
                  <Text style={[styles.nameCodeLabel, { color: colors.mutedForeground }]}>{item.field}</Text>
                  <Text style={[styles.nameCodeValue, { color: colors.foreground }]}>
                    {item.code === null ? `Сумма ${item.rawTotal}` : `${item.code} · ${item.arcana ?? 'аркан не найден'}`}
                  </Text>
                  {item.unsupportedLetters.length > 0 ? (
                    <Text style={[styles.warning, { color: colors.destructive }]}>
                      Нет кодов в таблице: {item.unsupportedLetters.join(', ')}
                    </Text>
                  ) : null}
                  {getNameInterpretations(item.code).map((block) => (
                    <View key={block.title} style={styles.nameInterpretation}>
                      <Text style={[styles.interpretationTitle, { color: colors.foreground }]}>{block.title}</Text>
                      <Text style={[styles.interpretationBody, { color: colors.mutedForeground }]}>{block.text}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>

          {POSITION_GROUPS.map((group) => (
            <View key={group.title} style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.groupTitle, { color: colors.foreground }]}>{group.title}</Text>
              <View style={styles.positionList}>
                {group.numbers.map((number) => {
                  const position = calculation?.positions.find((item) => item.number === number);
                  if (!position) return null;
                  const interpretations = getPositionInterpretations(position.number, position.code);
                  return (
                    <View key={position.number} style={[styles.positionCard, { borderColor: colors.border }]}>
                      <View style={styles.positionRow}>
                        <View style={[styles.positionBadge, { backgroundColor: colors.accent }]}>
                          <Text style={[styles.positionNumber, { color: colors.primary }]}>{position.number}</Text>
                        </View>
                        <View style={styles.positionInfo}>
                          <Text style={[styles.positionLabel, { color: colors.mutedForeground }]}>{position.label}</Text>
                          <Text style={[styles.positionValue, { color: colors.foreground }]}>
                            {position.code}{position.arcana ? ` · ${position.arcana}` : ' · аркан не найден в таблице'}
                          </Text>
                        </View>
                      </View>
                      {interpretations.map((block) => (
                        <View key={block.title} style={styles.interpretationBlock}>
                          <Text style={[styles.interpretationTitle, { color: colors.foreground }]}>{block.title}</Text>
                          <Text style={[styles.interpretationBody, { color: colors.mutedForeground }]}>{block.text}</Text>
                        </View>
                      ))}
                    </View>
                  );
                })}
              </View>
            </View>
          ))}

          {calculation ? (
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.groupTitle, { color: colors.foreground }]}>Возрастная граница</Text>
              <Text style={[styles.body, { color: colors.mutedForeground }]}>
                {calculation.ageBoundary} лет · расчёт по формуле из таблицы
              </Text>
            </View>
          ) : null}

          <View style={[styles.disclaimerCard, { backgroundColor: colors.accent }]}>
            <Feather name="info" size={17} color={colors.primary} />
            <Text style={[styles.disclaimerBody, { color: colors.foreground }]}>
              Трактовки воспроизведены по вашей расчётной таблице. Это авторская символическая методика, а не медицинская диагностика или стандартизированное психологическое заключение.
            </Text>
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
              {exporting ? 'Готовим PDF…' : 'Экспортировать отчёт в PDF'}
            </Text>
          </Pressable>
          <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
            PDF можно сохранить или отправить через доступное приложение.
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
  nameCodeList: { gap: 7, marginTop: 2 },
  nameCode: { borderRadius: 13, paddingHorizontal: 12, paddingVertical: 10, gap: 3 },
  nameCodeLabel: { fontSize: 11, fontWeight: '600' },
  nameCodeValue: { fontSize: 13, fontWeight: '700' },
  warning: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  nameInterpretation: { gap: 4, marginTop: 7 },
  groupTitle: { fontSize: 16, fontWeight: '700' },
  positionList: { gap: 8 },
  positionCard: { borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 14, gap: 10 },
  positionRow: { minHeight: 55, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 7 },
  positionBadge: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  positionNumber: { fontSize: 12, fontWeight: '700' },
  positionInfo: { flex: 1, gap: 3 },
  positionLabel: { fontSize: 11, lineHeight: 15 },
  positionValue: { fontSize: 13, fontWeight: '700' },
  interpretationBlock: { gap: 5, paddingLeft: 45 },
  interpretationTitle: { fontSize: 12, fontWeight: '700', lineHeight: 17 },
  interpretationBody: { fontSize: 12, lineHeight: 18 },
  disclaimerCard: { borderRadius: 17, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  disclaimerBody: { flex: 1, fontSize: 11, lineHeight: 17 },
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
