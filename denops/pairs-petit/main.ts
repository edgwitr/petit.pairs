import type { Entrypoint } from "jsr:@denops/std@^7.3.2";
import * as mapping from "jsr:@denops/std@^7.3.2/mapping";
import * as fn from "jsr:@denops/std@^7.3.2/function";

const delimiter_pairs = {
  open: {
    "(": ")",
    "[": "]",
    "{": "}",
  },
  close: {
    ")": "(",
    "]": "[",
    "}": "{",
  },
  openclose: {
    "\"": "\"",
    "'": "'",
    "`": "`",
  },
};

export const main: Entrypoint = async (denops) => {
  const escapeStr = (str: string): string => str.replace(/(["\\])/g, '\\$1');
  for (const [type, pairs] of Object.entries(delimiter_pairs)) {
    for (const [key, value] of Object.entries(pairs)) {
      const escapedKey = escapeStr(key);
      const escapedValue = escapeStr(value);
      await mapping.map(
        denops,
        key,
        `<CMD>call denops#request("${denops.name}", '${type}', ["${escapedKey}","${escapedValue}"])<CR>`,
        { mode: ["i", "c"] },
      );
    }
  }

  const getLineAndCol = async () => {
    const mode = await fn.mode(denops) as string;
    if (mode === "i") {
      return [await fn.getline(denops, "."), await fn.col(denops, ".")];
    } else if (mode === "c") {
      return [await fn.getcmdline(denops), await fn.getcmdpos(denops)];
    }
    return ["", 0];
  };

  denops.dispatcher = {
    async open(str, correstr): Promise<void> {
      const [line, col] = await getLineAndCol() as [string, number];
      await denops.cmd(
        line[col - 1] in delimiter_pairs.close
          ? `call feedkeys("${str}", 'n')`
          : `call feedkeys("${str}${correstr}\\<Left>", 'n')`
      );
    },
    async close(str, correstr): Promise<void> {
      const [line, col] = await getLineAndCol() as [string, number];
      await denops.cmd(
        (line.slice(col - 2, col) === `${correstr}${str}`)
          ? `call feedkeys("\\<Right>", 'n')`
          : `call feedkeys("${str}", 'n')`
      );
    },
    async openclose(str, correstr): Promise<void> {
      const [line, col] = await getLineAndCol() as [string, number];
      const [str1, str2] = [escapeStr(`${str}`), escapeStr(`${correstr}`)];
      await denops.cmd(
        line[col - 2] === correstr
          ? `call feedkeys("\\<Right>", 'n')`
          : `call feedkeys("${str1}${str2}\\<Left>", 'n')`
      );
    },
  };
};
