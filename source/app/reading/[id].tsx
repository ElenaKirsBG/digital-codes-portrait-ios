import { Feather } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Eyebrow, FadeIn, pageWidth, serif } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { BOOK_READINGS } from '@/lib/books';

const SCOPE: Record<string, string> = {
  arcana: 'Значение аркана',
  position: 'Значение позиции',
  reference: 'Справочное чтение',
};

export default function ReadingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const reading = BOOK_READINGS.find((r) => r.id === id);
  const options = { title: 'Чтение', headerShown: true, headerBackTitle: 'Назад', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.primary, headerShadowVisible: false };

  if (!reading) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: colors.background }]}>
        <Stack.Screen options={options} />
        <Feather name="book" size={28} color={colors.mutedForeground} />
        <Text style={[styles.h1, { color: colors.foreground, fontSize: 20 }]}>Фрагмент не найден</Text>
        <Pressable onPress={() => router.replace('/library')}><Text style={[styles.link, { color: colors.primary }]}>Открыть библиотеку</Text></Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Stack.Screen options={options} />
      <ScrollView contentContainerStyle={[styles.content, pageWidth, { paddingTop: Platform.OS === 'web' ? 67 : 14, paddingBottom: 60 }]}>
        <FadeIn>
          <Eyebrow>{(SCOPE[reading.scope] ?? 'Фрагмент').toUpperCase()}</Eyebrow>
          <Text style={[styles.h1, { color: colors.foreground }]}>{reading.title}</Text>
        </FadeIn>
        <View style={[styles.rule, { backgroundColor: colors.gold }]} />
        <Text selectable style={[styles.text, { color: colors.foreground }]}>{reading.text}</Text>
        {reading.note ? (
          <View style={[styles.box, { backgroundColor: colors.accent }]}>
            <Feather name="edit-3" size={15} color={colors.primary} />
            <Text style={[styles.boxText, { color: colors.foreground }]}>{reading.note}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  content: { paddingHorizontal: 24, gap: 18 },
  h1: { fontFamily: serif, fontSize: 31, lineHeight: 38, letterSpacing: -0.4, marginTop: 8 },
  rule: { width: 44, height: 2 },
  text: { fontFamily: serif, fontSize: 18, lineHeight: 31, maxWidth: 620 },
  box: { borderRadius: 16, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  boxText: { flex: 1, fontSize: 13, lineHeight: 19 },
  link: { fontSize: 14, fontWeight: '700' },
});
