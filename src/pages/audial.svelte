<script>
  import { bottomInset, statusBarHeight } from '../store';
</script>

<!-- todo: actually implement audial locally instead of iframing -->
<iframe
  allow="clipboard-read; clipboard-write"
  class="w-full"
  style={`height: calc(100vh - ${$statusBarHeight + $bottomInset + 110}px)`}
  title="audial"
  src="https://audial.mogdan.xyz"
/>
