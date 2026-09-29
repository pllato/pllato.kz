// JavaScript \w does not match Cyrillic letters, even with /u.
export const DEMO_BUILD_STAGE_RE = /(?:создани[а-яёa-z]*\s*демо|демо\s*созда[а-яёa-z]*|готов[а-яёa-z]*\s*(?:к\s*)?сбор[а-яёa-z]*\s*демо)/i;
export const INVOICE_BUILD_STAGE_RE = /(?:создани[а-яёa-z]*\s*сч[её]т|сч[её]т[а-яёa-z]*\s*созда[а-яёa-z]*)/i;
