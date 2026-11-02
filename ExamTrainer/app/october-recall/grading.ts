import { normalized } from '../grading';

export function canonical(value: string) {
  const tokens = JSON.parse(normalized(value)) as string[];
  return JSON.stringify(tokens.map(token => /^'[^'\\]*'$/.test(token) ? JSON.stringify(token.slice(1, -1)) : token)
    .filter((token, index) => token !== ',' || (index < tokens.length - 1 && ![')', ']', '}'].includes(tokens[index + 1]))));
}

export function matches(value: string, answers: string[]) {
  return value.trim().length > 0 && answers.some(answer => canonical(value) === canonical(answer));
}
