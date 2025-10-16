if (!self.define) {
  let a,
    e = {};
  const s = (s, i) => (
    (s = new URL(s + '.js', i).href),
    e[s] ||
      new Promise((e) => {
        if ('document' in self) {
          const a = document.createElement('script');
          ((a.src = s), (a.onload = e), document.head.appendChild(a));
        } else ((a = s), importScripts(s), e());
      }).then(() => {
        let a = e[s];
        if (!a) throw new Error(`Module ${s} didn’t register its module`);
        return a;
      })
  );
  self.define = (i, t) => {
    const c =
      a ||
      ('document' in self ? document.currentScript.src : '') ||
      location.href;
    if (e[c]) return;
    let n = {};
    const r = (a) => s(a, c),
      d = { module: { uri: c }, exports: n, require: r };
    e[c] = Promise.all(i.map((a) => d[a] || r(a))).then((a) => (t(...a), n));
  };
}
define(['./workbox-14aa2a4a'], function (a) {
  'use strict';
  (importScripts(),
    self.skipWaiting(),
    a.clientsClaim(),
    a.precacheAndRoute(
      [
        {
          url: '/API_DOCUMENTATION.md',
          revision: '4b4ea4666c85f67971384cffb9891ade',
        },
        {
          url: '/DATABASE_SCHEMA.md',
          revision: '73cabe5d9f6b81bd8fc4c85295f3622f',
        },
        { url: '/FAQ.md', revision: 'f75efd380134db863a58d0449f8bdd55' },
        {
          url: '/FEATURE_TUTORIALS.md',
          revision: '348b28378134d5652dc6744fd6aad94f',
        },
        {
          url: '/TROUBLESHOOTING.md',
          revision: '622a6342466d31a4b16d285f7bc74208',
        },
        {
          url: '/USER_MANUAL.md',
          revision: '74c27fe3263ed7912cdcb8d15cf60600',
        },
        {
          url: '/_next/app-build-manifest.json',
          revision: '35d3c40c459313d5d297a72d2b12b8d7',
        },
        {
          url: '/_next/static/9dyV7lhOrRT0WjzE39BLV/_buildManifest.js',
          revision: '29166b509c81a6a79411a7b576b00c46',
        },
        {
          url: '/_next/static/9dyV7lhOrRT0WjzE39BLV/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        {
          url: '/_next/static/chunks/1255-f206d8cb7c37a3ff.js',
          revision: 'f206d8cb7c37a3ff',
        },
        {
          url: '/_next/static/chunks/157-abf031bfe6947adc.js',
          revision: 'abf031bfe6947adc',
        },
        {
          url: '/_next/static/chunks/1646.a93085a0445ba909.js',
          revision: 'a93085a0445ba909',
        },
        {
          url: '/_next/static/chunks/2619-04bc32f026a0d946.js',
          revision: '04bc32f026a0d946',
        },
        {
          url: '/_next/static/chunks/2833-b8e78a461184d2e0.js',
          revision: 'b8e78a461184d2e0',
        },
        {
          url: '/_next/static/chunks/2871-f7fecbd3593f3d81.js',
          revision: 'f7fecbd3593f3d81',
        },
        {
          url: '/_next/static/chunks/2906-b63637e783deeb96.js',
          revision: 'b63637e783deeb96',
        },
        {
          url: '/_next/static/chunks/3104-5fc85cc32ce5a3c6.js',
          revision: '5fc85cc32ce5a3c6',
        },
        {
          url: '/_next/static/chunks/3884-d85a86f2fca215c3.js',
          revision: 'd85a86f2fca215c3',
        },
        {
          url: '/_next/static/chunks/3935-ef859ad9f992c2f6.js',
          revision: 'ef859ad9f992c2f6',
        },
        {
          url: '/_next/static/chunks/4504-d045b5b649d3a468.js',
          revision: 'd045b5b649d3a468',
        },
        {
          url: '/_next/static/chunks/4767-dd10b73c73dfcc9b.js',
          revision: 'dd10b73c73dfcc9b',
        },
        {
          url: '/_next/static/chunks/4933-ea0346b0bc570ce2.js',
          revision: 'ea0346b0bc570ce2',
        },
        {
          url: '/_next/static/chunks/4bd1b696-100b9d70ed4e49c1.js',
          revision: '100b9d70ed4e49c1',
        },
        {
          url: '/_next/static/chunks/5139.e4ff9cc3669129ed.js',
          revision: 'e4ff9cc3669129ed',
        },
        {
          url: '/_next/static/chunks/5283-556ee77a46b060f8.js',
          revision: '556ee77a46b060f8',
        },
        {
          url: '/_next/static/chunks/5457-2b89061e96a7694e.js',
          revision: '2b89061e96a7694e',
        },
        {
          url: '/_next/static/chunks/573-ef07df169b4c56ca.js',
          revision: 'ef07df169b4c56ca',
        },
        {
          url: '/_next/static/chunks/6236-930939436d32a9a5.js',
          revision: '930939436d32a9a5',
        },
        {
          url: '/_next/static/chunks/6489-6d35c93454e03226.js',
          revision: '6d35c93454e03226',
        },
        {
          url: '/_next/static/chunks/6599-d8a017fe57afa0c8.js',
          revision: 'd8a017fe57afa0c8',
        },
        {
          url: '/_next/static/chunks/6740-27c1a4645860ff04.js',
          revision: '27c1a4645860ff04',
        },
        {
          url: '/_next/static/chunks/6783-48257da4d904453c.js',
          revision: '48257da4d904453c',
        },
        {
          url: '/_next/static/chunks/6959-054aca7998c9a424.js',
          revision: '054aca7998c9a424',
        },
        {
          url: '/_next/static/chunks/7349-4fd3411d674950d8.js',
          revision: '4fd3411d674950d8',
        },
        {
          url: '/_next/static/chunks/735-12ebe24260e18f44.js',
          revision: '12ebe24260e18f44',
        },
        {
          url: '/_next/static/chunks/7376-3f24886b7e31c1f1.js',
          revision: '3f24886b7e31c1f1',
        },
        {
          url: '/_next/static/chunks/7482-fbec07f91d7a7b56.js',
          revision: 'fbec07f91d7a7b56',
        },
        {
          url: '/_next/static/chunks/7534-b9c90487d2e03686.js',
          revision: 'b9c90487d2e03686',
        },
        {
          url: '/_next/static/chunks/7908-bb89bc910a09d3a9.js',
          revision: 'bb89bc910a09d3a9',
        },
        {
          url: '/_next/static/chunks/8060-e92c4b1416c274fd.js',
          revision: 'e92c4b1416c274fd',
        },
        {
          url: '/_next/static/chunks/8362-7406b3dd8c0a701e.js',
          revision: '7406b3dd8c0a701e',
        },
        {
          url: '/_next/static/chunks/9883-0761f8bfb5fda6e3.js',
          revision: '0761f8bfb5fda6e3',
        },
        {
          url: '/_next/static/chunks/app/_not-found/page-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/admin/audit-logs/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/admin/backup/restore/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/admin/backup/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/admin/backup/verify/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/admin/clear-cache/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/admin/data-integrity/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/admin/database-performance/optimize/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/admin/database-performance/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/admin/reset-data/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/admin/test-constraint/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/admin/users/%5Bid%5D/reset-password/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/audit/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/auth/%5B...nextauth%5D/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/auth/change-password/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/auth/register/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/backup/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/contribution-progress/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/contributions/%5Bid%5D/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/contributions/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/cost-analysis/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/dashboard/max-daily-consumption/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/dashboard/progressive-consumption/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/dashboard/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/dashboard/running-balance/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/db-status/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/debug-export/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/debug/session/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/export-debug/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/export/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/health/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/import/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/meter-readings/%5Bid%5D/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/meter-readings/latest/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/meter-readings/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/purchases/%5Bid%5D/context/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/purchases/%5Bid%5D/impact-analysis/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/purchases/%5Bid%5D/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/purchases/latest/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/purchases/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/reports/efficiency/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/reports/financial/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/reports/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/reports/usage/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/seed-test-data/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/test-data/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/test-export-simple/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/test-export/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/test-pdf-table/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/test-pdf/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/user/theme/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5Bid%5D/deactivate/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5Bid%5D/reactivate/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5Bid%5D/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/users/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/validate-contribution-meter/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/validate-meter-reading-historical/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/validate-meter-reading/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/api/validate-sequential-purchase/route-3266309ede1a5aa5.js',
          revision: '3266309ede1a5aa5',
        },
        {
          url: '/_next/static/chunks/app/auth/change-password/page-d3d66e019e15a602.js',
          revision: 'd3d66e019e15a602',
        },
        {
          url: '/_next/static/chunks/app/auth/locked/page-4f68cd28e0b04a5d.js',
          revision: '4f68cd28e0b04a5d',
        },
        {
          url: '/_next/static/chunks/app/auth/signin/page-0676e8733102af32.js',
          revision: '0676e8733102af32',
        },
        {
          url: '/_next/static/chunks/app/auth/signup/page-8556a04c2ea7b520.js',
          revision: '8556a04c2ea7b520',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/audit-logs/page-7d1c6f15b9866e53.js',
          revision: '7d1c6f15b9866e53',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/audit/page-5c9931d07ddfdaef.js',
          revision: '5c9931d07ddfdaef',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/database-performance/page-d016648ca3721eb1.js',
          revision: 'd016648ca3721eb1',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/monitoring/page-a4d20f82ce0de328.js',
          revision: 'a4d20f82ce0de328',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/page-7eb92cdebabd47ef.js',
          revision: '7eb92cdebabd47ef',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/reports/page-83f85bdbf8cda6fb.js',
          revision: '83f85bdbf8cda6fb',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/security-dashboard/page-a960f572786bc21b.js',
          revision: 'a960f572786bc21b',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/security/page-4f35f81d82a8da2f.js',
          revision: '4f35f81d82a8da2f',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/settings/page-34aea075cfa34cae.js',
          revision: '34aea075cfa34cae',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/users/%5Bid%5D/edit/page-c5f351cd58ff215f.js',
          revision: 'c5f351cd58ff215f',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/users/new/page-781223db4ff21abf.js',
          revision: '781223db4ff21abf',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/users/page-03183519b32b9ac1.js',
          revision: '03183519b32b9ac1',
        },
        {
          url: '/_next/static/chunks/app/dashboard/contributions/edit/%5Bid%5D/page-15177c1eb32001a6.js',
          revision: '15177c1eb32001a6',
        },
        {
          url: '/_next/static/chunks/app/dashboard/contributions/new/page-7bd4054d380967b6.js',
          revision: '7bd4054d380967b6',
        },
        {
          url: '/_next/static/chunks/app/dashboard/contributions/page-48a91bf6772d13bf.js',
          revision: '48a91bf6772d13bf',
        },
        {
          url: '/_next/static/chunks/app/dashboard/cost-analysis/page-a2d228218adedebe.js',
          revision: 'a2d228218adedebe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/data-management/page-7b4eb5badb73dd51.js',
          revision: '7b4eb5badb73dd51',
        },
        {
          url: '/_next/static/chunks/app/dashboard/meter-readings/page-586bba6edb27591c.js',
          revision: '586bba6edb27591c',
        },
        {
          url: '/_next/static/chunks/app/dashboard/page-497fce712d6d40ed.js',
          revision: '497fce712d6d40ed',
        },
        {
          url: '/_next/static/chunks/app/dashboard/personal/page-e918abf497467516.js',
          revision: 'e918abf497467516',
        },
        {
          url: '/_next/static/chunks/app/dashboard/profile/page-2cbe1b82bdaebdab.js',
          revision: '2cbe1b82bdaebdab',
        },
        {
          url: '/_next/static/chunks/app/dashboard/purchases/edit/%5Bid%5D/page-2618816be07b03e8.js',
          revision: '2618816be07b03e8',
        },
        {
          url: '/_next/static/chunks/app/dashboard/purchases/history/page-decb256080c74d38.js',
          revision: 'decb256080c74d38',
        },
        {
          url: '/_next/static/chunks/app/dashboard/purchases/new/page-09a9255e9095504a.js',
          revision: '09a9255e9095504a',
        },
        {
          url: '/_next/static/chunks/app/dashboard/purchases/page-d9fe5b7acd678930.js',
          revision: 'd9fe5b7acd678930',
        },
        {
          url: '/_next/static/chunks/app/dashboard/reports/efficiency/page-b78fddc4c4745597.js',
          revision: 'b78fddc4c4745597',
        },
        {
          url: '/_next/static/chunks/app/dashboard/reports/financial/page-6234d3d93136f0ac.js',
          revision: '6234d3d93136f0ac',
        },
        {
          url: '/_next/static/chunks/app/dashboard/reports/usage/page-4feab649aef7da02.js',
          revision: '4feab649aef7da02',
        },
        {
          url: '/_next/static/chunks/app/error-42d6bf84d3984af1.js',
          revision: '42d6bf84d3984af1',
        },
        {
          url: '/_next/static/chunks/app/help/page-7c772c86ab0601b9.js',
          revision: '7c772c86ab0601b9',
        },
        {
          url: '/_next/static/chunks/app/layout-724ad55bd73107ac.js',
          revision: '724ad55bd73107ac',
        },
        {
          url: '/_next/static/chunks/app/not-found-053ab10b71a3ae6f.js',
          revision: '053ab10b71a3ae6f',
        },
        {
          url: '/_next/static/chunks/app/page-a04aac7163a6a5e4.js',
          revision: 'a04aac7163a6a5e4',
        },
        {
          url: '/_next/static/chunks/app/test-charts/page-dafbd8e4e2c1f8f7.js',
          revision: 'dafbd8e4e2c1f8f7',
        },
        {
          url: '/_next/static/chunks/app/test-seed/page-916025686f47f3da.js',
          revision: '916025686f47f3da',
        },
        {
          url: '/_next/static/chunks/ca377847-9263eff88db7e49c.js',
          revision: '9263eff88db7e49c',
        },
        {
          url: '/_next/static/chunks/framework-0907bc41f77e1d3c.js',
          revision: '0907bc41f77e1d3c',
        },
        {
          url: '/_next/static/chunks/main-1e6032fe85683a88.js',
          revision: '1e6032fe85683a88',
        },
        {
          url: '/_next/static/chunks/main-app-f2907f4ae2f79315.js',
          revision: 'f2907f4ae2f79315',
        },
        {
          url: '/_next/static/chunks/pages/_app-e8b861c87f6f033c.js',
          revision: 'e8b861c87f6f033c',
        },
        {
          url: '/_next/static/chunks/pages/_error-c8f84f7bd11d43d4.js',
          revision: 'c8f84f7bd11d43d4',
        },
        {
          url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
          revision: '846118c33b2c0e922d7b3a7676f81f6f',
        },
        {
          url: '/_next/static/chunks/webpack-3ab36f0c3e6ccc6c.js',
          revision: '3ab36f0c3e6ccc6c',
        },
        {
          url: '/_next/static/css/3311ba84aec1d2e0.css',
          revision: '3311ba84aec1d2e0',
        },
        {
          url: '/_next/static/css/de70bee13400563f.css',
          revision: 'de70bee13400563f',
        },
        {
          url: '/_next/static/media/4cf2300e9c8272f7-s.p.woff2',
          revision: '18bae71b1e1b2bb25321090a3b563103',
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
          url: '/build-info.json',
          revision: '94587c4ef4bb1d66693a5f4b66178a65',
        },
        {
          url: '/favicon.ico.svg',
          revision: '8b16fc30bfcb8e8fa50e68bcd85c928a',
        },
        { url: '/favicon.svg', revision: '8b16fc30bfcb8e8fa50e68bcd85c928a' },
        { url: '/file.svg', revision: 'd09f95206c3fa0bb9bd9fefabfd0ea71' },
        { url: '/globe.svg', revision: '2aaafa6a49b6563925fe440891e32717' },
        {
          url: '/icons/create-simple-icons.js',
          revision: 'da5c2afc14cbba745a0158bab112e8db',
        },
        {
          url: '/icons/generate-icons.js',
          revision: 'da7ccebdaa5a18931491d9daf16a5966',
        },
        {
          url: '/icons/icon-128x128.svg',
          revision: '69efe2ff48e97c6ae182387396aeff2c',
        },
        {
          url: '/icons/icon-144x144.svg',
          revision: '7d911a92873b5e3814d33f0959abe115',
        },
        {
          url: '/icons/icon-152x152.svg',
          revision: '709e288ef5485833b15a6c9133a650f0',
        },
        {
          url: '/icons/icon-192x192.svg',
          revision: '5b59b13eab5e3159c63910f5bf76f59f',
        },
        {
          url: '/icons/icon-32x32.svg',
          revision: '8c7f0e67d8c946224a977c77f831e630',
        },
        {
          url: '/icons/icon-384x384.svg',
          revision: 'b0bc20df3f59a276065debe1252a7876',
        },
        {
          url: '/icons/icon-512x512.svg',
          revision: 'e3b73f144c86355dfedbdc02f69369c6',
        },
        {
          url: '/icons/icon-72x72.svg',
          revision: 'bb0e272336bf8cc5b140b662ced8796c',
        },
        {
          url: '/icons/icon-96x96.svg',
          revision: 'ae687c5d2b21ec6f7dcf999786d28d84',
        },
        {
          url: '/icons/icon-base.svg',
          revision: '124d1bd3f4fb772ff7646cd2f9e537d6',
        },
        {
          url: '/icons/shortcut-contribution.svg',
          revision: '47dd1d2fccc900bf51d8bdfb9437f675',
        },
        {
          url: '/icons/shortcut-purchase.svg',
          revision: '05767ed8d68b472030861e827765875c',
        },
        {
          url: '/icons/shortcut-reports.svg',
          revision: 'a3ce746fd17d229db1056a730a910247',
        },
        { url: '/manifest.json', revision: 'cf681df221fdb069f1892187f75b1940' },
        { url: '/next.svg', revision: '8e061864f388b47f33a1c3780831193e' },
        { url: '/vercel.svg', revision: 'c0af2f507b369b085b35ef4bbe3bcf1e' },
        { url: '/window.svg', revision: 'a2760511c65806022ad20adf74370ff3' },
      ],
      { ignoreURLParametersMatching: [] }
    ),
    a.cleanupOutdatedCaches(),
    a.registerRoute(
      '/',
      new a.NetworkFirst({
        cacheName: 'start-url',
        plugins: [
          {
            cacheWillUpdate: async ({
              request: a,
              response: e,
              event: s,
              state: i,
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
    a.registerRoute(
      /^https:\/\/fonts\.googleapis\.com\/.*/i,
      new a.CacheFirst({
        cacheName: 'google-fonts',
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      'GET'
    ),
    a.registerRoute(
      /^https:\/\/fonts\.gstatic\.com\/.*/i,
      new a.CacheFirst({
        cacheName: 'google-fonts-static',
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      'GET'
    ),
    a.registerRoute(
      /\.(?:js|css|woff|woff2|ttf|eot)$/i,
      new a.StaleWhileRevalidate({
        cacheName: 'static-assets',
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    a.registerRoute(
      /\/api\/.*$/i,
      new a.NetworkFirst({
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ));
});
