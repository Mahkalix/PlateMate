import { Fragment } from "react";

export function WordBanner({
  words,
  teal = false,
}: {
  words: string[];
  teal?: boolean;
}) {
  return (
    <div
      className={teal ? "pm-ticker pm-ticker--teal" : "pm-ticker"}
      aria-hidden="true"
    >
      {words.map((word, index) => (
        <Fragment key={word}>
          {index > 0 && <span> — </span>}
          {word}
        </Fragment>
      ))}
    </div>
  );
}
