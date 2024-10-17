<script lang="ts">
  import { insets } from '$lib/device';
</script>

<div
  style={`height: calc(100vh - ${64 + $insets.bottom + $insets.top}px); padding-bottom: calc(70px + ${$insets.bottom}px)`}
  class="overflow-y-scroll"
>
  <div class="px-4">
  </div>
</div>
