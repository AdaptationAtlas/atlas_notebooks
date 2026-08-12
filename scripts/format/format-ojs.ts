// @ts-nocheck
import prettier from "@observablehq/prettier";
import { parseOjsModule } from "./ojsParser.mjs";

const source = await new Response(process.stdin).text();

function parseOjs(text) {
  const comments = [];
  const tokens = [];
  const ast = parseOjsModule(text, { onComment: comments, onToken: tokens });
  return Object.assign(ast, { comments, tokens });
}

const formatted = prettier.format(source, {
  parser: parseOjs,
  printWidth: 100,
});
const output = formatted.endsWith("\n") ? formatted : `${formatted}\n`;

process.stdout.write(output);
