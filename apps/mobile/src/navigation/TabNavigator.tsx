import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { LucideIcon } from 'lucide-react-native';
import { CalendarDays, ChartPie, House, Settings } from 'lucide-react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalendarScreen } from '../screens/CalendarScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { useTheme } from '../theme/ThemeProvider';
import { iconSize, iconStroke, palette } from '../theme/tokens';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

/** 탭 아이콘 렌더러는 렌더마다 새 컴포넌트가 되지 않도록 모듈 스코프에서 만든다 */
function createTabIcon(Icon: LucideIcon) {
  function TabIcon({ color }: { color: string }) {
    return <Icon size={iconSize.tab} strokeWidth={iconStroke.default} color={color} />;
  }
  return TabIcon;
}

const HomeIcon = createTabIcon(House);
const CalendarIcon = createTabIcon(CalendarDays);
const StatsIcon = createTabIcon(ChartPie);
const SettingsIcon = createTabIcon(Settings);

/**
 * 하단 탭 (디자인 nav: height 78 / 아이콘 21·stroke 1.8 / 라벨 10.5 / 활성 orange-600 700)
 */
export function TabNavigator() {
  const { tokens, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? palette.orangeAccentDark : palette.orange600,
        tabBarInactiveTintColor: tokens.ink3,
        tabBarStyle: {
          height: 62 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          backgroundColor: tokens.surface,
          borderTopWidth: 1,
          borderTopColor: tokens.line,
          elevation: 0,
        },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '700', marginTop: 2 },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '홈',
          tabBarIcon: HomeIcon,
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: '캘린더',
          tabBarIcon: CalendarIcon,
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          title: '통계',
          tabBarIcon: StatsIcon,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: '설정',
          tabBarIcon: SettingsIcon,
        }}
      />
    </Tab.Navigator>
  );
}
