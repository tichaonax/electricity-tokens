/**
 * Reports Index Page
 * 
 * Redirects to the Usage Report as the default report view
 * This page handles the /dashboard/reports route
 */

import { redirect } from 'next/navigation';

export default function ReportsPage() {
  // Redirect to usage report as default
  redirect('/dashboard/reports/usage');
}
