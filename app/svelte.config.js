import { withSentryConfig } from '@sentry/svelte';
import sveltePreprocess from 'svelte-preprocess';

const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: sveltePreprocess(),
};

export default withSentryConfig(config);
