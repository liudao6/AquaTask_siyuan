import en from './i18n/en_US.json';
import zh from './i18n/zh_CN.json';

const locales = {
    en_US: en,
    zh_CN: zh,
};

export const i18n = {
    lang: 'en_US',
    setLanguage(lang: string) {
        if (locales[lang]) {
            this.lang = lang;
        }
    },
    t(key: string) {
        return locales[this.lang][key] || key;
    }
};

export function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
