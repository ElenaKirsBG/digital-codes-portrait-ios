import { Feather } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BlockView, Eyebrow, FadeIn, Ornament, SkeletonBlock, pageWidth, serif } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useArchive } from '@/lib/people';
import { calculatePortrait } from '@/lib/calculation';
import { getReportContext } from '@/lib/books';
import { getNameInterpretations, getPositionInterpretations } from '@/lib/interpretations';
import { exportPortraitPdf } from '@/lib/pdf';

const POSITION_GROUPS = [
  { title: 'Жизненный путь', hint: 'Три возраста человека', numbers: [1, 2, 3] },
  { title: 'Психика и миссия', hint: 'Внутренний мир и предназначение', numbers: [4, 5, 6, 7, 8] },
  { title: 'Кармические позиции', hint: 'Повторяющиеся задачи', numbers: [9, 10, 11, 15, 17, 18] },
  { title: 'Гармония и восприятие', hint: 'Равновесие и взгляд со стороны', numbers: [12, 13, 14, 30] },
];

export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { people, ready, deletePerson } = useArchive();
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState<number | null>(7);
  const [openName, setOpenName] = useState<string | null>(null);
  const person = people.find((item) => item.id === id);
  const fullName = person ? `${person.lastName} ${person.firstName} ${person.middleName}` : '';
  const calculation = person ? person.calculation ?? calculatePortrait(person.birthDate, person) : null;
  const context = getReportContext();

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

  const header = <Stack.Screen options={{ title: 'Портрет', headerShown: true, headerBackTitle: 'Назад', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.primary, headerShadowVisible: false }} />;

  if (!ready) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        {header}
        <View style={[styles.content, pageWidth, { paddingTop: Platform.OS === 'web' ? 67 : 18 }]} accessibilityLabel="Загружаем архив">
          <SkeletonBlock height={230} />
          <SkeletonBlock height={110} />
          <SkeletonBlock height={160} />
        </View>
      </View>
    );
  }

  if (!person || !calculation) {
    return (
      <View style={[styles.screen, styles.notFound, { backgroundColor: colors.background }]}>
        {header}
        <Feather name="file-minus" size={28} color={colors.mutedForeground} />
        <Text style={[styles.notFoundText, { color: colors.foreground }]}>Запись не найдена</Text>
        <Pressable onPress={() => router.replace('/archive')}>
          <Text style={[styles.link, { color: colors.primary }]}>Вернуться в архив</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {header}
      <ScrollView contentContainerStyle={[styles.content, pageWidth, { paddingTop: Platform.OS === 'web' ? 67 : 12, paddingBottom: 48 }]}>
        <FadeIn>
          <View style={[styles.hero, { backgroundColor: colors.wineDeep }]}>
            <View style={styles.orn}><Ornament size={220} color="#FBF3E438" accent={colors.gold} /></View>
            <Eyebrow>ПЕРСОНАЛЬНЫЙ ПОРТРЕТ</Eyebrow>
            <Text style={styles.heroName}>{fullName}</Text>
            <View style={styles.heroMeta}>
              <Text style={styles.heroMetaText}>Рождение · {new Date(`${person.birthDate}T00:00:00`).toLocaleDateString('ru-RU')}</Text>
              <Text style={styles.heroMetaText}>Возрастная граница · {calculation.ageBoundary} лет</Text>
            </View>
          </View>
        </FadeIn>

        <Text style={[styles.lead, { color: colors.mutedForeground }]}>
          Выберите позицию на карте — трактовка раскроется рядом. Источник каждого фрагмента указан под текстом.
        </Text>

        <Text style={[styles.h2, { color: colors.foreground }]}>Коды имени</Text>
        <View style={styles.nameGrid}>
          {calculation.nameCodes.map((item) => {
            const open = openName === item.field;
            const blocks = open ? getNameInterpretations(item.code) : [];
            return (
              <View key={item.field} style={[styles.nameCard, { backgroundColor: colors.card, borderColor: open ? colors.gold : colors.border }]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  onPress={() => setOpenName(open ? null : item.field)}
                  style={styles.nameHead}
                >
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[styles.small, { color: colors.mutedForeground }]}>{item.field}</Text>
                    <Text style={[styles.nameValue, { color: colors.foreground }]}>
                      {item.code === null ? `Сумма ${item.rawTotal}` : `${item.code} · ${item.arcana ?? 'аркан не найден'}`}
                    </Text>
                  </View>
                  <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedForeground} />
                </Pressable>
                {item.unsupportedLetters.length > 0 ? (
                  <Text style={[styles.warning, { color: colors.destructive }]}>Нет кодов в таблице: {item.unsupportedLetters.join(', ')}</Text>
                ) : null}
                {open ? (
                  <View style={styles.blocks}>
                    {blocks.length ? blocks.map((b, i) => <BlockView key={`${b.title}-${i}`} block={b} />) : (
                      <Text style={[styles.small, { color: colors.mutedForeground }]}>Для этого кода трактовки нет в таблице.</Text>
                    )}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        <Text style={[styles.h2, { color: colors.foreground }]}>Карта позиций</Text>
        {POSITION_GROUPS.map((group) => {
          const sel = selected !== null && group.numbers.includes(selected)
            ? calculation.positions.find((p) => p.number === selected)
            : undefined;
          return (
            <View key={group.title} style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.groupTitle, { color: colors.foreground }]}>{group.title}</Text>
              <Text style={[styles.small, { color: colors.mutedForeground }]}>{group.hint}</Text>
              <View style={styles.chips}>
                {group.numbers.map((number) => {
                  const p = calculation.positions.find((x) => x.number === number);
                  if (!p) return null;
                  const on = selected === number;
                  return (
                    <Pressable
                      key={number}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={`Позиция ${number}, ${p.label}, код ${p.code}`}
                      onPress={() => setSelected(on ? null : number)}
                      style={({ pressed }) => [
                        styles.chip,
                        { backgroundColor: on ? colors.primary : colors.background, borderColor: on ? colors.primary : colors.border, transform: [{ scale: pressed ? 0.95 : 1 }] },
                      ]}
                    >
                      <Text style={[styles.chipNum, { color: on ? colors.goldSoft : colors.mutedForeground }]}>{number}</Text>
                      <Text style={[styles.chipCode, { color: on ? colors.primaryForeground : colors.foreground }]}>{p.code}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {sel ? (
                <FadeIn>
                  <View style={[styles.detail, { borderTopColor: colors.border }]}>
                    <Text style={[styles.small, { color: colors.gold, fontWeight: '700' }]}>ПОЗИЦИЯ {sel.number}</Text>
                    <Text style={[styles.detailTitle, { color: colors.foreground }]}>{sel.label}</Text>
                    <Text style={[styles.detailArcana, { color: colors.primary }]}>
                      {sel.code}{sel.arcana ? ` · ${sel.arcana}` : ' · аркан не найден в таблице'}
                    </Text>
                    <View style={styles.blocks}>
                      {getPositionInterpretations(sel.number, sel.code).map((b, i) => <BlockView key={`${b.title}-${i}`} block={b} />)}
                    </View>
                  </View>
                </FadeIn>
              ) : null}
            </View>
          );
        })}

        <Text style={[styles.h2, { color: colors.foreground }]}>Как читать этот портрет</Text>
        {context.map((reading) => {
          const warn = reading.id === 'health-boundaries';
          return (
            <Pressable
              key={reading.id}
              accessibilityRole="link"
              onPress={() => router.push(`/reading/${reading.id}`)}
              style={({ pressed }) => [styles.ctx, { backgroundColor: warn ? colors.destructive + '12' : colors.accent, opacity: pressed ? 0.85 : 1 }]}
            >
              <Feather name={warn ? 'alert-triangle' : 'compass'} size={17} color={warn ? colors.destructive : colors.primary} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.ctxTitle, { color: colors.foreground }]}>{reading.title}</Text>
                <Text numberOfLines={4} style={[styles.ctxText, { color: colors.foreground }]}>{reading.text}</Text>
                <Text style={[styles.small, { color: colors.primary, fontWeight: '700' }]}>
                  Читать подробнее
                </Text>
              </View>
            </Pressable>
          );
        })}

        <View style={[styles.ctx, { backgroundColor: colors.muted }]}>
          <Feather name="info" size={17} color={colors.primary} />
          <Text style={[styles.ctxText, { color: colors.foreground, flex: 1 }]}>
            Это символическая методика для размышления о себе, а не медицинская диагностика и не стандартизированное психологическое заключение.
          </Text>
        </View>

        <Text style={[styles.small, { color: colors.mutedForeground }]}>Добавлено {new Date(person.createdAt).toLocaleDateString('ru-RU')}</Text>

        <Pressable
          testID="export-profile-pdf"
          onPress={exportCard}
          disabled={exporting}
          style={({ pressed }) => [styles.share, { backgroundColor: colors.primary, opacity: pressed || exporting ? 0.75 : 1 }]}
        >
          {exporting ? <ActivityIndicator size="small" color={colors.primaryForeground} /> : <Feather name="share-2" size={17} color={colors.primaryForeground} />}
          <Text style={[styles.shareText, { color: colors.primaryForeground }]}>{exporting ? 'Готовим PDF…' : 'Экспортировать отчёт в PDF'}</Text>
        </Pressable>
        <Pressable onPress={remove} style={styles.del}>
          <Feather name="trash-2" size={15} color={colors.destructive} />
          <Text style={[styles.link, { color: colors.destructive }]}>Удалить из архива</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 14 },
  hero: { minHeight: 250, borderRadius: 28, padding: 24, overflow: 'hidden', justifyContent: 'flex-end', gap: 10 },
  orn: { position: 'absolute', right: -50, top: -50 },
  heroName: { fontFamily: serif, color: '#FBF3E4', fontSize: 31, lineHeight: 37, maxWidth: 420 },
  heroMeta: { gap: 3, marginTop: 4 },
  heroMetaText: { color: '#E6D9C4', fontSize: 13 },
  lead: { fontSize: 14, lineHeight: 21, marginVertical: 2 },
  h2: { fontFamily: serif, fontSize: 24, marginTop: 14 },
  nameGrid: { gap: 10 },
  nameCard: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 15, paddingVertical: 6 },
  nameHead: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10 },
  nameValue: { fontFamily: serif, fontSize: 17 },
  small: { fontSize: 12, lineHeight: 17 },
  warning: { fontSize: 11.5, lineHeight: 16, marginBottom: 6 },
  blocks: { gap: 18, paddingVertical: 12 },
  group: { borderRadius: 22, borderWidth: 1, padding: 16, gap: 4 },
  groupTitle: { fontFamily: serif, fontSize: 19 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: { width: 58, height: 62, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 1 },
  chipNum: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.5 },
  chipCode: { fontFamily: serif, fontSize: 22 },
  detail: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 14, paddingTop: 14, gap: 4 },
  detailTitle: { fontFamily: serif, fontSize: 22, lineHeight: 28 },
  detailArcana: { fontSize: 14, fontWeight: '700' },
  ctx: { borderRadius: 20, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  ctxTitle: { fontFamily: serif, fontSize: 17 },
  ctxText: { fontFamily: serif, fontSize: 14, lineHeight: 22 },
  share: { minHeight: 52, borderRadius: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 4 },
  shareText: { fontSize: 14.5, fontWeight: '700' },
  del: { alignSelf: 'center', flexDirection: 'row', gap: 7, alignItems: 'center', padding: 10 },
  link: { fontSize: 13.5, fontWeight: '700' },
  notFound: { alignItems: 'center', justifyContent: 'center', gap: 13 },
  notFoundText: { fontFamily: serif, fontSize: 19 },
});
