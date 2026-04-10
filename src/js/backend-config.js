// Optional backend configuration.
// Leave values empty to keep localStorage-only mode.
window.RED_LANTERN_BACKEND = {
  supabaseUrl: 'https://dwgainmsnohhmavxnxsw.supabase.co',
  anonKey: 'sb_publishable_iAGkZkJohQ1Ps1K2r-TKfw_8Q5nhXV7',
  menuTable: 'menu_items',
  ordersTable: 'orders',

  // Optional iPhone Safari cloud speech-to-text endpoint.
  // Expected response JSON shape: { text: "..." } or { transcript: "..." }
  sttProxyUrl: '',

  // Optional bearer token sent to sttProxyUrl.
  // Keep secrets on the server-side proxy, not in this file.
  sttAuthToken: ''
};
