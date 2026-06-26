import {
  describe,
  expect,
  it,
} from "@jest/globals";
import { readFileSync } from "fs";
import { resolve } from "path";
import { parseSkillMarkdown } from "./parse-skill-md";

describe("parseSkillMarkdown", () => {
    it("extracts readableName and description from SKILL.md content", () => {
        const skill = readFileSync(resolve("server/fixtures/example-skill.md"), "utf-8");
        const result = parseSkillMarkdown(skill);
        expect(result.readableName).toBe("Testing Skill");
        expect(result.description).toBe("<p>This skill helps you perform tests on the parseSkillMarkdown function.</p>");
    });
});