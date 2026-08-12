import { CellParser } from "@observablehq/parser";

const { tokTypes } = CellParser.acorn;

class ModuleParser extends CellParser {
  parseTopLevel(node) {
    node.cells = [];
    while (this.type !== tokTypes.eof) {
      const cell = this.parseCell(this.startNode());
      cell.input = this.input;
      node.cells.push(cell);
    }
    node.body = node.cells;
    this.next();
    return this.finishNode(node, "Program");
  }
}

export function parseOjsModule(source, options = {}) {
  return ModuleParser.parse(source, options);
}
