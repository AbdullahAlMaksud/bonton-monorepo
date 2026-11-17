import type { FontName } from '@/shared/types/bonton';

/**
 * Font assets map for expo-font (loaded from public/fonts/).
 */
export const customFontMap = {
  'HindSiliguri-Regular': require('../../../public/fonts/HindSiliguri-Regular.ttf'),
  'HindSiliguri-Bold': require('../../../public/fonts/HindSiliguri-Bold.ttf'),
  'NotoSerifBengali-Regular': require('../../../public/fonts/NotoSerifBengali-Regular.ttf'),
  'Inter-Regular': require('../../../public/fonts/Inter-Regular.ttf'),
  'PlayfairDisplay-Regular': require('../../../public/fonts/PlayfairDisplay-Regular.ttf'),
};

export interface FontOption {
  id: FontName;
  name: string;
  nameBn: string;
  subtitle: string;
  category: string;
  badge: string;
  preview: string;
  lang: 'bn' | 'en' | 'all';
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'system',
    name: 'System Default',
    nameBn: 'সিস্টেম ডিফল্ট',
    subtitle: 'ডিভাইসের নিজস্ব ডিফল্ট ফন্ট',
    category: 'সিস্টেম',
    badge: 'ডিফল্ট',
    preview: 'সহজ হিসাব, সুন্দর বন্ধুত্ব',
    lang: 'all',
  },
  {
    id: 'hind-siliguri',
    name: 'Hind Siliguri',
    nameBn: 'হিন্দ শিলিগুড়ি',
    subtitle: 'আধুনিক, ট্রেন্ডি ও পরিষ্কার সান্স-সেরিফ',
    category: 'বাংলা সান্স',
    badge: 'বাংলা',
    preview: 'হিসাব হোক স্বচ্ছ ও নিখুঁত',
    lang: 'bn',
  },
  {
    id: 'noto-serif-bengali',
    name: 'Noto Serif Bengali',
    nameBn: 'নোটো সেরিফ বাংলা',
    subtitle: 'ক্লাসিক, মার্জিত সাহিত্যের আমেজ',
    category: 'বাংলা সেরিফ',
    badge: 'বাংলা',
    preview: 'খরচ ভাগ করুন, সম্পর্কে সমতা রাখুন',
    lang: 'bn',
  },
  {
    id: 'inter',
    name: 'Inter',
    nameBn: 'ইন্টার',
    subtitle: 'ক্লিন, জ্যামিতিক টেক-ফার্স্ট আন্তর্জাতিক ফন্ট',
    category: 'ইংরেজি সান্স',
    badge: 'English',
    preview: 'Modern split and clean ledger',
    lang: 'en',
  },
  {
    id: 'playfair',
    name: 'Playfair Display',
    nameBn: 'প্লেফেয়ার ডিসপ্লে',
    subtitle: 'এলিগ্যান্ট ও রুচিশীল প্রিমিয়াম সেরিফ লুক',
    category: 'ইংরেজি সেরিফ',
    badge: 'English',
    preview: 'Elegant financial typography',
    lang: 'en',
  },
];

/**
 * Resolves the loaded font family based on active font choice and target weight.
 */
export function getFontFamily(font: FontName = 'system', weight?: string | number): string | undefined {
  if (font === 'system') return undefined;

  const isBold =
    weight === '700' ||
    weight === 'bold' ||
    weight === '800' ||
    weight === '900' ||
    weight === '600' ||
    weight === 'semibold';

  switch (font) {
    case 'hind-siliguri':
      return isBold ? 'HindSiliguri-Bold' : 'HindSiliguri-Regular';
    case 'noto-serif-bengali':
      return 'NotoSerifBengali-Regular';
    case 'inter':
      return 'Inter-Regular';
    case 'playfair':
      return 'PlayfairDisplay-Regular';
    default:
      return undefined;
  }
}

/**
 * Returns user-friendly name for a given font name.
 */
export function getFontDisplayName(font: FontName, isBangla = true): string {
  const opt = FONT_OPTIONS.find((f) => f.id === font);
  if (!opt) return isBangla ? 'সিস্টেম ডিফল্ট' : 'System Default';
  return isBangla ? opt.nameBn : opt.name;
}

/**
 * Returns subtitle/aesthetic description for a given font.
 */
export function getFontSubtitle(font: FontName): string {
  const opt = FONT_OPTIONS.find((f) => f.id === font);
  return opt?.subtitle ?? 'ডিভাইসের নিজস্ব ফন্ট';
}
