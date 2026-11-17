import { dark } from './dark';
import { forest } from './forest';
import { light } from './light';
import { ocean } from './ocean';
import { sepia } from './sepia';

export { dark } from './dark';
export { forest } from './forest';
export { light } from './light';
export { ocean } from './ocean';
export { sepia } from './sepia';

export const themes = { light, dark, sepia, forest, ocean } as const;
export type AppThemes = typeof themes;
