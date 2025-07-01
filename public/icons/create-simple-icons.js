#!/usr/bin/env node

// Simple icon creator using Canvas API (if available) or creating minimal SVG icons
const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
const createSVGIcon = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.floor(size/8)}" fill="#4f46e5"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="white" opacity="0.2"/>
  <path d="M${size*0.3} ${size*0.4}h${size*0.4}v${size*0.1}h-${size*0.4}z" fill="white"/>
  <path d="M${size*0.3} ${size*0.5}h${size*0.2}v${size*0.1}h-${size*0.2}z" fill="white"/>
  <circle cx="${size*0.6}" cy="${size*0.6}" r="${size*0.05}" fill="#fbbf24"/>
  <text x="${size/2}" y="${size*0.8}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${size*0.15}" font-weight="bold">ET</text>
</svg>`;

// Icon sizes needed
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('Creating simple SVG icons...');

// Create SVG icons for each size
sizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const svgFileName = `icon-${size}x${size}.svg`;
  const svgPath = path.join(__dirname, svgFileName);
  
  fs.writeFileSync(svgPath, svgContent);
  console.log(`Created: ${svgFileName}`);
});

// Create shortcut icons
const shortcuts = [
  { name: 'purchase', icon: '💰', color: '#10b981' },
  { name: 'reports', icon: '📊', color: '#3b82f6' },
  { name: 'contribution', icon: '⚡', color: '#8b5cf6' }
];

shortcuts.forEach(shortcut => {
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
    <rect width="96" height="96" rx="12" fill="${shortcut.color}"/>
    <text x="48" y="60" text-anchor="middle" font-size="40">${shortcut.icon}</text>
  </svg>`;
  
  const fileName = `shortcut-${shortcut.name}.svg`;
  fs.writeFileSync(path.join(__dirname, fileName), svgContent);
  console.log(`Created: ${fileName}`);
});

console.log('\nSVG icons created successfully!');
console.log('To create PNG versions, you can use an online SVG to PNG converter');
console.log('or install imagemagick and run: convert icon.svg icon.png');