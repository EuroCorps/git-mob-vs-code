const vscode = require("vscode");
const { mob, config } = require("./commands");
const { TreeNode } = require("./tree-node");

let author = null;
let allAuthors = null;
let setMob = null;

class MobAuthors {
  get author() {
    if (author === null) {
      const name = config.get("user.name");
      const email = config.get("user.email");

      author = new Author("Author: " + name, email);
    }
    return author;
  }

  get listCurrent() {
    if (setMob !== null) {
      const tempMob = setMob;
      setMob = null;
      return tempMob;
    }

    const currentMob = mob.current();

    return this.listAll.reduce((acc, author) => {
      if (currentMob.includes(author.email)) {
        author.selected = true;
        return [...acc, author];
      }

      return acc;
    }, []);
  }

  setCurrent(author, selected) {
    const commandKeys = [];

    this.listAll.forEach(coAuthor => {
      if (author && author.email == coAuthor.email)
        coAuthor.selected = selected;
      if (coAuthor.selected) commandKeys.push(coAuthor.commandKey);
    });

    if (commandKeys.length > 0) {
      const currentMob = mob.setCurrent(commandKeys);
      setMob = this.listAll.filter(author => currentMob.includes(author.email));
    } else {
      mob.solo();
      setMob = [];
    }
  }

  get listAll() {
    if (allAuthors === null) {
      const other = mob
        .listAll()
        .split("\n")
        .map(author => createAuthor(author));
      allAuthors = this.removeAuthor(other);
    }
    return allAuthors;
  }

  get lastCoAuthor() {
    return this.listAll[this.listAll.length - 1];
  }

  removeAuthor(authorList) {
    return authorList.filter(author => author.email !== this.author.email);
  }
}

exports.MobAuthors = MobAuthors;

class Author extends TreeNode {
  constructor(name, email) {
    super(name);
    this.email = email;
  }

  getTreeItem() {
    return {
      label: this.key,
      tooltip: `Email: ${this.email}`,
      contextValue: ""
    };
  }
}

class CoAuthor extends Author {
  constructor(name, email, selected = false, commandKey = "") {
    super(name, email);
    this.selected = selected;
    this.commandKey = commandKey;
  }

  getTreeItem() {
    return {
      label: this.key,
      tooltip: `Email: ${this.email}`,
      contextValue: this.selected ? "remove-author" : "add-author",
      collapsibleState: vscode.TreeItemCollapsibleState.None
    };
  }
}

function createAuthor(stdoutFormat) {
  const regexList = /^([a-z]{1,3})\s(.+)\s([a-zA-Z0-9_\-\.]+@[a-zA-Z0-9_\-\.]+\.[a-zA-Z]{2,5})/;
  let list = stdoutFormat.match(regexList);
  const [, commandKey, name, email] = list;
  return new CoAuthor(name, email, false, commandKey);
}
