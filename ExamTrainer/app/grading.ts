export function normalized(value: string) {
  // Ignore layout, but preserve strings, identifiers and compound operators.
  return JSON.stringify(value.match(/"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[\p{L}_][\p{L}\p{N}_]*|\d+(?:\.\d+)?|\*\*|\/\/|==|!=|<=|>=|:=|->|\+=|-=|\*=|\/=|\S/gu) ?? []);
}
