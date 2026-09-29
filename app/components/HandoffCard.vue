<script setup lang="ts">
import qrcode from 'qrcode-generator'

// A QR code to this site, so a visitor can open it on a phone and watch a request made there arrive here.
// Hidden on localhost, where a phone could not open the address anyway.
const url = ref('')
const src = ref('')

onMounted(() => {
  const { hostname, origin } = window.location
  if (hostname === 'localhost' || hostname === '127.0.0.1') return
  const qr = qrcode(0, 'M')
  qr.addData(origin)
  qr.make()
  url.value = origin
  src.value = `data:image/svg+xml;utf8,${encodeURIComponent(qr.createSvgTag({ scalable: true, margin: 0 }))}`
})
</script>

<template>
  <aside
    v-if="src"
    class="mt-6 hidden items-center gap-4 rounded-xl border border-default p-4 lg:flex"
    aria-label="Try it on your phone"
  >
    <img
      :src="src"
      :alt="`QR code that opens ${url} on your phone`"
      class="size-24 shrink-0 rounded-md bg-white p-1.5"
    >
    <div>
      <p class="text-sm font-medium text-highlighted">
        Try it on your phone
      </p>
      <p class="mt-1 text-sm text-toned">
        Scan this, report a problem there, and watch it land in this list.
      </p>
    </div>
  </aside>
</template>
