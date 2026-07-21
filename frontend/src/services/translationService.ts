export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
];

export const translationService = {
  async translateMessage(text: string, targetLangCode: string): Promise<string> {
    if (!text.trim() || targetLangCode === 'en') return text;

    const dictionary: Record<string, Record<string, string>> = {
      hi: {
        'hello': 'नमस्ते',
        'how are you?': 'आप कैसे हैं?',
        'good morning': 'शुभ प्रभात',
        'thanks': 'धन्यवाद',
        'see you later': 'फिर मिलते हैं',
        'sounds good!': 'बढ़िया लगा!',
        'yes': 'हाँ',
        'no': 'नहीं'
      },
      es: {
        'hello': 'Hola',
        'how are you?': '¿Cómo estás?',
        'good morning': 'Buenos días',
        'thanks': 'Gracias',
        'see you later': 'Hasta luego',
        'sounds good!': '¡Suena bien!',
        'yes': 'Sí',
        'no': 'No'
      },
      fr: {
        'hello': 'Bonjour',
        'how are you?': 'Comment allez-vous?',
        'good morning': 'Bonjour',
        'thanks': 'Merci',
        'see you later': 'À plus tard',
        'sounds good!': 'Ça me paraît bien!',
        'yes': 'Oui',
        'no': 'Non'
      },
      de: {
        'hello': 'Hallo',
        'how are you?': 'Wie geht es dir?',
        'good morning': 'Guten Morgen',
        'thanks': 'Danke',
        'see you later': 'Bis später',
        'sounds good!': 'Klingt gut!',
        'yes': 'Ja',
        'no': 'Nein'
      },
      ja: {
        'hello': 'こんにちは',
        'how are you?': 'お元気ですか？',
        'good morning': 'おはようございます',
        'thanks': 'ありがとう',
        'see you later': 'またね',
        'sounds good!': 'いいですね！',
        'yes': 'はい',
        'no': 'いいえ'
      },
      zh: {
        'hello': '你好',
        'how are you?': '你好吗？',
        'good morning': '早上好',
        'thanks': '谢谢',
        'see you later': '回头见',
        'sounds good!': '听起来不错！',
        'yes': '是',
        'no': '不'
      },
      ar: {
        'hello': 'مرحبا',
        'how are you?': 'كيف حالك؟',
        'good morning': 'صباح الخير',
        'thanks': 'شكرا',
        'see you later': 'أراك لاحقا',
        'sounds good!': 'يبدو جيدا!',
        'yes': 'نعم',
        'no': 'لا'
      }
    };

    const lower = text.toLowerCase().trim();
    if (dictionary[targetLangCode] && dictionary[targetLangCode][lower]) {
      return dictionary[targetLangCode][lower];
    }

    const langObj = SUPPORTED_LANGUAGES.find(l => l.code === targetLangCode);
    const prefix = langObj ? `[${langObj.flag} ${langObj.name}] ` : `[${targetLangCode.toUpperCase()}] `;
    return `${prefix}${text}`;
  }
};
