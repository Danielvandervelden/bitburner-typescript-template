import { NS } from "@ns";
import { CHECK_HACK_SCRIPT, DEPLOY_HACKED_SCRIPT, DEPLOY_PURCHASED_SCRIPT } from "./utils/constants.js";

export async function main(ns: NS) {
    ns.run(CHECK_HACK_SCRIPT);    
    // ns.exec(DEPLOY_PURCHASED_SCRIPT, 'home');
    // ns.exec(DEPLOY_HACKED_SCRIPT, 'home');
}