import fs from 'fs/promises';
import { logger } from './logger';
import path from 'path';

export type Locale = 'en' | 'pl';
export type I18nFunction = (key: string, variables?: Record<string, string>) => string;
export type FlatTranslations = Record<string, string>;

export class I18n {
  private readonly translationsByLocale: Record<Locale, FlatTranslations> = { en: {}, pl: {} };

  constructor(private readonly availableLocales: Locale[] = ['en', 'pl']) {}

  public async init(localesPath = path.join(__dirname, '../../locales')): Promise<void> {
    await Promise.all(
      this.availableLocales.map(async locale => {
        try {
          const localeTranslations = await this.loadLocaleFiles(path.join(localesPath, locale));
          this.translationsByLocale[locale] = this.flattenTranslations(localeTranslations);
        } catch (error) {
          logger.error(`Failed to load locale '${locale}'`, { error });
        }
      })
    );
  }

  private async loadLocaleFiles(localePath: string): Promise<Record<string, unknown>> {
    const mergedTranslations: Record<string, unknown> = {};

    try {
      const files = await this.getJsonFiles(localePath);

      for (const file of files) {
        const content = JSON.parse(await fs.readFile(file, 'utf8'));
        const namespace = path
          .relative(localePath, file)
          .replace(/\.[^/.]+$/, '')
          .split(path.sep);

        let current = mergedTranslations;
        for (let i = 0; i < namespace.length; i++) {
          const segment = namespace[i];
          if (i === namespace.length - 1) {
            current[segment] = { ...((current[segment] as object) || {}), ...content };
          } else {
            current[segment] = current[segment] || {};
            current = current[segment] as Record<string, unknown>;
          }
        }
      }
    } catch (error) {
      logger.error(`Failed to load files from '${localePath}'`, { error });
    }

    return mergedTranslations;
  }

  private async getJsonFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      await Promise.all(
        entries.map(async entry => {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            const subFiles = await this.getJsonFiles(fullPath);
            files.push(...subFiles);
          } else if (entry.isFile() && /\.(?:json|jsonc)$/.test(entry.name)) {
            files.push(fullPath);
          }
        })
      );
    } catch (error) {
      logger.error(`Failed to read directory '${dir}'`, { error });
    }

    return files;
  }

  public translate(locale: Locale, key: string, variables?: Record<string, string>): string {
    const translation = this.translationsByLocale[locale][key] ?? this.translationsByLocale.en[key] ?? key;

    return variables
      ? translation.replace(/\{(\w+)\}/g, (_, varName) => variables[varName] ?? `{${varName}}`)
      : translation;
  }

  private flattenTranslations(obj: Record<string, unknown>, prefix = ''): FlatTranslations {
    const flattened: FlatTranslations = {};

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'string') {
        flattened[fullKey] = value;
      } else if (typeof value === 'object' && value !== null) {
        Object.assign(flattened, this.flattenTranslations(value as Record<string, unknown>, fullKey));
      }
    }

    return flattened;
  }
}
