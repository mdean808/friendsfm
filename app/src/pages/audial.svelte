<script>
  import { insets, statusBarHeight } from '../store';
</script>

<iframe
  allow="clipboard-read; clipboard-write"
  class="w-full"
  style={`height: calc(100vh - ${
    $statusBarHeight + $insets.bottom + 65
  }px); margin-top: ${$statusBarHeight}px`}
  title="audial"
  src="https://audial.mogdan.xyz?source=friendsfm"
/>
