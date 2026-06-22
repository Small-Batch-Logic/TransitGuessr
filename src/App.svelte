<script>
  import { currentScreen, toastMsg } from './stores.js';
  import StartScreen from './screens/StartScreen.svelte';
  import GameScreen from './screens/GameScreen.svelte';
  import EndScreen from './screens/EndScreen.svelte';
  import AuditScreen from './screens/AuditScreen.svelte';
  import './style.css';

  let gameResult = $state(null);
  let toastActive = $state(false);
  let toastTimer = null;

  // Watch toastMsg store and show toast
  $effect(() => {
    const msg = $toastMsg;
    if (msg) {
      toastActive = true;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toastActive = false;
        toastMsg.set('');
      }, 2000);
    }
  });

  function handleGameEnd(result) {
    gameResult = result;
    currentScreen.set('end');
  }

  // Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration failed:', err));
    });
  }
</script>

<div id="toast" class:active={toastActive}>{$toastMsg}</div>

{#if $currentScreen === 'start'}
  <StartScreen />
{:else if $currentScreen === 'game'}
  <GameScreen onGameEnd={handleGameEnd} />
{:else if $currentScreen === 'end'}
  <EndScreen {gameResult} />
{:else if $currentScreen === 'audit' && import.meta.env.DEV}
  <AuditScreen />
{/if}
