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
    const n =
      a ||
      ('document' in self ? document.currentScript.src : '') ||
      location.href;
    if (e[n]) return;
    let c = {};
    const r = (a) => s(a, n),
      d = { module: { uri: n }, exports: c, require: r };
    e[n] = Promise.all(i.map((a) => d[a] || r(a))).then((a) => (t(...a), c));
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
          revision: '2f20b1e12665013d1e8fc89c5543c1b8',
        },
        {
          url: '/_next/static/chunks/1684-2e692b19a9fbc935.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/2108-ebc69cd97d47eb3b.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/2836-00bba3c6ffb1c76f.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/3182-d891821a86285cab.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/3188-9c40a88796579baa.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/3448-49ab413e85dffcbc.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/3814-925e3f38122860f4.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/4028-85ceb5296df53cf2.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/4bd1b696-6e00bd47f6f0a493.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/5003-de23cc22a4f47d51.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/5672-71f2a71d96eb6b30.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/5963-b24e3515455c8990.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/635-a1cf3ff93017f00a.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/6874-db72251a98b08786.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/7031-de7fe912fd536763.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/711-1d7dd0781b45afd8.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/7259-3fe9e7affec094af.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/7718-13a326b76734fbdb.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/8037-7fcce052fb8c60e3.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/8259-018b1f26f311ead7.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/8527-771d676108145f83.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/9557-c6aff4243531b88e.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/9964-c617084e90eb4fc1.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/_not-found/page-0efb7d980ad6aab2.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/admin/audit-logs/route-8c1730df417e42f5.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/admin/backup/restore/route-425988157d2c66f3.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/admin/backup/route-3d547b88d9306786.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/admin/backup/verify/route-f7f1f57bbb6105a7.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/admin/clear-cache/route-52a2497abe71da94.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/admin/data-integrity/route-298b76ef1c6f3407.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/admin/database-performance/optimize/route-779fcaec42af686c.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/admin/database-performance/route-bb53b45c41186a29.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/admin/reset-data/route-76182c6b40c36eba.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/admin/test-constraint/route-5ec42cc3a0dd7738.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/admin/users/%5Bid%5D/reset-password/route-5a233a5577af4307.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/audit/route-eeb01d780df74f87.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/auth/%5B...nextauth%5D/route-a162d1f291317fcd.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/auth/change-password/route-8f96cec868a6b4f9.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/auth/register/route-743cfa74c3259f55.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/backup/route-85e9d6a615ce597f.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/contribution-progress/route-89b39445ac60cc76.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/contributions/%5Bid%5D/route-1f8d5e932449b621.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/contributions/route-d711cf96c9c6f3e4.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/cost-analysis/route-9d87434499f2b581.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/dashboard/max-daily-consumption/route-0af12f112ece192b.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/dashboard/progressive-consumption/route-e5147345d2a6818b.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/dashboard/route-3efbe9e48bdd13f4.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/dashboard/running-balance/route-2d9184e643a39382.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/db-status/route-8e37e6d0590f101f.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/debug-export/route-bb4d40d8f1644969.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/export-debug/route-0df3befc152da6ac.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/export/route-6ac65ef3d291c56b.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/health/route-84d00eb113e25cab.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/import/route-5807b7e1e6f006d9.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/meter-readings/%5Bid%5D/route-a2a3b8582317d7fc.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/meter-readings/latest/route-61a49bda1acd8d03.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/meter-readings/route-45a10ab77078a499.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/purchases/%5Bid%5D/context/route-781070bc44934d00.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/purchases/%5Bid%5D/impact-analysis/route-57abae61b1a26720.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/purchases/%5Bid%5D/route-929632b8359ed607.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/purchases/latest/route-294c16d18f60e39b.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/purchases/route-032e14dfadddc645.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/reports/efficiency/route-f9679405b1d7eef6.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/reports/financial/route-bc7d1dd7007294ac.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/reports/route-5d7080bc4209e89e.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/reports/usage/route-6d3ab0d254102f7e.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/seed-test-data/route-ba2d6457abdc7c0f.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/test-data/route-1c39aa32a9ddf234.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/test-export-simple/route-a9700e0383a77285.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/test-export/route-92c12db37ca71765.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/test-pdf-table/route-0172c350e5738672.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/test-pdf/route-2db65a0a5fd3955f.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/user/theme/route-df2394faeee01071.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5Bid%5D/route-eac46d2967ea1dcf.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/users/route-2d75c2b8d18823a8.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/validate-contribution-meter/route-7f1c51ad3d934c20.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/validate-meter-reading-historical/route-8cdec7b69a5752ab.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/validate-meter-reading/route-46fc8109f3124306.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/api/validate-sequential-purchase/route-1acca5b01451a99f.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/auth/change-password/page-537d9b931d1508f2.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/auth/locked/page-a246779587926636.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/auth/signin/page-3339c82d24eb0afa.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/auth/signup/page-9e2e095736cec16e.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/audit-logs/page-ba9d23da96077a60.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/audit/page-163cd0aea3035f37.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/database-performance/page-45f3813e421f492c.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/monitoring/page-a6dcc2a570ebea88.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/page-97d5023a4df5e269.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/reports/page-876da27b53868552.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/security/page-5e3bbc08dacfb127.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/settings/page-b182043d47e97f08.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/users/%5Bid%5D/edit/page-5d8084886a54cdcd.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/users/new/page-9a1390418ceaeda1.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/users/page-d05d697570f322d9.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/dashboard/contributions/edit/%5Bid%5D/page-0881d5c873865730.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/dashboard/contributions/new/page-cb2c1c0a23e645de.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/dashboard/contributions/page-c15165baf8a60780.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/dashboard/cost-analysis/page-3e67b9cfff87e6ad.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/dashboard/data-management/page-9064179d3ed367fc.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/dashboard/meter-readings/page-cf69c5712cdafc24.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/dashboard/page-708d40bf61642258.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/dashboard/personal/page-1187127f9ad95fff.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/dashboard/profile/page-9be7e1a3a92282ac.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/dashboard/purchases/edit/%5Bid%5D/page-37a978123cbb43ad.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/dashboard/purchases/history/page-acc4f6815de14906.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/dashboard/purchases/new/page-e2a2f1766825fa5c.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/dashboard/purchases/page-513e7fcf08d1438b.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/dashboard/reports/efficiency/page-060e4a17c7ddfe49.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/dashboard/reports/financial/page-4249b964033dbf0a.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/dashboard/reports/usage/page-11163053a59160ac.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/error-ed9edcbd5729441a.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/help/page-a9723f70576043d8.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/layout-4f14d92981b67e72.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/not-found-00724538c502ec72.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/page-e04226eb4d62744b.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/test-charts/page-ca9671960312ae4a.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/app/test-seed/page-0b0de84348107540.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/ca377847-b5e894c7666aac65.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/framework-82b67a6346ddd02b.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/main-app-3b47fd94dd6fc886.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/main-eae3a3bb9e4c25db.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/pages/_app-5d1abe03d322390c.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/pages/_error-3b2a1d523de49635.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
          revision: '846118c33b2c0e922d7b3a7676f81f6f',
        },
        {
          url: '/_next/static/chunks/webpack-93947014924b4f5d.js',
          revision: 'lagZ5gm5dJlv39a9xg2FD',
        },
        {
          url: '/_next/static/css/e34c1550bb350209.css',
          revision: 'e34c1550bb350209',
        },
        {
          url: '/_next/static/lagZ5gm5dJlv39a9xg2FD/_buildManifest.js',
          revision: 'b67625ef962e34129b21733b5ffb007b',
        },
        {
          url: '/_next/static/lagZ5gm5dJlv39a9xg2FD/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
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
