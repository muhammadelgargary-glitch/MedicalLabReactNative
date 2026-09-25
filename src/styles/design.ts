import { Platform } from 'react-native';
import { FontFamilyKey, FontSizeKey } from '../store/useLabStore';

export function resolveFontFamily(key: FontFamilyKey = 'sans') {
  if (Platform.OS === 'ios') {
    if (key === 'serif') return 'Georgia';
    if (key === 'mono') return 'Menlo';
    return 'System';
  }
  if (key === 'serif') return 'serif';
  if (key === 'mono') return 'monospace';
  return 'sans-serif';
}

export function fontScale(key: FontSizeKey = 'medium') {
  if (typeof key === 'number' && Number.isFinite(key)) {
    return Math.max(0.8, Math.min(1.4, key));
  }
  if (key === 'small') return 0.9;
  if (key === 'large') return 1.12;
  return 1;
}
