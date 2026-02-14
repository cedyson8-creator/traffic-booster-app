/**
 * i18n Service
 * Handles multi-language support with translations and localization
 */

export type Language = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';

export interface TranslationStrings {
  [key: string]: string | TranslationStrings;
}

export interface LanguageConfig {
  code: Language;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  timeFormat: string;
  currencySymbol: string;
  numberFormat: string;
}

const translations: Record<Language, TranslationStrings> = {
  en: {
    common: {
      appName: 'Traffic Booster Pro',
      dashboard: 'Dashboard',
      settings: 'Settings',
      logout: 'Logout',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Information',
    },
    navigation: {
      home: 'Home',
      analytics: 'Analytics',
      webhooks: 'Webhooks',
      apiKeys: 'API Keys',
      settings: 'Settings',
      billing: 'Billing',
      team: 'Team',
    },
    analytics: {
      title: 'Usage Analytics',
      overview: 'Overview',
      trends: 'Trends',
      errors: 'Errors',
      payments: 'Payments',
      totalApiCalls: 'Total API Calls',
      totalWebhooks: 'Total Webhooks',
      successRate: 'Success Rate',
      errorRate: 'Error Rate',
      avgResponseTime: 'Average Response Time',
    },
    webhooks: {
      title: 'Webhooks',
      replay: 'Replay',
      history: 'History',
      signatures: 'Signatures',
      testWebhook: 'Test Webhook',
      replayWebhook: 'Replay Webhook',
      payloadEditor: 'Payload Editor',
      retryHistory: 'Retry History',
    },
    alerts: {
      title: 'Alerts',
      createAlert: 'Create Alert',
      alertSettings: 'Alert Settings',
      threshold: 'Threshold',
      trigger: 'Trigger',
      deliveryChannel: 'Delivery Channel',
      email: 'Email',
      slack: 'Slack',
      discord: 'Discord',
      testAlert: 'Test Alert',
    },
  },
  es: {
    common: {
      appName: 'Traffic Booster Pro',
      dashboard: 'Panel de Control',
      settings: 'Configuración',
      logout: 'Cerrar Sesión',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      warning: 'Advertencia',
      info: 'Información',
    },
    navigation: {
      home: 'Inicio',
      analytics: 'Analítica',
      webhooks: 'Webhooks',
      apiKeys: 'Claves API',
      settings: 'Configuración',
      billing: 'Facturación',
      team: 'Equipo',
    },
    analytics: {
      title: 'Analítica de Uso',
      overview: 'Resumen',
      trends: 'Tendencias',
      errors: 'Errores',
      payments: 'Pagos',
      totalApiCalls: 'Total de Llamadas API',
      totalWebhooks: 'Total de Webhooks',
      successRate: 'Tasa de Éxito',
      errorRate: 'Tasa de Error',
      avgResponseTime: 'Tiempo de Respuesta Promedio',
    },
    webhooks: {
      title: 'Webhooks',
      replay: 'Repetir',
      history: 'Historial',
      signatures: 'Firmas',
      testWebhook: 'Probar Webhook',
      replayWebhook: 'Repetir Webhook',
      payloadEditor: 'Editor de Carga',
      retryHistory: 'Historial de Reintentos',
    },
    alerts: {
      title: 'Alertas',
      createAlert: 'Crear Alerta',
      alertSettings: 'Configuración de Alertas',
      threshold: 'Umbral',
      trigger: 'Disparador',
      deliveryChannel: 'Canal de Entrega',
      email: 'Correo Electrónico',
      slack: 'Slack',
      discord: 'Discord',
      testAlert: 'Probar Alerta',
    },
  },
  fr: {
    common: {
      appName: 'Traffic Booster Pro',
      dashboard: 'Tableau de Bord',
      settings: 'Paramètres',
      logout: 'Déconnexion',
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      warning: 'Avertissement',
      info: 'Information',
    },
    navigation: {
      home: 'Accueil',
      analytics: 'Analytique',
      webhooks: 'Webhooks',
      apiKeys: 'Clés API',
      settings: 'Paramètres',
      billing: 'Facturation',
      team: 'Équipe',
    },
    analytics: {
      title: 'Analyse d\'Utilisation',
      overview: 'Aperçu',
      trends: 'Tendances',
      errors: 'Erreurs',
      payments: 'Paiements',
      totalApiCalls: 'Total des Appels API',
      totalWebhooks: 'Total des Webhooks',
      successRate: 'Taux de Réussite',
      errorRate: 'Taux d\'Erreur',
      avgResponseTime: 'Temps de Réponse Moyen',
    },
    webhooks: {
      title: 'Webhooks',
      replay: 'Rejouer',
      history: 'Historique',
      signatures: 'Signatures',
      testWebhook: 'Tester Webhook',
      replayWebhook: 'Rejouer Webhook',
      payloadEditor: 'Éditeur de Charge',
      retryHistory: 'Historique des Tentatives',
    },
    alerts: {
      title: 'Alertes',
      createAlert: 'Créer une Alerte',
      alertSettings: 'Paramètres d\'Alerte',
      threshold: 'Seuil',
      trigger: 'Déclencheur',
      deliveryChannel: 'Canal de Livraison',
      email: 'Email',
      slack: 'Slack',
      discord: 'Discord',
      testAlert: 'Tester l\'Alerte',
    },
  },
  de: {
    common: {
      appName: 'Traffic Booster Pro',
      dashboard: 'Dashboard',
      settings: 'Einstellungen',
      logout: 'Abmelden',
      loading: 'Wird geladen...',
      error: 'Fehler',
      success: 'Erfolg',
      warning: 'Warnung',
      info: 'Information',
    },
    navigation: {
      home: 'Startseite',
      analytics: 'Analytik',
      webhooks: 'Webhooks',
      apiKeys: 'API-Schlüssel',
      settings: 'Einstellungen',
      billing: 'Abrechnung',
      team: 'Team',
    },
    analytics: {
      title: 'Nutzungsanalyse',
      overview: 'Übersicht',
      trends: 'Trends',
      errors: 'Fehler',
      payments: 'Zahlungen',
      totalApiCalls: 'Gesamt-API-Aufrufe',
      totalWebhooks: 'Gesamt-Webhooks',
      successRate: 'Erfolgsquote',
      errorRate: 'Fehlerquote',
      avgResponseTime: 'Durchschnittliche Antwortzeit',
    },
    webhooks: {
      title: 'Webhooks',
      replay: 'Wiederholen',
      history: 'Verlauf',
      signatures: 'Signaturen',
      testWebhook: 'Webhook Testen',
      replayWebhook: 'Webhook Wiederholen',
      payloadEditor: 'Payload-Editor',
      retryHistory: 'Wiederholungsverlauf',
    },
    alerts: {
      title: 'Warnungen',
      createAlert: 'Warnung Erstellen',
      alertSettings: 'Warnungseinstellungen',
      threshold: 'Schwellwert',
      trigger: 'Auslöser',
      deliveryChannel: 'Lieferkanal',
      email: 'E-Mail',
      slack: 'Slack',
      discord: 'Discord',
      testAlert: 'Warnung Testen',
    },
  },
  ja: {
    common: {
      appName: 'Traffic Booster Pro',
      dashboard: 'ダッシュボード',
      settings: '設定',
      logout: 'ログアウト',
      loading: '読み込み中...',
      error: 'エラー',
      success: '成功',
      warning: '警告',
      info: '情報',
    },
    navigation: {
      home: 'ホーム',
      analytics: 'アナリティクス',
      webhooks: 'Webhooks',
      apiKeys: 'APIキー',
      settings: '設定',
      billing: '請求',
      team: 'チーム',
    },
    analytics: {
      title: '使用分析',
      overview: '概要',
      trends: 'トレンド',
      errors: 'エラー',
      payments: '支払い',
      totalApiCalls: '合計APIコール',
      totalWebhooks: '合計Webhooks',
      successRate: '成功率',
      errorRate: 'エラー率',
      avgResponseTime: '平均応答時間',
    },
    webhooks: {
      title: 'Webhooks',
      replay: '再実行',
      history: '履歴',
      signatures: '署名',
      testWebhook: 'Webhookをテスト',
      replayWebhook: 'Webhookを再実行',
      payloadEditor: 'ペイロードエディタ',
      retryHistory: '再試行履歴',
    },
    alerts: {
      title: 'アラート',
      createAlert: 'アラートを作成',
      alertSettings: 'アラート設定',
      threshold: 'しきい値',
      trigger: 'トリガー',
      deliveryChannel: '配信チャネル',
      email: 'メール',
      slack: 'Slack',
      discord: 'Discord',
      testAlert: 'アラートをテスト',
    },
  },
  zh: {
    common: {
      appName: 'Traffic Booster Pro',
      dashboard: '仪表板',
      settings: '设置',
      logout: '登出',
      loading: '加载中...',
      error: '错误',
      success: '成功',
      warning: '警告',
      info: '信息',
    },
    navigation: {
      home: '首页',
      analytics: '分析',
      webhooks: 'Webhooks',
      apiKeys: 'API密钥',
      settings: '设置',
      billing: '账单',
      team: '团队',
    },
    analytics: {
      title: '使用分析',
      overview: '概览',
      trends: '趋势',
      errors: '错误',
      payments: '支付',
      totalApiCalls: '总API调用',
      totalWebhooks: '总Webhooks',
      successRate: '成功率',
      errorRate: '错误率',
      avgResponseTime: '平均响应时间',
    },
    webhooks: {
      title: 'Webhooks',
      replay: '重放',
      history: '历史',
      signatures: '签名',
      testWebhook: '测试Webhook',
      replayWebhook: '重放Webhook',
      payloadEditor: '有效负载编辑器',
      retryHistory: '重试历史',
    },
    alerts: {
      title: '警报',
      createAlert: '创建警报',
      alertSettings: '警报设置',
      threshold: '阈值',
      trigger: '触发器',
      deliveryChannel: '交付渠道',
      email: '电子邮件',
      slack: 'Slack',
      discord: 'Discord',
      testAlert: '测试警报',
    },
  },
};

const languageConfigs: Record<Language, LanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'HH:mm:ss',
    currencySymbol: '$',
    numberFormat: '1,234.56',
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm:ss',
    currencySymbol: '€',
    numberFormat: '1.234,56',
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm:ss',
    currencySymbol: '€',
    numberFormat: '1 234,56',
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    direction: 'ltr',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm:ss',
    currencySymbol: '€',
    numberFormat: '1.234,56',
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    direction: 'ltr',
    dateFormat: 'YYYY/MM/DD',
    timeFormat: 'HH:mm:ss',
    currencySymbol: '¥',
    numberFormat: '1,234.56',
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    direction: 'ltr',
    dateFormat: 'YYYY/MM/DD',
    timeFormat: 'HH:mm:ss',
    currencySymbol: '¥',
    numberFormat: '1,234.56',
  },
};

export class I18nService {
  private currentLanguage: Language = 'en';
  private supportedLanguages: Language[] = ['en', 'es', 'fr', 'de', 'ja', 'zh'];

  /**
   * Get translation for a key
   */
  t(key: string, language?: Language): string {
    const lang = language || this.currentLanguage;
    const keys = key.split('.');
    let value: any = translations[lang];

    for (const k of keys) {
      value = value?.[k];
    }

    if (!value) {
      // Fallback to English
      value = translations.en;
      for (const k of keys) {
        value = value?.[k];
      }
    }

    return value || key;
  }

  /**
   * Set current language
   */
  setLanguage(language: Language): void {
    if (this.supportedLanguages.includes(language)) {
      this.currentLanguage = language;
    }
  }

  /**
   * Get current language
   */
  getLanguage(): Language {
    return this.currentLanguage;
  }

  /**
   * Get language config
   */
  getLanguageConfig(language?: Language): LanguageConfig {
    const lang = language || this.currentLanguage;
    return languageConfigs[lang];
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): LanguageConfig[] {
    return this.supportedLanguages.map((lang) => languageConfigs[lang]);
  }

  /**
   * Format date according to language
   */
  formatDate(date: Date, language?: Language): string {
    const lang = language || this.currentLanguage;
    const config = languageConfigs[lang];
    return new Intl.DateTimeFormat(lang).format(date);
  }

  /**
   * Format time according to language
   */
  formatTime(date: Date, language?: Language): string {
    const lang = language || this.currentLanguage;
    return new Intl.DateTimeFormat(lang, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  }

  /**
   * Format number according to language
   */
  formatNumber(num: number, language?: Language): string {
    const lang = language || this.currentLanguage;
    return new Intl.NumberFormat(lang).format(num);
  }

  /**
   * Format currency according to language
   */
  formatCurrency(amount: number, currency: string, language?: Language): string {
    const lang = language || this.currentLanguage;
    return new Intl.NumberFormat(lang, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  /**
   * Get all translations for a language
   */
  getAllTranslations(language?: Language): TranslationStrings {
    const lang = language || this.currentLanguage;
    return translations[lang];
  }

  /**
   * Add custom translation
   */
  addTranslation(language: Language, key: string, value: string): void {
    const keys = key.split('.');
    let obj: any = translations[language];

    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) {
        obj[keys[i]] = {};
      }
      obj = obj[keys[i]];
    }

    obj[keys[keys.length - 1]] = value;
  }

  /**
   * Check if language is supported
   */
  isLanguageSupported(language: string): boolean {
    return this.supportedLanguages.includes(language as Language);
  }

  /**
   * Get language by code
   */
  getLanguageByCode(code: string): LanguageConfig | null {
    const lang = code as Language;
    return languageConfigs[lang] || null;
  }

  /**
   * Detect language from browser
   */
  detectLanguage(): Language {
    if (typeof navigator === 'undefined') return 'en';

    const browserLang = navigator.language.split('-')[0];
    if (this.isLanguageSupported(browserLang)) {
      return browserLang as Language;
    }

    return 'en';
  }

  /**
   * Export translations as JSON
   */
  exportTranslations(language?: Language): string {
    const lang = language || this.currentLanguage;
    return JSON.stringify(translations[lang], null, 2);
  }

  /**
   * Get translation statistics
   */
  getTranslationStats(): Record<Language, number> {
    const stats: Record<Language, number> = {} as Record<Language, number>;

    for (const lang of this.supportedLanguages) {
      const count = JSON.stringify(translations[lang]).split('"').length / 2;
      stats[lang] = Math.floor(count);
    }

    return stats;
  }
}

export const i18nService = new I18nService();
