import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Person, useArchive } from '@/lib/people';

export default function ArchiveScreen() {
  const colors = useColors();
  const router = useRouter();
  const { people, ready, deletePerson } = useArchive();
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('ru-RU');
    if (!normalized) return people;
    return people.filter((person) =>
      `${person.lastName} ${person.firstName} ${person.middleName}`.toLocaleLowerCase('ru-RU').includes(normalized),
    );
  }, [people, query]);

  const confirmDelete = (person: Person) => {
    Alert.alert('Удалить запись?', `${person.lastName} ${person.firstName} будет удалён из архива.`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          void deletePerson(person.id).catch(() => Alert.alert('Ошибка', 'Не удалось удалить запись.'));
        },
      },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 67 : 22 }]}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>СОХРАНЁННЫЕ ЗАПИСИ</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Архив</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {people.length} {people.length === 1 ? 'человек' : people.length < 5 ? 'человека' : 'человек'}
        </Text>
        <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={17} color={colors.mutedForeground} />
          <TextInput
            testID="archive-search"
            value={query}
            onChangeText={setQuery}
            placeholder="Поиск по имени"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {query ? <Pressable onPress={() => setQuery('')} accessibilityLabel="Очистить поиск"><Feather name="x-circle" size={17} color={colors.mutedForeground} /></Pressable> : null}
        </View>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        scrollEnabled={filtered.length > 0}
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: colors.card }]}>
            <Pressable
              testID={`profile-${item.id}`}
              onPress={() => router.push(`/report/${item.id}`)}
              style={({ pressed }) => [styles.mainRow, { opacity: pressed ? 0.78 : 1 }]}
            >
              <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>{item.firstName.slice(0, 1).toLocaleUpperCase('ru-RU')}</Text>
              </View>
              <View style={styles.personInfo}>
                <Text numberOfLines={1} style={[styles.name, { color: colors.foreground }]}>
                  {item.lastName} {item.firstName} {item.middleName}
                </Text>
                <Text style={[styles.date, { color: colors.mutedForeground }]}>
                  {new Date(`${item.birthDate}T00:00:00`).toLocaleDateString('ru-RU')}
                </Text>
              </View>
              <Feather name="chevron-right" size={19} color={colors.mutedForeground} />
            </Pressable>
            <Pressable
              testID={`delete-${item.id}`}
              onPress={() => confirmDelete(item)}
              accessibilityRole="button"
              accessibilityLabel={`Удалить ${item.firstName}`}
              style={styles.deleteButton}
            >
              <Feather name="trash-2" size={17} color={colors.mutedForeground} />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: colors.card }]}>
            <Feather name={query ? 'search' : 'archive'} size={22} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {ready ? (query ? 'Ничего не найдено' : 'Архив пока пуст') : 'Загружаем архив…'}
            </Text>
            {query ? <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Попробуйте другое имя или фамилию.</Text> : null}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 22, paddingBottom: 16 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.6, marginBottom: 7 },
  title: { fontSize: 30, lineHeight: 36, letterSpacing: -0.8, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 3 },
  search: { height: 47, borderWidth: 1, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12, marginTop: 18 },
  searchInput: { flex: 1, fontSize: 14 },
  list: { paddingHorizontal: 19, paddingBottom: 120, gap: 9, flexGrow: 1 },
  row: { minHeight: 70, borderRadius: 17, flexDirection: 'row', alignItems: 'center', paddingLeft: 12, paddingRight: 8 },
  mainRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 12 },
  avatar: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 17, fontWeight: '700' },
  personInfo: { flex: 1, gap: 4 },
  name: { fontSize: 13, fontWeight: '600' },
  date: { fontSize: 12 },
  deleteButton: { width: 42, height: 44, alignItems: 'center', justifyContent: 'center' },
  empty: { padding: 24, minHeight: 145, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptyBody: { fontSize: 13, textAlign: 'center' },
});
