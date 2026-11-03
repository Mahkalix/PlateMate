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
      {[0, 1].map((copy) => (
        <div className="pm-ticker__group" key={copy}>
          {words.map((word) => (
            <Fragment key={word}>
              <b>{word}</b>
              <span>—</span>
            </Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}
