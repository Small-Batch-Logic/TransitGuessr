<script>
  let { mode, onTitleClick, center, right } = $props();
</script>

<div class="game-header">
  <div class="header-left">
    <div class="header-wordmark">
      <button class="header-site-title header-title-btn" onclick={onTitleClick}>transitguessr</button>
      <span class="header-mode-sep">·</span>
      <span class="game-mode-badge">{mode}</span>
    </div>
  </div>
  <div class="header-center">{@render center?.()}</div>
  <div class="header-right">{@render right?.()}</div>
</div>
