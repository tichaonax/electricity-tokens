if (!self.define) {
  let e,
    i = {};
  const s = (s, a) => (
    (s = new URL(s + '.js', a).href),
    i[s] ||
      new Promise((i) => {
        if ('document' in self) {
          const e = document.createElement('script');
          ((e.src = s), (e.onload = i), document.head.appendChild(e));
        } else ((e = s), importScripts(s), i());
      }).then(() => {
        let e = i[s];
        if (!e) throw new Error(`Module ${s} didn’t register its module`);
        return e;
      })
  );
  self.define = (a, t) => {
    const n =
      e ||
      ('document' in self ? document.currentScript.src : '') ||
      location.href;
    if (i[n]) return;
    let c = {};
    const r = (e) => s(e, n),
      d = { module: { uri: n }, exports: c, require: r };
    i[n] = Promise.all(a.map((e) => d[e] || r(e))).then((e) => (t(...e), c));
  };
}
define(['./workbox-14aa2a4a'], function (e) {
  'use strict';
  (importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: '/API_DOCUMENTATION.md',
          revision: '28c12eef855fbf009ef39134e9d619f4',
        },
        {
          url: '/DATABASE_SCHEMA.md',
          revision: '4cbc910c204bbad96957649e962f9132',
        },
        { url: '/FAQ.md', revision: 'b5c292a33f5bb5a4915d1c6fc8b84760' },
        {
          url: '/FEATURE_TUTORIALS.md',
          revision: '0236a0ccf5f0b34f27699d39174366f6',
        },
        {
          url: '/TROUBLESHOOTING.md',
          revision: '29b6a4bf170f0ad8776daf17fb54f224',
        },
        {
          url: '/USER_MANUAL.md',
          revision: 'a6fe1dfcb0b96c8847ab3a6374f51809',
        },
        {
          url: '/_next/app-build-manifest.json',
          revision: 'dde193830c915d3f4fc5120914b17cba',
        },
        {
          url: '/_next/static/QvdzMSCHXkYhKGlOyibJe/_buildManifest.js',
          revision: '658720b378e1b08846263d287fda9c11',
        },
        {
          url: '/_next/static/QvdzMSCHXkYhKGlOyibJe/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        {
          url: '/_next/static/chunks/1492-c5f74765c30ed19a.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/1684-2e692b19a9fbc935.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/2108-ebc69cd97d47eb3b.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/2836-00bba3c6ffb1c76f.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/3182-d891821a86285cab.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/3188-9c40a88796579baa.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/3448-49ab413e85dffcbc.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/3814-925e3f38122860f4.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/4028-85ceb5296df53cf2.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/472-af2112399c8ad20d.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/4bd1b696-6e00bd47f6f0a493.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/5003-de23cc22a4f47d51.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/5004-a9210e4cba7730fb.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/5672-71f2a71d96eb6b30.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/5963-b24e3515455c8990.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/635-a1cf3ff93017f00a.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/6874-db72251a98b08786.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/7031-de7fe912fd536763.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/711-1d7dd0781b45afd8.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/7259-3fe9e7affec094af.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/7718-13a326b76734fbdb.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/7804-a05a26aae45f68d7.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/8037-7fcce052fb8c60e3.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/8259-018b1f26f311ead7.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/8527-ff10fd8a8ff91341.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/9557-c6aff4243531b88e.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/9964-c617084e90eb4fc1.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/_not-found/page-7d9aa2585b423756.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/admin/audit-logs/route-8cb9feddc3d147eb.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/admin/backup/restore/route-f64ca74bbb97ef49.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/admin/backup/route-91fce49bd886eee1.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/admin/backup/verify/route-6bff06d78dd2d0aa.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/admin/clear-cache/route-806e9b45de64e1fe.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/admin/data-integrity/route-ffb7bed5f67370e8.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/admin/database-performance/optimize/route-caa4a1cc162d4d72.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/admin/database-performance/route-021154a585d6d19c.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/admin/reset-data/route-77bed02db87df300.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/admin/test-constraint/route-90a99211bf0cbd0b.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/admin/users/%5Bid%5D/reset-password/route-245ad84dd76ec259.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/audit/route-76d701a3c93a73fc.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/auth/%5B...nextauth%5D/route-227fcfa8d472d63f.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/auth/change-password/route-d0ebdb4e95401350.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/auth/register/route-ab35a56c56cb1e11.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/backup/route-0246894c3ee48d35.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/contribution-progress/route-fdd24f1021ff78ac.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/contributions/%5Bid%5D/route-2b08e03911c9e26c.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/contributions/route-7a1c32a4a58eb398.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/cost-analysis/route-a2b08570b146bc1c.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/dashboard/max-daily-consumption/route-d190e3f7bfc72a03.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/dashboard/progressive-consumption/route-c74c38f45ca8c273.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/dashboard/route-9d1448e908a4a2f9.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/dashboard/running-balance/route-0ffa4b35890ee905.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/db-status/route-5e8575f8ce48522e.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/debug-export/route-7aff18b729cf48eb.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/export-debug/route-1ae88cd23f070928.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/export/route-3881d2ed7cb26152.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/health/route-b57dfddc5583f364.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/import/route-289e03781e5dc31f.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/meter-readings/%5Bid%5D/route-c7cbe4f3ec40b536.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/meter-readings/latest/route-e7f964c9f21ea9de.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/meter-readings/route-02a6dbe9c83c0d26.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/purchases/%5Bid%5D/context/route-9e8717044c667790.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/purchases/%5Bid%5D/impact-analysis/route-4a3100423ed1a24a.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/purchases/%5Bid%5D/route-bccff8d3d600ca71.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/purchases/latest/route-b068f5abb4bbc45b.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/purchases/route-2c9d2feb873db8bf.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/reports/efficiency/route-7838674c297245ec.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/reports/financial/route-04d1bc1548b8d5e8.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/reports/route-40bd79d2cc460af2.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/reports/usage/route-05f8f076be86b47b.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/seed-test-data/route-40e7c3df7f850aa7.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/test-data/route-b92f5c9bac4eeef6.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/test-export-simple/route-852d938056cd220f.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/test-export/route-69a55646f4315511.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/test-pdf-table/route-a8cfc2ffd7cdfbb5.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/test-pdf/route-fbcb9df2fc8bea91.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/user/theme/route-d9f32eaed8a781e0.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5Bid%5D/route-8ea4af88343d3912.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/users/route-eb346efd91ca3cbe.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/validate-contribution-meter/route-02320527f1581724.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/validate-meter-reading-historical/route-7e3283b27b677191.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/validate-meter-reading/route-29b1d66743584e2a.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/api/validate-sequential-purchase/route-e7457d90359e813d.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/auth/change-password/page-537d9b931d1508f2.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/auth/locked/page-a246779587926636.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/auth/signin/page-3339c82d24eb0afa.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/auth/signup/page-9e2e095736cec16e.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/audit-logs/page-ba9d23da96077a60.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/audit/page-99cda12c9bdc01a2.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/database-performance/page-f89ae98769a12965.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/monitoring/page-c98cdb6e0ad367dd.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/page-9b7ec93513c7d089.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/reports/page-1fce2056e4569cb8.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/security-dashboard/page-aab042137b55aa2b.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/security/page-21213efc4b0b32d3.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/settings/page-2406c95e735fa538.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/users/%5Bid%5D/edit/page-5d8084886a54cdcd.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/users/new/page-9a1390418ceaeda1.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/users/page-d05d697570f322d9.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/contributions/edit/%5Bid%5D/page-0881d5c873865730.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/contributions/new/page-cb2c1c0a23e645de.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/contributions/page-c15165baf8a60780.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/cost-analysis/page-3e67b9cfff87e6ad.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/data-management/page-9064179d3ed367fc.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/meter-readings/page-7b7c3215d5249cd1.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/page-4dabbea0ed2e2b4b.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/personal/page-1187127f9ad95fff.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/profile/page-9be7e1a3a92282ac.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/purchases/edit/%5Bid%5D/page-37a978123cbb43ad.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/purchases/history/page-106762c97333dbb7.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/purchases/new/page-e2a2f1766825fa5c.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/purchases/page-513e7fcf08d1438b.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/reports/efficiency/page-060e4a17c7ddfe49.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/reports/financial/page-4249b964033dbf0a.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/reports/usage/page-11163053a59160ac.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/error-ed9edcbd5729441a.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/help/page-a9723f70576043d8.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/layout-4da7232dd4a53d1e.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/not-found-00724538c502ec72.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/page-e04226eb4d62744b.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/test-charts/page-ca9671960312ae4a.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/app/test-seed/page-0b0de84348107540.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/ca377847-b5e894c7666aac65.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/framework-82b67a6346ddd02b.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/main-app-3b47fd94dd6fc886.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/main-eae3a3bb9e4c25db.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/pages/_app-5d1abe03d322390c.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/pages/_error-3b2a1d523de49635.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
          revision: '846118c33b2c0e922d7b3a7676f81f6f',
        },
        {
          url: '/_next/static/chunks/webpack-871bda15bc14cc2e.js',
          revision: 'QvdzMSCHXkYhKGlOyibJe',
        },
        {
          url: '/_next/static/css/d5aa616bc4cde7ad.css',
          revision: 'd5aa616bc4cde7ad',
        },
        {
          url: '/_next/static/css/f30152c0704fba31.css',
          revision: 'f30152c0704fba31',
        },
        {
          url: '/_next/static/media/569ce4b8f30dc480-s.p.woff2',
          revision: 'ef6cefb32024deac234e82f932a95cbd',
        },
        {
          url: '/_next/static/media/747892c23ea88013-s.woff2',
          revision: 'a0761690ccf4441ace5cec893b82d4ab',
        },
        {
          url: '/_next/static/media/8d697b304b401681-s.woff2',
          revision: 'cc728f6c0adb04da0dfcb0fc436a8ae5',
        },
        {
          url: '/_next/static/media/93f479601ee12b01-s.p.woff2',
          revision: 'da83d5f06d825c5ae65b7cca706cb312',
        },
        {
          url: '/_next/static/media/9610d9e46709d722-s.woff2',
          revision: '7b7c0ef93df188a852344fc272fc096b',
        },
        {
          url: '/_next/static/media/ba015fad6dcf6784-s.woff2',
          revision: '8ea4f719af3312a055caf09f34c89a77',
        },
        {
          url: '/favicon.ico.svg',
          revision: '76cd72d922f63a429f6ab2efc2d72cc3',
        },
        { url: '/favicon.svg', revision: '76cd72d922f63a429f6ab2efc2d72cc3' },
        { url: '/file.svg', revision: 'd09f95206c3fa0bb9bd9fefabfd0ea71' },
        { url: '/globe.svg', revision: '2aaafa6a49b6563925fe440891e32717' },
        {
          url: '/icons/create-simple-icons.js',
          revision: '624ab6ae1600eff9fefc5db748a3fe13',
        },
        {
          url: '/icons/generate-icons.js',
          revision: '4c75005f61c25fa92130dd305f767e5f',
        },
        {
          url: '/icons/icon-128x128.svg',
          revision: '261ddab8e95eb7f085a4c831ce82445c',
        },
        {
          url: '/icons/icon-144x144.svg',
          revision: '9f3eabe0628f5f9adcbd2ec4955a339f',
        },
        {
          url: '/icons/icon-152x152.svg',
          revision: 'd3bcb0ca20178b7f8d5dd12435068144',
        },
        {
          url: '/icons/icon-192x192.svg',
          revision: '52b96782939b266b2779709a4e0cfe3f',
        },
        {
          url: '/icons/icon-32x32.svg',
          revision: '916a9b62bbb7de65af965e3a5a9a9752',
        },
        {
          url: '/icons/icon-384x384.svg',
          revision: '8a0b0a056eeed6b54a98af6df124b93e',
        },
        {
          url: '/icons/icon-512x512.svg',
          revision: 'e6097f7d58fdb0a55f55215eb3d0d9e7',
        },
        {
          url: '/icons/icon-72x72.svg',
          revision: '300126fdde24b4f4375ae42dccdb4bf9',
        },
        {
          url: '/icons/icon-96x96.svg',
          revision: 'ee90403cd7a8aea71f16674734acb3ad',
        },
        {
          url: '/icons/icon-base.svg',
          revision: 'ca7b35eab0584e8408469fe1c7078182',
        },
        {
          url: '/icons/shortcut-contribution.svg',
          revision: 'aa444c2a1f5a82ce8cbd9c5724cbaabd',
        },
        {
          url: '/icons/shortcut-purchase.svg',
          revision: '96314fa61f82b7e8ee24a88746052b7c',
        },
        {
          url: '/icons/shortcut-reports.svg',
          revision: 'a1e5e3177d17d08c5d44566b6d0a92f7',
        },
        { url: '/manifest.json', revision: '03c9efe6064635cb26970d833333bab8' },
        { url: '/next.svg', revision: '8e061864f388b47f33a1c3780831193e' },
        { url: '/vercel.svg', revision: 'c0af2f507b369b085b35ef4bbe3bcf1e' },
        { url: '/window.svg', revision: 'a2760511c65806022ad20adf74370ff3' },
      ],
      { ignoreURLParametersMatching: [] }
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      '/',
      new e.NetworkFirst({
        cacheName: 'start-url',
        plugins: [
          {
            cacheWillUpdate: async ({
              request: e,
              response: i,
              event: s,
              state: a,
            }) =>
              i && 'opaqueredirect' === i.type
                ? new Response(i.body, {
                    status: 200,
                    statusText: 'OK',
                    headers: i.headers,
                  })
                : i,
          },
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /^https:\/\/fonts\.googleapis\.com\/.*/i,
      new e.CacheFirst({
        cacheName: 'google-fonts',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /^https:\/\/fonts\.gstatic\.com\/.*/i,
      new e.CacheFirst({
        cacheName: 'google-fonts-static',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:js|css|woff|woff2|ttf|eot)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\/api\/.*$/i,
      new e.NetworkFirst({
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ));
});
