type ChoiceLike = {
  id: string;
  isCorrect: boolean;
};

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function orderChoices<TChoice extends ChoiceLike>(choices: TChoice[], exerciseId: string): TChoice[] {
  const ordered = [...choices].sort(
    (left, right) =>
      hashString(`${exerciseId}:${left.id}`) - hashString(`${exerciseId}:${right.id}`),
  );

  if (ordered.length > 1 && ordered[0]?.isCorrect) {
    ordered.push(ordered.shift() as TChoice);
  }

  return ordered;
}
