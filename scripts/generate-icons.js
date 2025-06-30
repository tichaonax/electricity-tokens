const fs = require('fs');
const path = require('path');

// Simple icon generator for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a simple SVG icon
const createSVGIcon = (size) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#4f46e5" rx="${size * 0.2}"/>
  <circle cx="${size * 0.5}" cy="${size * 0.3}" r="${size * 0.15}" fill="white"/>
  <path d="M${size * 0.25} ${size * 0.55} L${size * 0.75} ${size * 0.55} L${size * 0.5} ${size * 0.8} Z" fill="white"/>
  <text x="${size * 0.5}" y="${size * 0.9}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${size * 0.08}" font-weight="bold">ET</text>
</svg>`;
};

// For shortcuts, create simpler icons
const createShortcutSVG = (icon, size = 96) => {
  const icons = {
    purchase: `<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="white"/>`,
    reports: `<path d="M3 3v18h18v-2H5V3H3zm2 12h4v4H5v-4zm6-8h4v12h-4V7zm6-4h4v16h-4V3z" fill="white"/>`,
    contribution: `<path d="M12 2l-5.5 9h11L12 2zm0 3.84L9.47 9h5.06L12 5.84z" fill="white"/><circle cx="12" cy="17" r="3" fill="white"/>`,
  };

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
  <rect width="24" height="24" fill="#4f46e5" rx="4"/>
  ${icons[icon] || icons.purchase}
</svg>`;
};

// Convert SVG to PNG placeholder (for now, just save as SVG)
sizes.forEach((size) => {
  const svg = createSVGIcon(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.svg`), svg);
  console.log(`Generated icon-${size}x${size}.svg`);
});

// Create shortcut icons
['purchase', 'reports', 'contribution'].forEach((icon) => {
  const svg = createShortcutSVG(icon);
  fs.writeFileSync(path.join(iconsDir, `shortcut-${icon}.svg`), svg);
  console.log(`Generated shortcut-${icon}.svg`);
});

console.log('Icons generated successfully!');
