import strings from '../locales/he.json';

type Paths<T, Prefix extends string = ''> = {
  [K in keyof T]: T[K] extends Record<string, unknown>
    ? Paths<T[K], `${Prefix}${Prefix extends '' ? '' : '.'}${K & string}`>
    : `${Prefix}${Prefix extends '' ? '' : '.'}${K & string}`;
}[keyof T];

type StringPaths = Paths<typeof strings>;

function resolve(obj: Record<string, any>, path: string): string {
  const result = path.split('.').reduce((acc: any, key: string) => acc?.[key], obj as any);
  return typeof result === 'string' ? result : path;
}

export function t(key: StringPaths, params?: Record<string, string | number>): string {
  let value = resolve(strings as Record<string, any>, key);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      value = value.replace(`{{${k}}}`, String(v));
    });
  }
  return value;
}
