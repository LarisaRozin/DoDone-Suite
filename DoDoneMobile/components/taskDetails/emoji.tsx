/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
/**
 * @author tangzehua
 * @since 2020-07-09 16:02
 */
import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../defaultTheme';

interface IProps {
  onSelect: (value: string) => void;
}

export function EmojiView(props: IProps) {
  const { onSelect } = props;
  const insets = useSafeAreaInsets();

  // Calculate dynamic height to fit above safe area, including padding
  const dynamicHeight = Math.max(250, 300 + insets.bottom);

  return (
    <View style={[styles.container, { 
      height: dynamicHeight,
      paddingBottom: insets.bottom, // Add padding to keep content above device navigation
    }]}>
      <Text style={styles.header}>Select Emoji</Text>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        <View style={styles.view}>
      <Text 
        style={styles.item} 
        onPress={() => onSelect('😃')}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Select grinning emoji"
        accessibilityHint="Tap to choose this emoji"
      >
        😃
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😄')}>
        😄
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😁')}>
        😁
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😆')}>
        😆
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😅')}>
        😅
      </Text>
      <Text 
        style={styles.item} 
        onPress={() => onSelect('😂')}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Select tears of joy emoji"
        accessibilityHint="Tap to choose this emoji"
      >
        😂
      </Text>
      <Text style={styles.item} onPress={() => onSelect('🤣')}>
        🤣
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😊')}>
        😊
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😇')}>
        😇
      </Text>
      <Text style={styles.item} onPress={() => onSelect('🙂')}>
        🙂
      </Text>
      <Text style={styles.item} onPress={() => onSelect('🙃')}>
        🙃
      </Text>
      <Text 
        style={styles.item} 
        onPress={() => onSelect('😉')}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Select winking emoji"
        accessibilityHint="Tap to choose this emoji"
      >
        😉
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😌')}>
        😌
      </Text>
      <Text 
        style={styles.item} 
        onPress={() => onSelect('😍')}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Select heart eyes emoji"
        accessibilityHint="Tap to choose this emoji"
      >
        😍
      </Text>
      <Text style={styles.item} onPress={() => onSelect('🥰')}>
        🥰
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😘')}>
        😘
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😗')}>
        😗
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😙')}>
        😙
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😚')}>
        😚
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😋')}>
        😋
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😛')}>
        😛
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😝')}>
        😝
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😜')}>
        😜
      </Text>
      <Text style={styles.item} onPress={() => onSelect('🤪')}>
        🤪
      </Text>
      <Text style={styles.item} onPress={() => onSelect('🤨')}>
        🤨
      </Text>
      <Text style={styles.item} onPress={() => onSelect('🧐')}>
        🧐
      </Text>
      <Text style={styles.item} onPress={() => onSelect('🤓')}>
        🤓
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😎')}>
        😎
      </Text>
      <Text style={styles.item} onPress={() => onSelect('🤩')}>
        🤩
      </Text>
      <Text style={styles.item} onPress={() => onSelect('🥳')}>
        🥳
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😏')}>
        😏
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😒')}>
        😒
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😞')}>
        😞
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😔')}>
        😔
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😟')}>
        😟
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😕')}>
        😕
      </Text>
      <Text style={styles.item} onPress={() => onSelect('🙁')}>
        🙁
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😣')}>
        😣
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😖')}>
        😖
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😫')}>
        😫
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😩')}>
        😩
      </Text>
      <Text style={styles.item} onPress={() => onSelect('🥺')}>
        🥺
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😢')}>
        😢
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😭')}>
        😭
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😤')}>
        😤
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😠')}>
        😠
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😡')}>
        😡
      </Text>
      <Text style={styles.item} onPress={() => onSelect('🤬')}>
        🤬
      </Text>
      <Text style={styles.item} onPress={() => onSelect('🤯')}>
        🤯
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😳')}>
        😳
      </Text>
      <Text style={styles.item} onPress={() => onSelect('🥵')}>
        🥵
      </Text>
      <Text style={styles.item} onPress={() => onSelect('🥶')}>
        🥶
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😱')}>
        😱
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😨')}>
        😨
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😰')}>
        😰
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😥')}>
        😥
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😓')}>
        😓
      </Text>
      <Text style={styles.item} onPress={() => onSelect('🤗')}>
        🤗
      </Text>
      <Text style={styles.item} onPress={() => onSelect('🤔')}>
        🤔
      </Text>
      <Text style={styles.item} onPress={() => onSelect('🤭')}>
        🤭
      </Text>
      <Text style={styles.item} onPress={() => onSelect('🤫')}>
        🤫
      </Text>
      <Text style={styles.item} onPress={() => onSelect('🤥')}>
        🤥
      </Text>
      <Text style={styles.item} onPress={() => onSelect('😶')}>
        😶
      </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundDefault,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scrollView: {
    flex: 1,
    marginTop: 50, // Leave space for the fixed header (same as other selectors)
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
    borderTopWidth: 2,
    borderTopColor: colors.accent,
    borderLeftWidth: 2,
    borderLeftColor: colors.accent,
    borderRightWidth: 2,
    borderRightColor: colors.accent,
    backgroundColor: colors.backgroundDefault,
    // Fixed positioning at top of container (same as other selectors)
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  view: {
    alignSelf: 'center',
    flexWrap: 'wrap',
    flexDirection: 'row',
    width: Math.min(Dimensions.get('window').width - 10, 32 * 12),
    paddingVertical: 15,
    paddingHorizontal: 5,
  },
  item: {
    fontSize: 20,
    paddingHorizontal: 3,
    paddingVertical: 5,
  },
});