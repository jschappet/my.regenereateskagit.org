<script lang="ts">
 import { page } from '$app/stores';
 import { api, message } from '$lib/workspace';
 import { displayPhotoUrl } from '../photo-url';

 export let label: string;
 export let url: string;
 export let disabled = false;
 export let onUploadChange: (active: boolean) => void;

 let uploading = false;
 let error = '';
 $: photoUrl = displayPhotoUrl(url, $page.url.origin);

 async function upload(event: Event) {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  input.value = '';
  error = '';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
   error = 'Choose a JPG, PNG, or WebP photo up to 5 MB.';
   return;
  }

  uploading = true;
  onUploadChange(true);
  try {
   const form = new FormData();
   form.append('file', file);
   const result = await api.call<{url: string}>('upload', {}, form);
   if (!result?.url) throw new Error('The photo could not be uploaded.');
   url = result.url;
  } catch (cause) {
   error = message(cause);
  } finally {
   uploading = false;
   onUploadChange(false);
  }
 }
</script>

<div class="photo">
 <label>{label}
  <input type="file" accept="image/jpeg,image/png,image/webp" on:change={upload} disabled={disabled || uploading} />
 </label>
 {#if uploading}<p class="fine" role="status">Uploading photo…</p>{/if}
 {#if error}<p class="alert" role="alert">{error}</p>{/if}
 {#if photoUrl}
  <img src={photoUrl} alt={label} loading="lazy" />
  <button type="button" class="text-button" disabled={disabled || uploading} on:click={() => { url = ''; error = ''; }}>Remove photo</button>
 {/if}
</div>

<style>
 label { margin: 0; }
 input { min-width: 0; }
 img { display: block; width: 100%; max-height: 12rem; object-fit: contain; margin: .5rem 0; }
</style>
