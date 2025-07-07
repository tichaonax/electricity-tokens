if (!self.define) {
  let i,
    e = {};
  const s = (s, t) => (
    (s = new URL(s + '.js', t).href),
    e[s] ||
      new Promise((e) => {
        if ('document' in self) {
          const i = document.createElement('script');
          ((i.src = s), (i.onload = e), document.head.appendChild(i));
        } else ((i = s), importScripts(s), e());
      }).then(() => {
        let i = e[s];
        if (!i) throw new Error(`Module ${s} didn’t register its module`);
        return i;
      })
  );
  self.define = (t, a) => {
    const n =
      i ||
      ('document' in self ? document.currentScript.src : '') ||
      location.href;
    if (e[n]) return;
    let r = {};
    const c = (i) => s(i, n),
      o = { module: { uri: n }, exports: r, require: c };
    e[n] = Promise.all(t.map((i) => o[i] || c(i))).then((i) => (a(...i), r));
  };
}
define(['./workbox-14aa2a4a'], function (i) {
  'use strict';
  (importScripts(),
    self.skipWaiting(),
    i.clientsClaim(),
    i.precacheAndRoute(
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
          revision: '3b214c85f50577344034c1a713752278',
        },
        {
          url: '/_next/static/0lDwWPontrpbmhYyiYR17/_buildManifest.js',
          revision: '0bd6b8a5346f1f5f773eeae93b1da0ca',
        },
        {
          url: '/_next/static/0lDwWPontrpbmhYyiYR17/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        {
          url: '/_next/static/chunks/1684-2e692b19a9fbc935.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/2108-ebc69cd97d47eb3b.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/2836-00bba3c6ffb1c76f.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/3182-b66a5c4389c823e2.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/3188-98a48ff94259d929.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/3448-5be405266beff0b0.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/3651-b6d291955aea430b.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/375-a5ac43e069f21808.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/3814-925e3f38122860f4.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/4bd1b696-6e00bd47f6f0a493.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/5003-de23cc22a4f47d51.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/5672-9a56bb2d3036246f.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/5963-b24e3515455c8990.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/635-a1cf3ff93017f00a.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/6874-db72251a98b08786.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/7031-96f62da27a856156.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/711-3cbc5dec59e68d95.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/7259-3fe9e7affec094af.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/7718-6a791d81006c90a6.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/8037-7a594cf67ce32d89.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/9557-ac4379026527e5af.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/9964-051666643e88d000.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/_not-found/page-025dbac0071522d7.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/admin/audit-logs/route-450b007fd68e8548.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/admin/backup/restore/route-eeb60e3fb8749d35.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/admin/backup/route-881d7aa4be7972cc.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/admin/backup/verify/route-6b5a47588913f039.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/admin/clear-cache/route-2990893f535edb61.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/admin/data-integrity/route-dab6c8e511d94815.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/admin/reset-data/route-466ff9f5188b5610.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/admin/test-constraint/route-2ceed9b6e5759737.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/admin/users/%5Bid%5D/reset-password/route-e0b07ad80fb3a5a1.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/audit/route-2bd0ff53eaad1208.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/auth/%5B...nextauth%5D/route-fa0fbcffc6cf032b.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/auth/change-password/route-cad533b3a6f4dd87.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/auth/register/route-5f01b939720cd0a6.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/backup/route-a4dfa7dc2fa31892.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/contribution-progress/route-4bf1f2e894e49d5a.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/contributions/%5Bid%5D/route-49d3d9d91c8c8d5c.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/contributions/route-d27e6411d3eecd75.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/cost-analysis/route-bddfbf5c0e43d4ee.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/dashboard/max-daily-consumption/route-a0b07433d9351c66.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/dashboard/progressive-consumption/route-a1e5b7d01184c671.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/dashboard/route-697730e8c8e0cb35.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/dashboard/running-balance/route-0c9485e027d844d9.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/db-status/route-59814cce9d86d5d4.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/debug-export/route-45a045e3d0ac385c.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/export-debug/route-8de8073ab15e2134.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/export/route-826f31c93f09f658.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/health/route-9bfc5787a0fbd4be.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/import/route-b5b65dbf6d68c34a.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/meter-readings/%5Bid%5D/route-786b00fd21623d6c.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/meter-readings/route-fc2c581610423bb6.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/purchases/%5Bid%5D/context/route-c57f5f2c363e7d24.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/purchases/%5Bid%5D/impact-analysis/route-f08b1ca21cdbeada.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/purchases/%5Bid%5D/route-9e95f85da861bb99.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/purchases/route-14194144a63664c6.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/reports/efficiency/route-9e32b4965d8ec6ef.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/reports/financial/route-eaecd7887274c55b.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/reports/route-379dc3e4cf1c64f7.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/reports/usage/route-0ead6815169a128b.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/seed-test-data/route-44321cd9c15b1357.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/test-data/route-ba6cb5570eab642e.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/test-export-simple/route-fb35dc8427e83723.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/test-export/route-934e8421e46476f4.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/test-pdf-table/route-6d4100b64cd19409.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/test-pdf/route-ac51882291135763.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/user/theme/route-bcf86c5b6370e28f.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5Bid%5D/route-dd82f7e357a7567d.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/users/route-1e40d8fb533ac712.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/validate-contribution-meter/route-b8cc7135a26e0ab5.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/validate-meter-reading-historical/route-5b0833f58e6330c8.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/validate-meter-reading/route-bc497fbbca6ba599.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/api/validate-sequential-purchase/route-7e194856821cc671.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/auth/change-password/page-5d61cddfd41441d9.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/auth/locked/page-ca0816aaaea50583.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/auth/signin/page-0db1868b1100922c.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/auth/signup/page-bfc9656d49bc1862.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/audit-logs/page-b295390f1970639b.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/audit/page-bd630743b3362fbd.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/monitoring/page-47b3608e51bd37e4.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/page-71d8944aca62bb97.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/reports/page-e061973b190a37b2.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/security/page-3bde9095f9a5a2c0.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/settings/page-9656dc0a1a6105e9.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/users/%5Bid%5D/edit/page-ecac76c0e708e0ee.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/users/new/page-9c4ecf136f8eaa5b.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/users/page-c59d4ca0c7f6d15a.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/dashboard/contributions/edit/%5Bid%5D/page-f427fb5081a5a58c.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/dashboard/contributions/new/page-9217e3d267189ad2.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/dashboard/contributions/page-3a95c0b420694d8c.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/dashboard/cost-analysis/page-1d2109ae43292742.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/dashboard/data-management/page-f5a46ed812267fdf.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/dashboard/meter-readings/page-efd4fd7c2de8411c.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/dashboard/page-5951b6e0b12e9050.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/dashboard/personal/page-f5c6d5e0951c1091.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/dashboard/profile/page-e661b92baef82e1c.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/dashboard/purchases/edit/%5Bid%5D/page-713132557e87cc93.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/dashboard/purchases/history/page-06649c3e2ed40d03.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/dashboard/purchases/new/page-78e0e7a9619de6de.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/dashboard/purchases/page-c5de659240fb2d71.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/dashboard/reports/efficiency/page-1fbd3657c1f98788.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/dashboard/reports/financial/page-c332a9b73c125205.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/dashboard/reports/usage/page-2d86dd97141f3036.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/error-ed9edcbd5729441a.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/help/page-b6c37660c5044463.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/layout-9b3e5622b729b497.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/not-found-00724538c502ec72.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/page-23ad9791495d1408.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/test-charts/page-88364f7f6d219051.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/app/test-seed/page-0b0de84348107540.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/ca377847-b5e894c7666aac65.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/framework-82b67a6346ddd02b.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/main-app-3b47fd94dd6fc886.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/main-eae3a3bb9e4c25db.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/pages/_app-5d1abe03d322390c.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/pages/_error-3b2a1d523de49635.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
          revision: '846118c33b2c0e922d7b3a7676f81f6f',
        },
        {
          url: '/_next/static/chunks/webpack-93947014924b4f5d.js',
          revision: '0lDwWPontrpbmhYyiYR17',
        },
        {
          url: '/_next/static/css/39caadb473dd241d.css',
          revision: '39caadb473dd241d',
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
    i.cleanupOutdatedCaches(),
    i.registerRoute(
      '/',
      new i.NetworkFirst({
        cacheName: 'start-url',
        plugins: [
          {
            cacheWillUpdate: async ({
              request: i,
              response: e,
              event: s,
              state: t,
            }) =>
              e && 'opaqueredirect' === e.type
                ? new Response(e.body, {
                    status: 200,
                    statusText: 'OK',
                    headers: e.headers,
                  })
                : e,
          },
        ],
      }),
      'GET'
    ),
    i.registerRoute(
      /^https:\/\/fonts\.googleapis\.com\/.*/i,
      new i.CacheFirst({
        cacheName: 'google-fonts',
        plugins: [
          new i.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      'GET'
    ),
    i.registerRoute(
      /^https:\/\/fonts\.gstatic\.com\/.*/i,
      new i.CacheFirst({
        cacheName: 'google-fonts-static',
        plugins: [
          new i.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      'GET'
    ),
    i.registerRoute(
      /\.(?:js|css|woff|woff2|ttf|eot)$/i,
      new i.StaleWhileRevalidate({
        cacheName: 'static-assets',
        plugins: [
          new i.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    i.registerRoute(
      /\/api\/.*$/i,
      new i.NetworkFirst({
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        plugins: [
          new i.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ));
});
