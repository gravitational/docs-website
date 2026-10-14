import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { expect, userEvent, within } from "storybook/test";
import { CveLookupView } from "./CveLookup";
import { scanData } from "./fixtures";

const meta: Meta<typeof CveLookupView> = {
  title: "components/CveLookup",
  component: CveLookupView,
  args: { state: { status: "loaded", data: scanData } },
};

export default meta;
type Story = StoryObj<typeof CveLookupView>;

// Types a query and submits it. Results render asynchronously, so callers
// assert with findBy* queries.
const search = async (canvasElement: HTMLElement, query: string) => {
  const canvas = within(canvasElement);
  const input = canvas.getByRole("textbox");
  await userEvent.clear(input);
  await userEvent.type(input, query);
  await userEvent.click(canvas.getByRole("button", { name: "Search" }));
  return canvas;
};

export const InitialState: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("textbox")).toHaveValue("");
    expect(
      await canvas.findByText("Scan data from 4 Mar 2099, 07:57 UTC"),
    ).toBeInTheDocument();
  },
};

export const FixedById: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await search(canvasElement, "CVE-2099-0001");
    expect(await canvas.findByText("Fixed")).toBeInTheDocument();
    expect(
      canvas.getByText("Fixed by Teleport v18.1.1, v17.1.1"),
    ).toBeInTheDocument();
    expect(canvas.getByRole("link", { name: "1111111" })).toHaveAttribute(
      "href",
      "https://github.com/gravitational/teleport/commit/1111111aaaaaaa",
    );
  },
};

export const EveryPackageReport: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await search(canvasElement, "CVE-2099-0002");
    expect(await canvas.findByText("libssl3")).toBeInTheDocument();
    expect(canvas.getByText("openssl")).toBeInTheDocument();
    expect(canvas.getAllByText("teleport-ent-distroless v18")).toHaveLength(2);
  },
};

export const AliasResolvesToEveryReport: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await search(canvasElement, "GO-2099-0005");
    expect(await canvas.findByText("Not Affected")).toBeInTheDocument();
    expect(
      canvas.getByText("GO-2099-0005 is also tracked as GHSA-bbbb-bbbb-bbbb"),
    ).toBeInTheDocument();
  },
};

export const NotInScanData: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await search(canvasElement, "CVE-2099-9999");
    expect(await canvas.findByText("Not in Scan Data")).toBeInTheDocument();
  },
};

export const TrustPortalOnly: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await search(canvasElement, "CVE-2099-0100");
    expect(await canvas.findByText("See Trust Portal")).toBeInTheDocument();
    expect(
      canvas.getByRole("link", { name: "Read the full update →" }),
    ).toHaveAttribute(
      "href",
      "https://trust.goteleport.com/updates/cve-2099-0100",
    );
  },
};

export const KeywordSearch: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await search(canvasElement, "grpc");
    expect(await canvas.findByText("2 results")).toBeInTheDocument();
  },
};

export const DeepLink: Story = {
  args: {
    state: { status: "loaded", data: scanData },
    initialQuery: "CVE-2099-0006",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(await canvas.findByText("Awaiting Release")).toBeInTheDocument();
    expect(canvas.getByRole("textbox")).toHaveValue("CVE-2099-0006");
  },
};

export const Loading: Story = {
  args: { state: { status: "loading" } },
  play: async ({ canvasElement }) => {
    const canvas = await search(canvasElement, "CVE-2099-0001");
    expect(await canvas.findByText("Loading scan data…")).toBeInTheDocument();
  },
};

export const LoadFailed: Story = {
  args: { state: { status: "failed" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(
      await canvas.findByText(/CVE data isn’t available right now/),
    ).toBeInTheDocument();
    await search(canvasElement, "CVE-2099-0001");
    expect(
      await canvas.findByText(/CVE data isn’t available right now/),
    ).toBeInTheDocument();
  },
};
