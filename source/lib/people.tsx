import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  calculatePortrait,
  isPortraitCalculation,
  PortraitCalculation,
} from '@/lib/calculation';

export type Person = {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  birthDate: string;
  createdAt: string;
  calculation?: PortraitCalculation;
};

type ArchiveContextValue = {
  people: Person[];
  ready: boolean;
  storageError: string | null;
  addPerson: (person: Omit<Person, 'id' | 'createdAt'>) => Promise<Person>;
  deletePerson: (id: string) => Promise<void>;
  restoreArchive: (json: string) => Promise<number>;
};

const STORAGE_KEY = 'digital-portrait-archive-v1';
const ArchiveContext = createContext<ArchiveContextValue | null>(null);

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isPerson(value: unknown): value is Person {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    typeof item.firstName === 'string' &&
    typeof item.middleName === 'string' &&
    typeof item.lastName === 'string' &&
    typeof item.birthDate === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(item.birthDate) &&
    typeof item.createdAt === 'string'
  );
}

function withCalculation(person: Person): Person {
  if (isPortraitCalculation(person.calculation)) return person;
  return {
    ...person,
    calculation: calculatePortrait(person.birthDate, person),
  };
}

export function ArchiveProvider({ children }: { children: React.ReactNode }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!active) return;
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (!Array.isArray(parsed) || !parsed.every(isPerson)) {
            throw new Error('Архив имеет неподдерживаемый формат.');
          }
          setPeople(parsed.map((person) => withCalculation(person as Person)));
        }
      })
      .catch(() => {
        if (active) setStorageError('Не удалось прочитать локальный архив.');
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const persist = async (next: Person[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setPeople(next);
    setStorageError(null);
  };

  const value = useMemo<ArchiveContextValue>(
    () => ({
      people,
      ready,
      storageError,
      addPerson: async (details) => {
        const person: Person = {
          ...details,
          id: makeId(),
          createdAt: new Date().toISOString(),
          calculation: calculatePortrait(details.birthDate, details),
        };
        await persist([person, ...people]);
        return person;
      },
      deletePerson: async (id) => {
        await persist(people.filter((person) => person.id !== id));
      },
      restoreArchive: async (json) => {
        const parsed: unknown = JSON.parse(json);
        if (!Array.isArray(parsed) || !parsed.every(isPerson)) {
          throw new Error('В файле нет архива в нужном формате.');
        }
        const restored = (parsed as Person[]).map(withCalculation);
        const merged = [...restored];
        const ids = new Set(merged.map((person) => person.id));
        for (const person of people) {
          if (!ids.has(person.id)) merged.push(person);
        }
        await persist(merged);
        return parsed.length;
      },
    }),
    [people, ready, storageError],
  );

  return <ArchiveContext.Provider value={value}>{children}</ArchiveContext.Provider>;
}

export function useArchive() {
  const context = useContext(ArchiveContext);
  if (!context) throw new Error('useArchive must be used inside ArchiveProvider');
  return context;
}

export function makeBackup(people: Person[]) {
  return JSON.stringify(
    { format: 'digital-portrait-backup', version: 1, exportedAt: new Date().toISOString(), people },
    null,
    2,
  );
}

export function parseBackup(text: string) {
  const parsed: unknown = JSON.parse(text);
  if (Array.isArray(parsed)) return text;
  if (
    parsed &&
    typeof parsed === 'object' &&
    'format' in parsed &&
    parsed.format === 'digital-portrait-backup' &&
    'people' in parsed &&
    Array.isArray(parsed.people)
  ) {
    return JSON.stringify(parsed.people);
  }
  throw new Error('Этот текст не похож на резервную копию приложения.');
}
