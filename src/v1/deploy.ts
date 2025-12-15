import { getAllAvailableServersWithRootAccess, scriptWithVersion } from './helpers.js';
import { HACK_SCRIPT, HELPER_FUNCTIONS } from './v1-constants.js';
import { NS } from '@ns';

/** @param {NS} ns */
export function main(ns: NS) {
  const hosts = getAllAvailableServersWithRootAccess(ns);

  // Copy scripts from v1/ folder on home to root on target servers
  const sourceHelperPath = scriptWithVersion(HELPER_FUNCTIONS);
  const targetHelperPath = HELPER_FUNCTIONS;

  // Create temp file on home root if we need to deploy helpers
  const needsHelperDeploy = hosts.some(host => !ns.fileExists(targetHelperPath, host));
  if (needsHelperDeploy) {
    const content = ns.read(sourceHelperPath);
    ns.write(targetHelperPath, content, 'w');
  }

  const sourceHackPath = scriptWithVersion(HACK_SCRIPT);
  const targetHackPath = HACK_SCRIPT;

  // Create temp file on home root if we need to deploy hack script
  const needsHackDeploy = hosts.some(host => !ns.fileExists(targetHackPath, host));
  if (needsHackDeploy) {
    const content = ns.read(sourceHackPath);
    ns.write(targetHackPath, content, 'w');
  }

  const sourceConstantsPath = scriptWithVersion('v1-constants.js');
  const targetConstantsPath = 'v1-constants.js';

  // Create temp file on home root if we need to deploy constants
  const needsConstantsDeploy = hosts.some(host => !ns.fileExists(targetConstantsPath, host));
  if (needsConstantsDeploy) {
    const content = ns.read(sourceConstantsPath);
    ns.write(targetConstantsPath, content, 'w');
  }

  hosts.forEach(host => {
    if (!ns.fileExists(targetHelperPath, host)) {
      ns.tprint(`Helper functions (${HELPER_FUNCTIONS}) doesn't exist on ${host}, copying now...`)
      ns.scp(targetHelperPath, host, 'home');
    }

    if (!ns.fileExists(targetHackPath, host)) {
      ns.tprint(`Hack script (${HACK_SCRIPT}) doesn't exist on ${host}, copying now...`)
      ns.scp(targetHackPath, host, 'home');
    }

    if (!ns.fileExists(targetConstantsPath, host)) {
      ns.tprint(`Constants file (v1-constants.js) doesn't exist on ${host}, copying now...`)
      ns.scp(targetConstantsPath, host, 'home');
    }
  })

  // Clean up temp files on home
  if (needsHelperDeploy) {
    ns.rm(targetHelperPath, 'home');
  }
  if (needsHackDeploy) {
    ns.rm(targetHackPath, 'home');
  }
  if (needsConstantsDeploy) {
    ns.rm(targetConstantsPath, 'home');
  }
}