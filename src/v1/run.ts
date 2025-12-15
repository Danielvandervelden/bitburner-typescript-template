import { getAllAvailableServersWithRootAccess, scriptWithVersion } from './helpers.js';
import { HACK_SCRIPT } from './v1-constants.js';
import { NS } from '@ns';

export async function main(ns: NS) {
  ns.tprint('Running run script');

  const hosts = getAllAvailableServersWithRootAccess(ns);

  hosts.forEach(host => {
    // Scripts are deployed to root on remote servers, not in v1/ folder
    const scriptPath = HACK_SCRIPT;

    // Check if script exists on target host first
    if (!ns.fileExists(scriptPath, host)) {
      return;
    }

    ns.print(`[${host}] Checking if script is already running`);
    if (ns.isRunning(scriptPath, host)) {
      return;
    }

    // Get script RAM (without server parameter - works from any context)
    const scriptRam = ns.getScriptRam(scriptPath, host);
    if (scriptRam === 0) {
      ns.tprint(`[${host}] ERROR: Could not get script RAM for ${scriptPath}`);
      return;
    }

    const maxRam = ns.getServerMaxRam(host);
    const usedRam = ns.getServerUsedRam(host);
    const availableRam = maxRam - usedRam;
    const threads = Math.floor(availableRam / scriptRam);

    if (threads <= 0) {
      return;
    }

    ns.print(`[${host}] Script path: ${scriptPath}, RAM: ${scriptRam}, Max RAM: ${maxRam}, Used RAM: ${usedRam}, Available RAM: ${availableRam}, Threads: ${threads}`);

    if (isNaN(threads) || !isFinite(threads)) {
      ns.tprint(`[${host}] ERROR: Threads is NaN or Infinity`);
      return;
    }

    ns.print(`[${host}] Checking if threads is valid: ${threads}`);
    if (threads < 1 || threads > 99999999999) {
      ns.tprint(`[${host}] ERROR: Invalid thread count: ${threads}`);
      return;
    }

    ns.tprint(`[${host}] Executing ${scriptPath} with ${threads} threads (Available RAM: ${availableRam}GB, Script RAM: ${scriptRam}GB)`);
    const pid = ns.exec(scriptPath, host, threads);
    if (pid === 0) {
      ns.tprint(`[${host}] ERROR: Failed to execute script. Available RAM: ${availableRam}GB, Required: ${scriptRam * threads}GB`);
    } else {
      ns.tprint(`[${host}] Successfully started script with PID: ${pid}`);
    }
  })
}