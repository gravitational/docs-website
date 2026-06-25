import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { userEvent, within, expect } from "storybook/test";
import SkillsTable from "./SkillsTable";
import { collectEvents } from "@site/src/utils/analytics";
import skills from "@site/data/skills.json";

const meta: Meta<typeof SkillsTable> = {
  title: "components/SkillsTable",
  component: SkillsTable,
};

export default meta;
type Story = StoryObj<typeof SkillsTable>;

export const InitialState: Story = {
  render: () => <SkillsTable emitEvent={collectEvents()} />,
};

export const InstallButtonOpensModal: Story = {
  render: () => <SkillsTable emitEvent={collectEvents()} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const skill = skills[0];

    await step("Click the 'Install' button for the first skill", async () => {
      const installButtons = canvas.getAllByRole("button", { name: "Install" });
      await userEvent.click(installButtons[0]);
    });

    await step("Modal shows skill name and install command", async () => {
      expect(
        canvas.getByText(`Install ${skill.readableName}`),
      ).toBeInTheDocument();
      expect(canvas.getByText(skill.installCommand)).toBeInTheDocument();
    });

    await step("The skill_install_clicked event is fired", async () => {
      expect(window.events).toHaveLength(1);
      expect(window.events[0]).toEqual({
        event: "skill_install_clicked",
        skill_name: skill.name,
      });
    });
  },
};

export const ModalClose: Story = {
  render: () => <SkillsTable emitEvent={collectEvents()} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const skill = skills[0];

    await step("Open modal for first skill", async () => {
      const installButtons = canvas.getAllByRole("button", { name: "Install" });
      await userEvent.click(installButtons[0]);
      expect(
        canvas.getByText(`Install ${skill.readableName}`),
      ).toBeInTheDocument();
    });

    await step("Close modal with X button", async () => {
      const closeButton = canvasElement.querySelector(
        '[class*="closeButton"]',
      ) as HTMLElement;
      await userEvent.click(closeButton);
      expect(
        canvas.queryByText(`Install ${skill.readableName}`),
      ).not.toBeInTheDocument();
    });
  },
};

export const ViewRawSkillClick: Story = {
  render: () => <SkillsTable emitEvent={collectEvents()} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const skill = skills[0];

    await step("Click the 'View Raw Skill' link for first skill", async () => {
      const links = canvas.getAllByRole("link", { name: /view raw skill/i });
      await userEvent.click(links[0]);
    });

    await step("The view_raw_skill_clicked event is fired", async () => {
      expect(window.events).toHaveLength(1);
      expect(window.events[0]).toEqual({
        event: "view_raw_skill_clicked",
        skill_name: skill.name,
      });
    });
  },
};
