<script>
  let { title, subtitle, icon = '', iconColor = '', oncancel, children } = $props();
</script>

<div class="modal-backdrop" onclick={oncancel}>
  <div class="modal-dialog" onclick={e => e.stopPropagation()}>
    {#if icon || title}
      <div class="modal-header">
        {#if icon}
          <div class="modal-icon" style={iconColor ? `color: ${iconColor}` : ''}>{@html icon}</div>
        {/if}
        <div class="modal-titles">
          {#if title}<p class="modal-title">{title}</p>{/if}
          {#if subtitle}<p class="modal-subtitle">{subtitle}</p>{/if}
        </div>
      </div>
    {/if}
    {@render children()}
    {#if oncancel}
      <button type="button" class="modal-cancel-btn" onclick={oncancel}>Cancel</button>
    {/if}
  </div>
</div>
