import { NS } from "@ns";

export async function main(ns: NS) {
  const certain = ns.prompt('Are you sure you want to remove all the purchased servers?');

  var currentServers = ns.getPurchasedServers();

  for (var i = 0; i < currentServers.length; ++i) {
    var serv = currentServers[i];
    ns.killall(serv);
    ns.deleteServer(serv);
  }
}