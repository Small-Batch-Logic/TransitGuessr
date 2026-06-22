<script>
  let { visible, msg = '', spinner = true, error = false, children } = $props();
</script>

{#if visible}
  <div class="photo-loading" class:error-active={error}>
    {#if children}
      {@render children()}
    {:else}
      {#if spinner}<div class="spinner"></div>{/if}
      {msg}
    {/if}
  </div>
{/if}
