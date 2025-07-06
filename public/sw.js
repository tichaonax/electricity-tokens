/* eslint-disable */
if (!self.define) {
  let e,
    s = {};
  const a = (a, n) => (
    (a = new URL(a + '.js', n).href),
    s[a] ||
      new Promise((s) => {
        if ('document' in self) {
          const e = document.createElement('script');
          ((e.src = a), (e.onload = s), document.head.appendChild(e));
        } else ((e = a), importScripts(a), s());
      }).then(() => {
        let e = s[a];
        if (!e) throw new Error(`Module ${a} didn't register its module`);
        return e;
      })
  );
  self.define = (n, i) => {
    const t =
      e ||
      ('document' in self ? document.currentScript.src : '') ||
      location.href;
    if (s[t]) return;
    let c = {};
    const r = (e) => a(e, t),
      o = { module: { uri: t }, exports: c, require: r };
    s[t] = Promise.all(n.map((e) => o[e] || r(e))).then((e) => (i(...e), c));
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
          revision: 'd7c0ac5a85e05c61b2a4ffa5ff55fb4b',
        },
        { url: '/FAQ.md', revision: '12a9e67a63b477ba3ef47fcfa1d26863' },
        {
          url: '/FEATURE_TUTORIALS.md',
          revision: 'b1184d0dac9c48c21cc775782f84b10a',
        },
        {
          url: '/TROUBLESHOOTING.md',
          revision: '29b6a4bf170f0ad8776daf17fb54f224',
        },
        {
          url: '/USER_MANUAL.md',
          revision: '932dbdac9bee0e5cda247d291ad53ce3',
        },
        {
          url: '/_next/app-build-manifest.json',
          revision: 'a5a1ea545c7ba1779946abedce291270',
        },
        {
          url: '/_next/static/57n4oRxhWeWM_l41bU6YS/_buildManifest.js',
          revision: 'b793569af003bc00f3b73b24f2b17c7e',
        },
        {
          url: '/_next/static/57n4oRxhWeWM_l41bU6YS/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        {
          url: '/_next/static/chunks/1661-81d8d333c49522b6.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/1684-2e692b19a9fbc935.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/2108-ebc69cd97d47eb3b.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/2717-7606fd2cea7b474e.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/2836-00bba3c6ffb1c76f.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/3188-98a48ff94259d929.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/4943-95cce454540a0094.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/4bd1b696-6e00bd47f6f0a493.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/5003-de23cc22a4f47d51.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/5488-bb0353bcc9cab611.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/615-f0aee31907777a11.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/6874-db72251a98b08786.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/7031-96f62da27a856156.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/711-3cbc5dec59e68d95.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/7156-d43f5274713dd58e.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/8255-3730752c2a1c1ca5.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/8459-f3053a117e6c1b41.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/8783-cbb6e4d73c3ed3fb.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/962-bd8d7f8327a6233e.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/_not-found/page-93ed545257352ba3.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/admin/backup/restore/route-7a8fadceb7130a77.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/admin/backup/route-e0e6c02ce2c27749.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/admin/backup/verify/route-92b61920e059bf49.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/admin/data-integrity/route-57c8eae46fcf8edf.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/admin/reset-data/route-aea7c9db580814af.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/admin/test-constraint/route-3431cd8d09fe1040.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/audit/route-e66937d10077176d.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/auth/%5B...nextauth%5D/route-da4cd7069c0a479f.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/auth/register/route-40b91b587fc0e6af.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/backup/route-cdbb625b809b1743.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/contribution-progress/route-a6a4839a32e5deda.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/contributions/%5Bid%5D/route-da80e9c4b00d8699.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/contributions/route-9b8756b73901a9e2.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/cost-analysis/route-8f53873870366f48.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/dashboard/max-daily-consumption/route-56debe07cfefdc5f.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/dashboard/progressive-consumption/route-6e6ffa9a1e857b0c.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/dashboard/route-1275d8bd48f7058a.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/dashboard/running-balance/route-4eb181033367d30f.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/db-status/route-7da0ffa45701e18d.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/debug-export/route-53dcfbb8d2450bb0.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/export-debug/route-889cceb6ad33f51b.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/export/route-76be88bb2885240b.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/health/route-54976d139bd0feb7.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/import/route-a5a0fb0880d2b797.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/meter-readings/%5Bid%5D/route-e923f4a280d95de0.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/meter-readings/route-dbaa26166788cb3d.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/purchases/%5Bid%5D/context/route-7e0514f976d6506d.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/purchases/%5Bid%5D/impact-analysis/route-2d9d3f4c32735e20.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/purchases/%5Bid%5D/route-2272ddd43978eaeb.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/purchases/route-9af7996dd539b7a5.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/reports/efficiency/route-6497a5ea14606b57.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/reports/financial/route-f1aaaed132578af9.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/reports/route-72958971d7152c75.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/reports/usage/route-4aced1b55b370531.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/seed-test-data/route-97e2b8a69c6cebbb.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/test-data/route-f770684a17cdf349.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/test-export-simple/route-a673a77efcda799e.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/test-export/route-43c2f97459505e96.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/test-pdf-table/route-3dae64d148b5cf47.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/test-pdf/route-e897ff6e300ab62f.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5Bid%5D/route-6cffd6b6c60cd37e.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/users/route-f311fce949f85ddf.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/validate-contribution-meter/route-4ab9c5126f901d4a.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/validate-meter-reading-historical/route-367332fb8df8dcc0.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/validate-meter-reading/route-31a24682a59e83d6.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/api/validate-sequential-purchase/route-78a9b318310b9be0.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/auth/locked/page-ca0816aaaea50583.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/auth/signin/page-a58cf41bce2ca42a.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/auth/signup/page-bfc9656d49bc1862.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/audit/page-bd630743b3362fbd.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/monitoring/page-1d43c35106d6eec3.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/page-8204a6b278eeb1d9.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/reports/page-c26382077cb70956.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/security/page-3bde9095f9a5a2c0.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/settings/page-9656dc0a1a6105e9.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/users/%5Bid%5D/edit/page-11bdba417ebf96d0.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/users/new/page-9ab1f549bfacb315.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/users/page-884178cddbea91b6.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/dashboard/contributions/edit/%5Bid%5D/page-e64f202766b9ae10.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/dashboard/contributions/new/page-cc8e45997f635953.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/dashboard/contributions/page-955185c13a6348e2.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/dashboard/cost-analysis/page-b58a189b583f70d5.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/dashboard/data-management/page-f5a46ed812267fdf.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/dashboard/meter-readings/page-5bcbe7972527ece7.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/dashboard/page-ae9837df5bb4b6d2.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/dashboard/personal/page-f5c6d5e0951c1091.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/dashboard/purchases/edit/%5Bid%5D/page-0d5e26090b7bd6cb.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/dashboard/purchases/history/page-fe21ca12e528446f.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/dashboard/purchases/new/page-1b4f7f02baaa38d4.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/dashboard/purchases/page-c5de659240fb2d71.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/dashboard/reports/efficiency/page-852c2e17e5b8e9d3.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/dashboard/reports/financial/page-606e94413c7c71c7.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/dashboard/reports/usage/page-b6f3d981a441c172.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/error-ed9edcbd5729441a.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/help/page-7190195b67a48342.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/layout-7d7944a2bd54b4b8.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/not-found-00724538c502ec72.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/page-23ad9791495d1408.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/test-charts/page-88364f7f6d219051.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/app/test-seed/page-0b0de84348107540.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/ca377847-b5e894c7666aac65.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/framework-82b67a6346ddd02b.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/main-40b5984586886bf2.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/main-app-3b47fd94dd6fc886.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/pages/_app-5d1abe03d322390c.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/pages/_error-3b2a1d523de49635.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
          revision: '846118c33b2c0e922d7b3a7676f81f6f',
        },
        {
          url: '/_next/static/chunks/webpack-93947014924b4f5d.js',
          revision: '57n4oRxhWeWM_l41bU6YS',
        },
        {
          url: '/_next/static/css/87aac5eba6cc6c21.css',
          revision: '87aac5eba6cc6c21',
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
              response: s,
              event: a,
              state: n,
            }) =>
              s && 'opaqueredirect' === s.type
                ? new Response(s.body, {
                    status: 200,
                    statusText: 'OK',
                    headers: s.headers,
                  })
                : s,
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
