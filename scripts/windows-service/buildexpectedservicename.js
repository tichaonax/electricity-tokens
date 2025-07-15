/**
 * Build the expected Windows service name for sc.exe commands
 *
 * node-windows automatically appends ".exe" to service names during registration.
 * This helper function ensures all our service commands use the correct name format.
 *
 * @param {string} serviceName - The base service name from config
 * @returns {string} The Windows service name with ".exe" suffix
 *
 * Example:
 *   buildServiceExpectedName("ElectricityTracker") → "ElectricityTracker.exe"
 */
const buildServiceExpectedName = (serviceName) => `${serviceName}.exe`;

module.exports = buildServiceExpectedName;
