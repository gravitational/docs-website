import { describe, expect, it } from "@jest/globals";
import { getSidebarPath } from "./config-site";

describe("getSidebarPath", () => {
  it("returns sidebars.json when there is only one supported version", () => {
    const config = {
      versions: [
        {
          name: "17.x",
          branch: "branch/v17",
        },
      ],
    };

    expect(getSidebarPath(config)).toBe("./sidebars.json");
  });

  it("returns sidebars.json when there is only one non-deprecated version", () => {
    const config = {
      versions: [
        {
          name: "17.x",
          branch: "branch/v17",
        },
        {
          name: "16.x",
          branch: "branch/v16",
          deprecated: true,
        },
      ],
    };

    expect(getSidebarPath(config)).toBe("./sidebars.json");
  });

  it("returns versioned sidebar for latest version when there are multiple supported versions", () => {
    const config = {
      versions: [
        {
          name: "17.x",
          branch: "branch/v17",
        },
        {
          name: "18.x",
          branch: "branch/v18",
        },
      ],
    };

    expect(getSidebarPath(config)).toBe(
      "./versioned_sidebars/version-18.x-sidebars.json",
    );
  });

  it("returns versioned sidebar for the default version when specified", () => {
    const config = {
      versions: [
        {
          name: "17.x",
          branch: "branch/v17",
          isDefault: true,
        },
        {
          name: "18.x",
          branch: "branch/v18",
        },
      ],
    };

    expect(getSidebarPath(config)).toBe(
      "./versioned_sidebars/version-17.x-sidebars.json",
    );
  });

  it("returns versioned sidebar for the default version when there are deprecated versions", () => {
    const config = {
      versions: [
        {
          name: "16.x",
          branch: "branch/v16",
          deprecated: true,
        },
        {
          name: "17.x",
          branch: "branch/v17",
          isDefault: true,
        },
        {
          name: "18.x",
          branch: "branch/v18",
        },
      ],
    };

    expect(getSidebarPath(config)).toBe(
      "./versioned_sidebars/version-17.x-sidebars.json",
    );
  });

  it("returns versioned sidebar for the last supported version when no default is specified", () => {
    const config = {
      versions: [
        {
          name: "15.x",
          branch: "branch/v15",
          deprecated: true,
        },
        {
          name: "16.x",
          branch: "branch/v16",
        },
        {
          name: "17.x",
          branch: "branch/v17",
        },
      ],
    };

    expect(getSidebarPath(config)).toBe(
      "./versioned_sidebars/version-17.x-sidebars.json",
    );
  });
});
