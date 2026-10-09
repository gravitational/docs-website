// Tiny logger with timestamps and levels. No dependencies.

const COLOR = {
  gray: "\x1b[90m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
  reset: "\x1b[0m",
};

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (c, s) => (useColor ? `${COLOR[c]}${s}${COLOR.reset}` : s);

// A fixed-length clock so log lines align. Uses local time.
const clock = () => {
  const d = new Date();
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(
    d.getMilliseconds(),
    3,
  )}`;
};

const tag = paint("cyan", "dev");

let verbose = false;
export const setVerbose = (v) => {
  verbose = v;
};

const line = (mark, msg) =>
  `${paint("gray", clock())} ${tag} ${mark} ${msg}`;

export const log = {
  info: (msg) => console.log(line(paint("green", "›"), msg)),
  warn: (msg) => console.log(line(paint("yellow", "!"), paint("yellow", msg))),
  error: (msg) => console.log(line(paint("red", "✗"), paint("red", msg))),
  step: (msg) => console.log(line(paint("cyan", "•"), paint("bold", msg))),
  debug: (msg) => {
    if (verbose) console.log(line(paint("gray", "·"), paint("gray", msg)));
  },
  plain: (msg) => console.log(msg),
};

export { paint };
