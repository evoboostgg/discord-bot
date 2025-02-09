import { BaseChannel, TextChannel, User } from 'discord.js';
import axios from 'axios';

interface TranslationCache {
  [key: string]: {
    [text: string]: string;
  };
}

const translationCache: TranslationCache = {};

export async function autoTranslate(text: string, targetLanguage: string, variables?: Record<string, any>): Promise<string> {
  // Check cache first
  if (translationCache[targetLanguage]?.[text]) {
    return replacePlaceholders(translationCache[targetLanguage][text], variables);
  }

  // Replace variables with placeholders
  const placeholders: Record<string, any> = {};
  let textToTranslate = text;

  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      if (value instanceof TextChannel || value instanceof User) {
        const placeholder = `{{${key}}}`;
        placeholders[placeholder] = value;
        textToTranslate = textToTranslate.replace(value.toString(), placeholder);
      }
    });
  }

  // Protect dynamic values with placeholders
  const dynamicValues: Record<string, string> = {};
  let counter = 0;

  // Protect template literals
  textToTranslate = textToTranslate.replace(/\${[^}]+}/g, (match) => {
    const placeholder = `<<VAR${counter}>>`;
    const value = eval(match.slice(2, -1)); // Evaluate the expression immediately
    dynamicValues[placeholder] = value?.toString() || match;
    counter++;
    return placeholder;
  });

  try {
    const response = await axios.get(`https://translate.googleapis.com/translate_a/single`, {
      params: {
        client: 'gtx',
        sl: 'auto',
        tl: targetLanguage,
        dt: 't',
        q: textToTranslate
      }
    });

    let translatedText = response.data[0][0][0] || text;

    // Restore variables
    Object.entries(dynamicValues).forEach(([placeholder, value]) => {
      translatedText = translatedText.replace(placeholder, value);
    });

    // Remove the duplicate restore and eval sections
    // Object.entries(dynamicValues).forEach...

    // Restore dynamic values and evaluate them
    Object.entries(dynamicValues).forEach(([placeholder, value]) => {
      // Remove the ${} wrapper and evaluate the expression
      const evalValue = value.slice(2, -1); // Remove ${ and }
      translatedText = translatedText.replace(placeholder, eval(evalValue));
    });

    // Cache the translation
    if (!translationCache[targetLanguage]) {
      translationCache[targetLanguage] = {};
    }
    translationCache[targetLanguage][text] = translatedText;

    // Replace placeholders with actual values
    return replacePlaceholders(translatedText, variables);
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Fallback to original text
  }
}

function replacePlaceholders(text: string, variables?: Record<string, any>): string {
  if (!variables) return text;

  let result = text;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value.toString());
  });

  return result;
}