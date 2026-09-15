export function normalized(value: string) {
  // Ignore layout, but preserve strings, identifiers and compound operators.
  return JSON.stringify((value.match(/"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\\\r?\n|[\p{L}_][\p{L}\p{N}_]*|\d+(?:\.\d+)?|\*\*|\/\/|==|!=|<=|>=|:=|->|\+=|-=|\*=|\/=|\S/gu) ?? []).filter(token => !/^\\\r?\n$/.test(token)));
}
