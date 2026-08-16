#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { cp, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_PRODUCT_REPO_SLUG = "HertzFlow/product";
const PRODUCT_I18N_DIR = "docs/i18n";
const LOCALES = ["zh-Hans", "zh-Hant"];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const DEFAULT_PRODUCT_REPO =
  process.env.HERTZFLOW_PRODUCT_REPO ?? path.resolve(repoRoot, "..", "product");

const projects = [
  {
    name: "官网",
    packageFilter: "web-hub-home",
    sourceCatalog: "apps/home/locales",
    sourceFile: "官网-messages.po",
    destinationCatalog: "官网",
  },
  {
    name: "产品页-1",
    packageFilter: "web-hub-trade-v2",
    sourceCatalog: "apps/trade-v2/locales/common",
    sourceFile: "产品页-1-messages.po",
    destinationCatalog: "产品页-1",
  },
  {
    name: "产品页-2",
    packageFilter: "web-hub-trade-v2",
    sourceCatalog: "apps/trade-v2/locales",
    sourceFile: "产品页-2-messages.po",
    destinationCatalog: "产品页-2",
  },
  {
    name: "公共",
    packageFilter: "@repo/common",
    sourceCatalog: "packages/common/locales",
    sourceFile: "公共-messages.po",
    destinationCatalog: "公共",
  },
];

function parseArgs(argv) {
  const options = {
    base: "main",
    body: "Sync frontend i18n catalogs from web-hub-v2.",
    branch: null,
    commit: false,
    commitMessage: "chore(i18n): sync frontend translations",
    dryRun: false,
    productRepo: DEFAULT_PRODUCT_REPO,
    pullRequest: false,
    repo: DEFAULT_PRODUCT_REPO_SLUG,
    skipExtract: false,
    push: false,
    title: "chore(i18n): sync frontend translations",
  };

  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--skip-extract") {
      options.skipExtract = true;
    } else if (arg === "--commit") {
      options.commit = true;
    } else if (arg === "--push") {
      options.push = true;
    } else if (arg === "--pr") {
      options.pullRequest = true;
    } else if (arg === "--branch") {
      options.branch = readOptionValue(argv, index, arg);
      index += 1;
    } else if (arg.startsWith("--branch=")) {
      options.branch = arg.slice("--branch=".length);
    } else if (arg === "--message") {
      options.commitMessage = readOptionValue(argv, index, arg);
      index += 1;
    } else if (arg.startsWith("--message=")) {
      options.commitMessage = arg.slice("--message=".length);
    } else if (arg === "--title") {
      options.title = readOptionValue(argv, index, arg);
      index += 1;
    } else if (arg.startsWith("--title=")) {
      options.title = arg.slice("--title=".length);
    } else if (arg === "--body") {
      options.body = readOptionValue(argv, index, arg);
      index += 1;
    } else if (arg.startsWith("--body=")) {
      options.body = arg.slice("--body=".length);
    } else if (arg === "--base") {
      options.base = readOptionValue(argv, index, arg);
      index += 1;
    } else if (arg.startsWith("--base=")) {
      options.base = arg.slice("--base=".length);
    } else if (arg === "--repo") {
      options.repo = readOptionValue(argv, index, arg);
      index += 1;
    } else if (arg.startsWith("--repo=")) {
      options.repo = arg.slice("--repo=".length);
    } else if (arg === "-h" || arg === "--help") {
      printUsage();
      process.exit(0);
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  if (positional.length > 1) {
    throw new Error(
      `Expected at most one product repo path, got ${positional.length}`,
    );
  }

  if (positional[0]) {
    options.productRepo = positional[0];
  }

  if (options.pullRequest && !options.push) {
    throw new Error("--pr requires --push");
  }

  if (options.push && !options.commit) {
    throw new Error("--push requires --commit");
  }

  return options;
}

function readOptionValue(argv, index, optionName) {
  const value = argv[index + 1];

  if (!value || value.startsWith("-")) {
    throw new Error(`${optionName} requires a value`);
  }

  return value;
}

function printUsage() {
  console.log(`Usage: pnpm sync:i18n:product [product-repo-path] [options]

Sync frontend Lingui catalogs into product/docs/i18n.

Arguments:
  product-repo-path   Product repo path. Defaults to ${DEFAULT_PRODUCT_REPO}

Options:
  --skip-extract      Do not run Lingui extract before copying
  --dry-run           Print planned changes without writing to product repo
  --branch <name>     Product repo branch to create or switch to
  --commit            Commit docs/i18n changes in product repo
  --message <text>    Commit message. Defaults to "${"chore(i18n): sync frontend translations"}"
  --push              Push the branch to origin. Requires --commit
  --pr                Create a GitHub PR with gh. Requires --push
  --title <text>      PR title
  --body <text>       PR body
  --base <branch>     PR base branch. Defaults to main
  --repo <owner/repo> PR repo. Defaults to ${DEFAULT_PRODUCT_REPO_SLUG}
  -h, --help          Show this help message
`);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
  });

  if (result.status !== 0) {
    const details = result.stderr?.trim() || result.stdout?.trim();
    throw new Error(
      details
        ? `Command failed: ${command} ${args.join(" ")}\n${details}`
        : `Command failed: ${command} ${args.join(" ")}`,
    );
  }

  return result.stdout?.trim() ?? "";
}

function runGit(productRepo, args, options = {}) {
  return run("git", args, {
    ...options,
    cwd: productRepo,
  });
}

function runGh(productRepo, args, options = {}) {
  return run("gh", args, {
    ...options,
    cwd: productRepo,
  });
}

function getGitValue(args, fallback) {
  try {
    return run("git", args, { capture: true }) || fallback;
  } catch {
    return fallback;
  }
}

async function assertDirectory(dir, label) {
  let dirStat;
  try {
    dirStat = await stat(dir);
  } catch {
    throw new Error(`${label} does not exist: ${dir}`);
  }

  if (!dirStat.isDirectory()) {
    throw new Error(`${label} is not a directory: ${dir}`);
  }
}

async function assertProductRepo(productRepo) {
  await assertDirectory(productRepo, "Product repo");
  await assertDirectory(path.join(productRepo, ".git"), "Product repo .git");
}

async function extractCatalogs() {
  const packageFilters = [
    ...new Set(projects.map((project) => project.packageFilter)),
  ];

  for (const packageFilter of packageFilters) {
    console.log(`Extracting ${packageFilter} catalogs...`);
    run("pnpm", [
      "--filter",
      packageFilter,
      "exec",
      "lingui",
      "extract",
      "--clean",
    ]);
  }
}

function getDefaultBranchName() {
  const sourceRef =
    getGitValue(["describe", "--tags", "--exact-match"], null) ??
    getGitValue(["rev-parse", "--short", "HEAD"], "unknown");
  const normalizedRef = sourceRef
    .replace(/^refs\/tags\//, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `sync/frontend-i18n-${normalizedRef || "local"}`;
}

function ensureProductWorktreeClean(productRepo, dryRun) {
  if (dryRun) {
    console.log(
      `[dry-run] Check product repo worktree is clean: ${productRepo}`,
    );
    return;
  }

  const status = runGit(productRepo, ["status", "--porcelain"], {
    capture: true,
  });

  if (status) {
    throw new Error(
      `Product repo has uncommitted changes. Commit or stash them first:\n${status}`,
    );
  }
}

function branchExists(productRepo, branchName) {
  const result = spawnSync(
    "git",
    ["rev-parse", "--verify", `refs/heads/${branchName}`],
    {
      cwd: productRepo,
      encoding: "utf8",
      stdio: "pipe",
    },
  );

  return result.status === 0;
}

function checkoutProductBranch(productRepo, branchName, dryRun) {
  if (dryRun) {
    console.log(`[dry-run] Switch product repo to branch ${branchName}`);
    return;
  }

  if (branchExists(productRepo, branchName)) {
    runGit(productRepo, ["switch", branchName]);
  } else {
    runGit(productRepo, ["switch", "-c", branchName]);
  }
}

function prepareProductBranch(productRepo, options) {
  ensureProductWorktreeClean(productRepo, options.dryRun);
  checkoutProductBranch(productRepo, options.branch, options.dryRun);
}

async function copyPoFile(source, destination, dryRun) {
  await assertDirectory(
    path.dirname(destination),
    "Destination catalog directory",
  );

  if (dryRun) {
    console.log(`[dry-run] Copy ${source} -> ${destination}`);
    return;
  }

  await cp(source, destination, {
    filter: (sourcePath) => path.basename(sourcePath) !== ".DS_Store",
  });
}

async function assertPoFile(file, label) {
  try {
    const fileStat = await stat(file);
    if (!fileStat.isFile()) {
      throw new Error(`${label} is not a file: ${file}`);
    }
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(`${label} does not exist: ${file}`);
    }

    throw error;
  }
}

async function syncCatalogs({ dryRun, productRepo }) {
  const i18nRoot = path.join(productRepo, PRODUCT_I18N_DIR);
  const sourceRoot = path.join(i18nRoot, "_source");

  for (const project of projects) {
    const sourceCatalog = path.join(repoRoot, project.sourceCatalog);
    const sourcePo = path.join(sourceCatalog, "en/messages.po");
    const sourceDestination = path.join(sourceRoot, project.sourceFile);

    await assertDirectory(sourceCatalog, `${project.name} source locales`);
    await assertPoFile(sourcePo, `${project.name} source PO`);
    await copyPoFile(sourcePo, sourceDestination, dryRun);

    for (const locale of LOCALES) {
      const localePo = path.join(sourceCatalog, locale, "messages.po");
      const localeDestination = path.join(
        i18nRoot,
        project.destinationCatalog,
        locale,
        "messages.po",
      );

      await assertPoFile(localePo, `${project.name} ${locale} PO`);
      await copyPoFile(localePo, localeDestination, dryRun);
    }
  }

  if (dryRun) return;
}

function getProductI18nStatus(productRepo) {
  return runGit(productRepo, ["status", "--porcelain", PRODUCT_I18N_DIR], {
    capture: true,
  });
}

function commitProductChanges(productRepo, options) {
  const branchName = options.branch;

  if (options.dryRun) {
    console.log(`[dry-run] git add ${PRODUCT_I18N_DIR}`);
    console.log(`[dry-run] git commit -m "${options.commitMessage}"`);
    if (options.push) {
      console.log(`[dry-run] git push -u origin ${branchName}`);
    }
    if (options.pullRequest) {
      console.log(
        `[dry-run] gh pr create --repo ${options.repo} --base ${options.base} --head ${branchName} --title "${options.title}"`,
      );
    }
    return branchName;
  }

  const status = getProductI18nStatus(productRepo);

  if (!status) {
    console.log("No product docs/i18n changes to commit.");
  } else {
    runGit(productRepo, ["add", PRODUCT_I18N_DIR]);
    runGit(productRepo, ["commit", "-m", options.commitMessage]);
  }

  if (options.push) {
    runGit(productRepo, ["push", "-u", "origin", branchName]);
  }

  if (options.pullRequest) {
    const prArgs = [
      "pr",
      "create",
      "--repo",
      options.repo,
      "--base",
      options.base,
      "--head",
      branchName,
      "--title",
      options.title,
      "--body",
      options.body,
    ];

    runGh(productRepo, prArgs);
  }

  return branchName;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const productRepo = path.resolve(options.productRepo);

  await assertProductRepo(productRepo);

  if (options.commit) {
    options.branch ??= getDefaultBranchName();
    prepareProductBranch(productRepo, options);
  }

  if (!options.skipExtract) {
    await extractCatalogs();
  }

  await syncCatalogs({
    dryRun: options.dryRun,
    productRepo,
  });

  if (options.commit) {
    commitProductChanges(productRepo, options);
  }

  console.log(
    options.dryRun
      ? "Dry run complete."
      : `Synced i18n catalogs to ${path.join(productRepo, PRODUCT_I18N_DIR)}.`,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
