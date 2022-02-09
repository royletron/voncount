import { Flags, Command } from "@oclif/core";
import minimatch from "minimatch";
import fs, { statSync } from "fs";
import { join, sep, isAbsolute } from "path";
import { Table } from "console-table-printer";

async function walk(
  dir: string,
  includes: string[],
  excludes: string[],
  rootDir?: string
): Promise<string[]> {
  const entries: string[] = [];
  if (!rootDir) {
    rootDir = dir;
  }
  for await (const d of await fs.promises.opendir(dir)) {
    const entry = join(dir, d.name);
    const exclude = excludes.find((glob) =>
      minimatch(entry.replace(`${rootDir}/`, ""), glob)
    );
    if (exclude !== undefined) continue;
    if (d.isDirectory()) {
      const subdir = await walk(entry, includes, excludes, rootDir);
      entries.push(...subdir);
    } else if (d.isFile()) {
      const include = includes.find((glob) =>
        minimatch(entry.replace(`${rootDir}/`, ""), glob)
      );
      if (include !== undefined) {
        entries.push(entry.replace(`${rootDir}/`, ""));
      }
    }
  }
  return entries;
}

const toTree = (root: string, obj: any, groups: any) => {
  const blankObj = (name: string): Record<string, any> => ({
    name,
    lines: 0,
    blanklines: 0,
    groups: groups.reduce(
      (stats: any, group: any) => ({
        ...stats,
        [group.name]: { lines: 0, blanklines: 0 },
      }),
      {}
    ),
    children: {},
  });
  const tree = blankObj(root);
  Object.keys(obj).map((key) => {
    const refs = [tree];
    key.split(sep).forEach((part) => {
      const currentRef = refs[refs.length - 1];
      if (!currentRef.children[part]) {
        currentRef.children[part] = blankObj(part);
      }
      refs.push(currentRef.children[part]);
    });
    refs.forEach((v) => {
      v.lines += obj[key].lines;
      v.blanklines += obj[key].blanklines;
      v.groups = Object.keys(v.groups).reduce(
        (prev, group: string) => ({
          ...prev,
          [group]: {
            lines: v.groups[group].lines + obj[key].groups[group].lines,
            blanklines:
              v.groups[group].blanklines + obj[key].groups[group].blanklines,
          },
        }),
        {}
      );
    });
  });
  return tree;
};

const countLines = (string: string) =>
  string.split("\n").reduce(
    (stats, line) => ({
      lines: stats.lines + 1,
      blanklines: line !== "" ? stats.blanklines : stats.blanklines + 1,
    }),
    { lines: 0, blanklines: 0 }
  );

export class Run extends Command {
  static description = "run a count of a codebase";

  static args = [
    { name: "path", required: true, description: "location of codebase" },
  ];

  static flags = {
    config: Flags.string({ char: "c", required: false }),
  };

  async run() {
    const { args, flags } = await this.parse(Run);
    const ROOT_PATH = isAbsolute(args.path)
      ? args.path
      : join(process.cwd(), args.path);
    let config = { groups: [], include: ["*"], exclude: [] };
    try {
      const configPath = flags.config
        ? flags.config
        : join(ROOT_PATH, `count.json`);
      const configFile = await fs.promises.readFile(configPath).catch(() => {
        throw new Error("Unable to load configuration file!");
      });
      config = JSON.parse(configFile.toString());
    } catch (error) {}
    const { groups = [] } = config;
    const paths = await walk(
      ROOT_PATH,
      config.include || ["*"],
      config.exclude || []
    );
    const fileStats: Record<string, any> = {};
    await Promise.all(
      paths.map(async (path) => {
        const fileContent = (
          (await fs.promises
            .readFile(join(ROOT_PATH, path))
            .catch((error) => console.error(error))) as Buffer
        ).toString();
        fileStats[path] = {
          ...countLines(fileContent),
          groups: groups.reduce(
            (stats: any, group: any) => ({
              ...stats,
              [group.name]: { lines: 0, blanklines: 0 },
            }),
            {}
          ),
        };
        groups.forEach((group: any) => {
          let lines = fileContent.split("\n");
          let counting = false;
          let startRegex = new RegExp(`${group.between.start}`);
          let endRegex = new RegExp(`${group.between.end}`);
          lines.forEach((line, idx) => {
            if (!counting && line.match(startRegex)) {
              counting = true;
            }
            if (counting) {
              fileStats[path].groups[group.name].lines++;
              if (line === "") {
                fileStats[path].groups[group.name].blanklines++;
              }
            }
            if (counting && line.match(endRegex)) {
              counting = false;
            }
          });
        });
      })
    );
    const tree = toTree(ROOT_PATH.split("/").pop(), fileStats, groups);
    const table = new Table({
      columns: [
        { name: "path", title: "Path", alignment: "left", color: "blue" }, //with alignment and color
        { name: "lines", title: "Lines", alignment: "right" },
        ...groups.reduce(
          (curr: any, group: any) => [
            ...curr,
            {
              name: `${group.name}`,
              title: `'${group.name}'`,
            },
            {
              name: `${group.name}_perc`,
              title: `%`,
            },
          ],
          []
        ),
      ],
    });
    const parse = (obj: any, indent = 0) => {
      table.addRow({
        path: `${new Array(indent * 2).fill(" ").join("")}${obj.name}`,
        lines: obj.lines,
        ...Object.keys(obj.groups).reduce(
          (p: any, key: string) => ({
            ...p,
            [key]: obj.groups[key].lines,
            [`${key}_perc`]: (
              (obj.groups[key].lines / obj.lines) *
              100
            ).toLocaleString(undefined, { maximumFractionDigits: 2 }),
          }),
          {}
        ),
      });
      Object.keys(obj.children).forEach((key) => {
        parse(obj.children[key], indent + 1);
      });
    };
    parse(tree);
    table.printTable();
  }
}
