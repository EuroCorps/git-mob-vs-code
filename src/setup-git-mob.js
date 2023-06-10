const vscode = require("vscode");
const {
  CoAuthorProvider,
} = require("./co-author-tree-provider/co-authors-provider");
const { reloadOnSave } = require("./reload-on-save");
const { reloadCommand } = require("./commands/reload");
const { openGitCoAuthor } = require("./commands/open-git-coauthors");
const { soloCommand } = require("./commands/solo");
const {
  addCoAuthor,
  removeCoAuthor,
  addFromFavourite,
} = require("./commands/co-author-actions");
const { addRepoAuthorToCoauthors } = require("./commands/add-co-author");
const {
  searchRepositoryUsers,
} = require("./commands/search-repository-authors");
const { changePrimaryAuthor } = require("./commands/change-primary-author");
const { searchGitEmojis } = require("./commands/search-git-emojis");
const { openSettings } = require("./commands/open-settings");
const { searchGithubAuthors } = require("./commands/github-authors");
const { copyCoAuthor } = require("./commands/copy-co-author");
const {
  replaceCoAuthors,
} = require("./vscode-git-extension/format-scm-input-text");
const { soloAfterCommit } = require("./ext-config/solo-after-commit");
const { logIssue } = require("./errors/log-issue");
const {
  CountDecorationProvider,
} = require("./co-author-tree-provider/count-decorator-provider");
const { updateConfig } = require("git-mob-core");

function setupGitMob(context, gitExt) {
  bootGitMob(context, gitExt);
}

function bootGitMob(context, gitExt) {
  const coAuthorProvider = new CoAuthorProvider();
  updateConfig("processCwd", gitExt.rootPath);

  coAuthorProvider.onDidChangeTreeData(async function () {
    try {
      gitExt.updateSelectedInput(
        replaceCoAuthors(await coAuthorProvider.mobAuthors.listCurrent())
      );
    } catch (err) {
      logIssue("Failed to update input: " + err.message);
    }
  });

  const disposables = [
    openSettings(),
    reloadCommand({ coAuthorProvider }),
    addCoAuthor({ coAuthorProvider }),
    removeCoAuthor({ coAuthorProvider }),
    addFromFavourite({ coAuthorProvider }),
    addRepoAuthorToCoauthors({ coAuthorProvider }),
    searchRepositoryUsers({ coAuthorProvider }),
    openGitCoAuthor({ coAuthorProvider }),
    soloCommand(),
    searchGitEmojis(),
    changePrimaryAuthor({ coAuthorProvider }),
    searchGithubAuthors({ coAuthorProvider }),
    new CountDecorationProvider(coAuthorProvider),
    copyCoAuthor(),
  ];

  disposables.forEach((dispose) => context.subscriptions.push(dispose));

  reloadOnSave({ coAuthorProvider });
  soloAfterCommit(coAuthorProvider);

  gitExt.onDidChangeUiState(function () {
    if (gitExt.repositories.length === 1) return;
    if (this.ui.selected) {
      gitExt.selectedRepositoryPath = this.rootUri.path;
      updateConfig("processCwd", gitExt.rootPath);
      coAuthorProvider.mobAuthors.reset();
      coAuthorProvider.reloadData();
    }
  });

  const mobList = vscode.window.createTreeView("gitmob.CoAuthorsView", {
    treeDataProvider: coAuthorProvider,
    canSelectMany: true,
  });

  mobList.onDidChangeSelection(function (evt) {
    coAuthorProvider.multiSelected = evt.selection;
  });
}

exports.setupGitMob = setupGitMob;
