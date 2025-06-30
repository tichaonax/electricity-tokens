// Simple script to create placeholder icons for PWA
// Run with: node public/icons/generate-icons.js

const fs = require('fs');
const path = require('path');

// Create a simple SVG icon as base
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="#4f46e5">
  <rect width="512" height="512" rx="64" fill="#4f46e5"/>
  <path d="M256 96c-88.4 0-160 71.6-160 160s71.6 160 160 160 160-71.6 160-160S344.4 96 256 96zm-32 256h-32v-32h32v32zm0-64h-32v-96h32v96zm64 64h-32v-32h64l-16-32h-16v-64h32l32 32v64l-32 32h-32z" fill="white"/>
  <text x="256" y="320" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="48" font-weight="bold">ET</text>
</svg>`;

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('Creating PWA icon placeholders...');

// Create base SVG
fs.writeFileSync(path.join(__dirname, 'icon-base.svg'), svgIcon);

// Create placeholder PNG files (these would normally be generated from the SVG)
sizes.forEach(size => {
  const fileName = `icon-${size}x${size}.png`;
  const placeholder = `PNG placeholder for ${size}x${size} icon - replace with actual PNG files`;
  
  // Create empty files as placeholders
  fs.writeFileSync(path.join(__dirname, fileName), '');
  console.log(`Created placeholder: ${fileName}`);
});

// Create shortcut icons
const shortcuts = ['purchase', 'reports', 'contribution'];
shortcuts.forEach(shortcut => {
  const fileName = `shortcut-${shortcut}.png`;
  fs.writeFileSync(path.join(__dirname, fileName), '');
  console.log(`Created placeholder: ${fileName}`);
});

console.log('\nIcon placeholders created! Replace these with actual PNG files.');
console.log('Use the icon-base.svg as a starting point for your icon design.');