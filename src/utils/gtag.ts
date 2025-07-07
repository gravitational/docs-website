// collectGtagCalls returns a function with the same signature as gtag. The
// function pushes gtag calls to an array field of window so we can make test
// assertions against them. For this to work, there must be a way to pass this
// function to a component to call instead of the gtag function from gtag.js,
// such as passing it as a prop.
//
// The length of the window.gtagCalls array indicates the number of gtag calls.
// Each element contains the gtag command, e.g., "get", "event", or "set", along
// with the parameters passed to the command.
export const collectGtagCalls = () => {
  // Reset the collector so we don't include events from other stories
  window.gtagCalls = [];
  return (command: string, name: string, params: any) => {
    window.gtagCalls.push({
      command: command,
      name: name,
      params: params,
    });
  };
};

// logGtag prints the arguments and payload of a gtag call to the console. Used
// for local debugging.
export const logGtag = (command: string, name: string, params: any) => {
  const gtagCall = {
    command: command,
    name: name,
    params: params,
  };
  console.log("gtag called with: %o", gtagCall);
};

export enum copyButtonScope {
  other = 0,
  line,
  snippet,
}

interface CodeSnippetGtagEvent {
  name: "code_copy_button";
  params: CodeSnippetGtagEventParams;
}

interface CodeSnippetGtagEventParams {
  label: string;
  scope: string;
}

export const makeCodeSnippetGtagEvent = (
  scope: copyButtonScope,
  label: string,
): CodeSnippetGtagEvent => {
  return {
    name: "code_copy_button",
    params: {
      scope: scope,
      label: label,
    },
  };
};
