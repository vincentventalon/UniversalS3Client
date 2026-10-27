// Garde de `npm run deploy` — source : ~/Code/cockpit/_ops/deploy-guard/
// (copié dans chaque produit par install.sh ; ne pas éditer la copie).
//
// Un site qui a un CI se déploie par le CI (push sur la branche par défaut),
// jamais depuis le Mac. Le 26/10/2026, un deploy local depuis un main en
// retard sur GitHub a effacé deviensdev.fr/crm pendant 14 h ; le CI, lui,
// efface ce que le Mac a publié sans le pousser.
//
// Urgence seulement (CI en panne) : DEPLOY_FROM_MAC=1 npm run deploy — et la
// branche locale doit être propre et identique à celle de GitHub.
import { execSync } from "node:child_process";

if (process.env.CI === "true") process.exit(0);

const stop = (msg) => {
  console.error(`\n✋ Deploy refusé : ${msg}\n`);
  process.exit(1);
};

const git = (cmd) =>
  execSync(`git ${cmd}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
const exists = (ref) => {
  try {
    git(`rev-parse --verify -q ${ref}`);
    return true;
  } catch {
    return false;
  }
};
// Branche de prod : main, ou master pour les repos qui n'ont que master.
const base = !exists("origin/main") && exists("origin/master") ? "master" : "main";

if (process.env.DEPLOY_FROM_MAC !== "1") {
  stop(
    "ce site se déploie par le CI, pas depuis le Mac.\n" +
      `   Committe, puis \`git pull --rebase && git push\` sur ${base} : le workflow de deploy publie.\n` +
      "   Urgence (CI en panne) : DEPLOY_FROM_MAC=1 npm run deploy",
  );
}

git(`fetch -q origin ${base}`);
if (git("rev-parse --abbrev-ref HEAD") !== base) stop(`pas sur ${base}.`);
if (git("status --porcelain")) stop("des changements ne sont pas commités.");
const local = git("rev-parse HEAD");
const remote = git(`rev-parse origin/${base}`);
if (local !== remote) {
  stop(
    `${base} local (${local.slice(0, 7)}) ≠ origin/${base} (${remote.slice(0, 7)}).\n` +
      "   `git pull --rebase && git push` d'abord — et alors le CI déploie tout seul.",
  );
}
console.log(`⚠️  Deploy depuis le Mac (DEPLOY_FROM_MAC=1), ${base} identique à origin/${base}.`);
