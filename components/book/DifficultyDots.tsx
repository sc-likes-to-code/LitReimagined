const LABELS = ["", "Easy", "Gentle", "Moderate", "Demanding", "Challenging"];

export function DifficultyDots({ value }: { value: number }) {
  return (
    <span
      className="inline-flex items-center gap-2"
      title={`Difficulty: ${LABELS[value] ?? ""}`}
    >
      <span className="flex gap-1" aria-hidden>
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={`size-1.5 rounded-full ${n <= value ? "bg-ember" : "bg-line-strong"}`}
          />
        ))}
      </span>
      <span>{LABELS[value]}</span>
    </span>
  );
}
