import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { userEvent, within, expect } from "storybook/test";
import SkillsBanner from "./SkillsBanner";
import ExclusivityContext from "../ExclusivityBanner/context";
import { collectEvents } from "@site/src/utils/analytics";
import skills from "@site/data/skills.json";

const meta: Meta<typeof SkillsBanner> = {
  title: "components/SkillsBanner",
  component: SkillsBanner,
};

export default meta;
type Story = StoryObj<typeof SkillsBanner>;

const skill = skills[0];

export const NoSkills: Story = {
  render: () => (
    <ExclusivityContext.Provider value={{ skillsForPage: [] }}>
      <SkillsBanner emitEvent={collectEvents()} />
    </ExclusivityContext.Provider>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Banner is not rendered when there are no skills", async () => {
      expect(canvas.queryByText("Skill Available")).not.toBeInTheDocument();
    });
  },
};

export const WithSkill: Story = {
  render: () => (
    <ExclusivityContext.Provider value={{ skillsForPage: [skill] }}>
      <SkillsBanner emitEvent={collectEvents()} />
    </ExclusivityContext.Provider>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Banner shows skill badge and readable name", async () => {
      expect(canvas.getByText("Skill Available")).toBeInTheDocument();
      expect(canvas.getByText(skill.readableName)).toBeInTheDocument();
    });

    await step(
      "Install Skill and View Raw Skill buttons are present",
      async () => {
        expect(
          canvas.getByRole("button", { name: "Install Skill" }),
        ).toBeInTheDocument();
        expect(
          canvas.getByRole("link", { name: /view raw skill/i }),
        ).toBeInTheDocument();
      },
    );
  },
};

export const InstallButtonOpensModal: Story = {
  render: () => (
    <ExclusivityContext.Provider value={{ skillsForPage: [skill] }}>
      <SkillsBanner emitEvent={collectEvents()} />
    </ExclusivityContext.Provider>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Click Install Skill button", async () => {
      await userEvent.click(
        canvas.getByRole("button", { name: "Install Skill" }),
      );
    });

    await step("Modal shows skill name and install command", async () => {
      expect(
        canvas.getByText(`Install ${skill.readableName}`),
      ).toBeInTheDocument();
      expect(canvas.getByText(skill.installCommand)).toBeInTheDocument();
    });

    await step("The 'skill_install_clicked' event is fired", async () => {
      expect(window.events).toHaveLength(1);
      expect(window.events[0]).toEqual({
        event: "skill_install_clicked",
        skill_name: skill.name,
      });
    });
  },
};

export const ModalOpenAndClose: Story = {
  render: () => (
    <ExclusivityContext.Provider value={{ skillsForPage: [skill] }}>
      <SkillsBanner emitEvent={collectEvents()} />
    </ExclusivityContext.Provider>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Open modal", async () => {
      await userEvent.click(
        canvas.getByRole("button", { name: "Install Skill" }),
      );
      expect(
        canvas.getByText(`Install ${skill.readableName}`),
      ).toBeInTheDocument();
    });

    await step("Close modal", async () => {
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

export const ViewRawSkill: Story = {
  render: () => (
    <ExclusivityContext.Provider value={{ skillsForPage: [skill] }}>
      <SkillsBanner emitEvent={collectEvents()} />
    </ExclusivityContext.Provider>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Click the 'View Raw Skill' link", async () => {
      await userEvent.click(
        canvas.getByRole("link", { name: /view raw skill/i }),
      );
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
