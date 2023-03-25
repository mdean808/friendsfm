<script>
  import { bottomInset, statusBarHeight } from '../store';
</script>

<iframe
  allow="clipboard-read; clipboard-write"
  class="w-full"
  style={`height: calc(100vh - ${
    $statusBarHeight + $bottomInset + 55
  }px); margin-top: ${$statusBarHeight}px`}
  title="audial"
  src="https://audial.mogdan.xyz?source=friendsfm"
/>
