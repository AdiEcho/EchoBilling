export function toDateLocale(language: string): string {
  return language.startsWith('zh') ? 'zh-CN' : 'en-US'
}
