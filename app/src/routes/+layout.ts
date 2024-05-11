import { browser } from '$app/environment';
import { insets } from '$lib/device';
import { SafeArea } from 'capacitor-plugin-safe-area';

export const ssr = false;
export const prerender = true;

if (browser) {
  const is = await SafeArea.getSafeAreaInsets();
  insets.set(is.insets);
}
