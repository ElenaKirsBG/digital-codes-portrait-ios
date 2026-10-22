import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { Eyebrow, pageWidth, serif } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { makeBackup, parseBackup, useArchive } from '@/lib/people';

export default function BackupScreen() {
  const colors = useColors();
  const { people, restoreArchive, ready } = useArchive();
  const [backupText, setBackupText] = useState('');
  const [busy, setBusy] = useState(false);

  const exportBackup = async () => {
    try {
      const text = makeBackup(people);
      setBackupText(text);
      await Share.share({
        title: 'Резервная копия — Цифровой портрет',
        message: text,
      });
    } catch {
      Alert.alert('Не удалось создать копию', 'Попробуйте ещё раз.');
    }
  };

  const importBackup = async () => {
    if (!backupText.trim()) {
      Alert.alert('Добавьте резервную копию', 'Вставьте сюда текст копии, которую вы сохранили ранее.');
      return;
    }
    setBusy(true);
    try {
      const data = parseBackup(backupText);
      const count = await restoreArchive(data);
      setBackupText('');
      Alert.alert('Архив восстановлен', `Записей в резервной копии: ${count}. Совпадающие записи обновлены без удаления остальных.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Проверьте текст копии и попробуйте ещё раз.';
      Alert.alert('Не удалось восстановить', message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, pageWidth, { paddingTop: Platform.OS === 'web' ? 67 : 22, paddingBottom: 120 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Eyebrow>СОХРАННОСТЬ ДАННЫХ</Eyebrow>
      <Text style={[styles.title, { color: colors.foreground, fontFamily: serif }]}>Резервная копия</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Архив хранится на этом устройстве. Создавайте копию и сохраняйте её в надёжном месте.
      </Text>

      <View style={[styles.infoCard, { backgroundColor: colors.wineDeep }]}>
        <View style={styles.infoIcon}><Feather name="shield" size={21} color="#E7D3A4" /></View>
        <Text style={styles.infoTitle}>Ваши записи остаются у вас</Text>
        <Text style={styles.infoBody}>
          Данные сохраняются локально. Копия включает ФИО, даты рождения и расчётные коды — храните её бережно.
        </Text>
      </View>

      <View style={[styles.summary, { backgroundColor: colors.card }]}>
        <View style={[styles.summaryIcon, { backgroundColor: colors.accent }]}>
          <Feather name="users" size={18} color={colors.primary} />
        </View>
        <View style={styles.summaryText}>
          <Text style={[styles.summaryTitle, { color: colors.foreground }]}>Записей в архиве</Text>
          <Text style={[styles.summaryHint, { color: colors.mutedForeground }]}>
            {ready ? `${people.length} ${people.length === 1 ? 'человек' : 'человек'}` : 'Загружаем…'}
          </Text>
        </View>
      </View>

      <Pressable
        testID="export-backup"
        onPress={exportBackup}
        style={({ pressed }) => [styles.action, { backgroundColor: colors.primary, opacity: pressed ? 0.82 : 1 }]}
      >
        <Feather name="download" size={18} color={colors.primaryForeground} />
        <Text style={[styles.actionText, { color: colors.primaryForeground }]}>Создать копию и отправить</Text>
        <Feather name="arrow-up-right" size={17} color={colors.primaryForeground} />
      </Pressable>

      <View style={styles.restoreHeading}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Восстановить архив</Text>
        <Text style={[styles.restoreText, { color: colors.mutedForeground }]}>
          Вставьте ранее сохранённый JSON. Записи объединятся с текущим архивом.
        </Text>
      </View>
      <TextInput
        testID="backup-input"
        value={backupText}
        onChangeText={setBackupText}
        multiline
        textAlignVertical="top"
        placeholder="Вставьте сюда текст резервной копии"
        placeholderTextColor={colors.mutedForeground}
        style={[styles.backupInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
      />
      {backupText.length > 0 ? (
        <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{backupText.length.toLocaleString('ru-RU')} символов</Text>
      ) : null}
      <Pressable
        testID="restore-backup"
        onPress={importBackup}
        disabled={busy}
        style={({ pressed }) => [styles.restoreButton, { borderColor: colors.border, opacity: pressed || busy ? 0.7 : 1 }]}
      >
        <Feather name="upload" size={17} color={colors.primary} />
        <Text style={[styles.restoreButtonText, { color: colors.primary }]}>{busy ? 'Восстанавливаем…' : 'Восстановить из копии'}</Text>
      </Pressable>
      {backupText ? (
        <Pressable onPress={() => setBackupText('')} style={styles.clearButton}>
          <Text style={[styles.clearText, { color: colors.mutedForeground }]}>Очистить поле</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 22, gap: 13 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.6, marginBottom: -5 },
  title: { fontSize: 29, fontWeight: '700', letterSpacing: -0.7 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  infoCard: { borderRadius: 22, padding: 18, gap: 8 },
  infoIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF22', marginBottom: 3 },
  infoTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  infoBody: { color: '#E1E8E1', fontSize: 13, lineHeight: 19 },
  summary: { padding: 14, borderRadius: 17, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
  summaryIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  summaryText: { gap: 4 },
  summaryTitle: { fontSize: 14, fontWeight: '600' },
  summaryHint: { fontSize: 12 },
  action: { minHeight: 52, paddingHorizontal: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  actionText: { flex: 1, fontSize: 14, fontWeight: '700' },
  restoreHeading: { gap: 6, marginTop: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  restoreText: { fontSize: 13, lineHeight: 19 },
  backupInput: { minHeight: 140, borderWidth: 1, borderRadius: 15, padding: 13, fontSize: 12, lineHeight: 17 },
  charCount: { textAlign: 'right', marginTop: -7, fontSize: 11 },
  restoreButton: { minHeight: 49, borderWidth: 1, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  restoreButtonText: { fontSize: 14, fontWeight: '700' },
  clearButton: { alignSelf: 'center', padding: 8 },
  clearText: { fontSize: 12, fontWeight: '600' },
});
