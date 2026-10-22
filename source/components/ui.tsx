import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import type { InterpretationBlock } from '@/lib/interpretations';

export const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, "Times New Roman", serif' });
export const pageWidth = { width: '100%' as const, maxWidth: 720, alignSelf: 'center' as const };
export const topInset = Platform.OS === 'web' ? 67 : 0;

export function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 420, delay, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [v, delay]);
  return (
    <Animated.View style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
      {children}
    </Animated.View>
  );
}

export function Ornament({ size = 180, color, accent }: { size?: number; color: string; accent: string }) {
  const c = size / 2;
  const ticks = Array.from({ length: 22 }, (_, i) => {
    const a = (i / 22) * Math.PI * 2 - Math.PI / 2;
    return { x1: c + Math.cos(a) * (c - 14), y1: c + Math.sin(a) * (c - 14), x2: c + Math.cos(a) * (c - 5), y2: c + Math.sin(a) * (c - 5), i };
  });
  return (
    <Svg width={size} height={size}>
      <Circle cx={c} cy={c} r={c - 2} stroke={color} strokeWidth={1} fill="none" />
      <Circle cx={c} cy={c} r={c * 0.62} stroke={color} strokeWidth={1} fill="none" />
      <Circle cx={c} cy={c} r={c * 0.28} stroke={accent} strokeWidth={1.5} fill="none" />
      <Circle cx={c} cy={c} r={3.5} fill={accent} />
      {ticks.map((t) => (
        <Line key={t.i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={t.i === 0 ? accent : color} strokeWidth={t.i === 0 ? 2 : 1} />
      ))}
    </Svg>
  );
}

export function Eyebrow({ children, color }: { children: string; color?: string }) {
  const colors = useColors();
  return <Text style={[s.eyebrow, { color: color ?? colors.gold }]}>{children}</Text>;
}

export function ScreenTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  const colors = useColors();
  return (
    <View style={{ gap: 6 }}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Text style={[s.title, { color: colors.foreground }]}>{title}</Text>
      {subtitle ? <Text style={[s.sub, { color: colors.mutedForeground }]}>{subtitle}</Text> : null}
    </View>
  );
}

export function BlockView({ block }: { block: InterpretationBlock }) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const long = block.text.length > 280;
  const isBook = block.source?.kind === 'book';
  return (
    <View style={[s.block, { borderLeftColor: isBook ? colors.gold : colors.border }]}>
      <Text style={[s.blockTitle, { color: colors.foreground }]}>{block.title}</Text>
      <Text numberOfLines={long && !open ? 5 : undefined} style={[s.blockText, { color: colors.foreground }]}>{block.text}</Text>
      {long ? (
        <Pressable accessibilityRole="button" onPress={() => setOpen((v) => !v)} hitSlop={8}>
          <Text style={[s.more, { color: colors.primary }]}>{open ? 'Свернуть' : 'Читать полностью'}</Text>
        </Pressable>
      ) : null}
      {block.note ? <Text style={[s.note, { color: colors.mutedForeground }]}>{block.note}</Text> : null}
    </View>
  );
}

export function Avatar({ name }: { name: string }) {
  const colors = useColors();
  return (
    <View style={[s.avatar, { backgroundColor: colors.accent }]}>
      <Text style={[s.avatarText, { color: colors.primary }]}>{name.slice(0, 1).toLocaleUpperCase('ru-RU')}</Text>
    </View>
  );
}

export function SkeletonBlock({ height = 80 }: { height?: number }) {
  const colors = useColors();
  const v = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 800, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(v, { toValue: 0.5, duration: 800, useNativeDriver: Platform.OS !== 'web' }),
    ]));
    a.start();
    return () => a.stop();
  }, [v]);
  return <Animated.View style={{ height, borderRadius: 18, backgroundColor: colors.muted, opacity: v }} />;
}

const s = StyleSheet.create({
  eyebrow: { fontSize: 10.5, letterSpacing: 2, fontWeight: '700' },
  title: { fontFamily: serif, fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },
  sub: { fontSize: 14, lineHeight: 21 },
  block: { borderLeftWidth: 2, paddingLeft: 12, gap: 6 },
  blockTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
  blockText: { fontFamily: serif, fontSize: 15.5, lineHeight: 25 },
  more: { fontSize: 12.5, fontWeight: '700' },
  note: { fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: serif, fontSize: 19 },
});
