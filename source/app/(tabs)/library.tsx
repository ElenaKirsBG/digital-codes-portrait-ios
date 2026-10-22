import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Eyebrow, FadeIn, pageWidth, serif, topInset } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { BOOK_READINGS } from '@/lib/books';
import type { BookReading } from '@/lib/books';

const norm = (v: string) => v.toLocaleLowerCase('ru-RU').replace(/ё/g, 'е');
const CATEGORIES: { id: BookReading['scope'] | null; title: string }[] = [
  { id: null, title: 'Все темы' },
  { id: 'arcana', title: 'Арканы' },
  { id: 'position', title: 'Позиции портрета' },
  { id: 'reference', title: 'Для размышления' },
];

export default function LibraryScreen() {
  const colors = useColors();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<BookReading['scope'] | null>(null);

  const results = useMemo(() => {
    const q = norm(query.trim());
    return BOOK_READINGS.filter((r) => {
      if (category && r.scope !== category) return false;
      if (!q) return true;
      return norm(`${r.title} ${r.text}`).includes(q);
    });
  }, [query, category]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, pageWidth, { paddingTop: topInset + 22, paddingBottom: 130 }]}
      keyboardShouldPersistTaps="handled"
    >
      <FadeIn>
        <Eyebrow>{`${BOOK_READINGS.length} ТЕМА ДЛЯ ЧТЕНИЯ`}</Eyebrow>
        <Text style={[styles.title, { color: colors.foreground }]}>Библиотека</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Значения арканов, аспекты портрета и темы для размышления. Найдите то, что интересно вам сейчас.
        </Text>
      </FadeIn>

      <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={17} color={colors.mutedForeground} />
        <TextInput
          testID="library-search"
          value={query}
          onChangeText={setQuery}
          placeholder="Слово или тема, например «страх»"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground }]}
        />
        {query ? <Pressable onPress={() => setQuery('')} accessibilityLabel="Очистить поиск"><Feather name="x-circle" size={17} color={colors.mutedForeground} /></Pressable> : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {CATEGORIES.map((s) => {
          const on = category === s.id;
          return (
            <Pressable
              key={s.id ?? 'all'}
              testID={`library-filter-${s.id ?? 'all'}`}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => setCategory(s.id)}
              style={[styles.chip, { backgroundColor: on ? colors.primary : colors.card, borderColor: on ? colors.primary : colors.border }]}
            >
              <Text style={[styles.chipText, { color: on ? colors.primaryForeground : colors.foreground }]}>{s.title}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={[styles.count, { color: colors.mutedForeground }]}>Найдено: {results.length}</Text>

      {results.length === 0 ? (
        <View style={[styles.empty, { borderColor: colors.border }]}>
          <Feather name="book-open" size={22} color={colors.gold} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>В отобранных фрагментах такого нет</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground, textAlign: 'center' }]}>Попробуйте другое слово или сбросьте фильтр темы.</Text>
          <Pressable onPress={() => { setQuery(''); setCategory(null); }}><Text style={[styles.link, { color: colors.primary }]}>Сбросить</Text></Pressable>
        </View>
      ) : results.map((r) => (
        <Pressable
          key={r.id}
          accessibilityRole="link"
          onPress={() => router.push(`/reading/${r.id}`)}
          style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border, transform: [{ scale: pressed ? 0.985 : 1 }] }]}
        >
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{r.title}</Text>
          <Text numberOfLines={3} style={[styles.cardText, { color: colors.foreground }]}>{r.text}</Text>
          <View style={styles.cardFoot}>
            <Feather name="book-open" size={13} color={colors.gold} />
            <Text style={[styles.cardCite, { color: colors.mutedForeground }]}>Читать подробнее</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 14 },
  title: { fontFamily: serif, fontSize: 36, lineHeight: 42, marginTop: 6 },
  sub: { fontSize: 14, lineHeight: 21, marginTop: 6 },
  search: { minHeight: 50, borderRadius: 25, borderWidth: 1, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, fontSize: 15, minHeight: 48, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as never } : {}) },
  chips: { gap: 8, paddingRight: 20 },
  chip: { paddingHorizontal: 15, minHeight: 38, borderRadius: 19, borderWidth: 1, justifyContent: 'center' },
  chipText: { fontSize: 13, fontWeight: '600' },
  count: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4, marginTop: 4 },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 8 },
  cardTitle: { fontFamily: serif, fontSize: 18, lineHeight: 24 },
  cardText: { fontFamily: serif, fontSize: 14.5, lineHeight: 23, opacity: 0.85 },
  cardFoot: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardCite: { fontSize: 11.5, flex: 1 },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 },
  emptyTitle: { fontFamily: serif, fontSize: 17 },
  link: { fontSize: 13.5, fontWeight: '700' },
});
