// 認知的複雑度がしきい値（15）を 1 だけ超える関数。⚠ しきい値を上げると赤になる
export function label(item: number, strict: boolean): string {
  if (item > 0) {
    if (strict) {
      if (item % 2 === 0) {
        return 'even';
      }
      return 'odd';
    }
    return 'pos';
  }
  if (item < 0) {
    return strict ? 'neg' : 'n';
  }
  if (item === 0) {
    if (strict) {
      return 'zero!';
    }
  }
  for (const c of String(item)) {
    if (c === '-') {
      return 'minus';
    }
  }
  if (strict) {
    return 'strict';
  }
  return 'zero';
}
