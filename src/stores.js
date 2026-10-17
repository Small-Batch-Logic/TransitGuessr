import { writable } from 'svelte/store';

export const currentScreen = writable('start'); // 'start' | 'game' | 'end' | 'audit'
export const selectedMode = writable('worldwide');
export const toastMsg = writable('');
