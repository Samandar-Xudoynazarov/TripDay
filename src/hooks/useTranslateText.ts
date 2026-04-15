/**
 * useTranslateText — backend dan kelgan uzbekcha matnni joriy tilga tarjima qiladi.
 * MyMemory bepul API dan foydalanadi (500 so'z/kun limit).
 * Tarjimalar sessionStorage da cache qilinadi — bir xil matn qayta tarjima qilinmaydi.
 */
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const CACHE_PREFIX = 'tx_cache_';

async function translateText(text: string, from: string, to: string): Promise<string> {
  if (!text?.trim() || from === to) return text;

  const cacheKey = `${CACHE_PREFIX}${from}_${to}_${btoa(encodeURIComponent(text.slice(0, 100)))}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
    const res = await fetch(url);
    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    if (translated && translated !== text) {
      sessionStorage.setItem(cacheKey, translated);
      return translated;
    }
  } catch {
    // tarjima xatoligida asl matnni qaytaramiz
  }
  return text;
}

/**
 * Bitta matnni tarjima qilish uchun.
 * @example
 * const title = useTranslateText(ev.title);
 */
export function useTranslateText(text: string): string {
  const { i18n } = useTranslation();
  const lang = i18n.language?.slice(0, 2) || 'uz';
  const [result, setResult] = useState(text);
  const prevRef = useRef<string>('');

  useEffect(() => {
    const key = `${text}__${lang}`;
    if (prevRef.current === key) return;
    prevRef.current = key;

    if (lang === 'uz' || !text) {
      setResult(text);
      return;
    }

    setResult(text); // darhol aslini ko'rsatamiz
    translateText(text, 'uz', lang).then(setResult);
  }, [text, lang]);

  return result;
}

/**
 * Ko'p matnlarni bir vaqtda tarjima qilish.
 * @example
 * const [title, description, location] = useTranslateTexts([ev.title, ev.description, ev.locationName]);
 */
export function useTranslateTexts(texts: string[]): string[] {
  const { i18n } = useTranslation();
  const lang = i18n.language?.slice(0, 2) || 'uz';
  const [results, setResults] = useState<string[]>(texts);
  const keyRef = useRef<string>('');

  useEffect(() => {
    const key = `${texts.join('||')}__${lang}`;
    if (keyRef.current === key) return;
    keyRef.current = key;

    setResults(texts); // aslini darhol ko'rsatamiz

    if (lang === 'uz' || texts.every(t => !t)) return;

    Promise.all(texts.map(t => translateText(t, 'uz', lang))).then(setResults);
  }, [texts.join('||'), lang]);

  return results;
}
