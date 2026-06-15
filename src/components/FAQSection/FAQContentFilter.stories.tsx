import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { userEvent, within, expect } from "storybook/test";
import { useRef, useState } from "react";
import FAQContentFilter from "./FAQContentFilter";
import FAQPageContext from "./FAQPageContext";

const FAQContentFilterMock: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <FAQPageContext.Provider
      value={{
        registerSection: () => {},
        searchQuery,
        setSearchQuery,
        matchCount,
        setMatchCount,
        searchInputRef,
      }}
    >
      <input
        ref={searchInputRef}
        type="search"
        aria-label="Search FAQs"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <div aria-label="Match count">{matchCount}</div>
      <FAQContentFilter>
        {/* FAQ Section 1 */}
        <div>
          <h2 data-testid="zero-trust-access">Zero Trust Access</h2>
          {/* Q&A group without sub-groups */}
          <h3 data-testid="which-users-do-login-rules-apply-to">
            Which users do Login Rules apply to?
          </h3>
          <p>
            Login Rules apply to all users logging in via OIDC, SAML, or GitHub.
            They do not apply to local Teleport users.
          </p>

          {/* Q&A group with sub-groups (h3 with h4s) */}
          <h3 data-testid="when-are-login-rules-evaluated">
            When are Login Rules evaluated?
          </h3>
          <p>Login Rules are evaluated once during each user login.</p>
          <h4 data-testid="can-i-define-custom-helper-functions-for-the-predicate-language">
            Can I define custom helper functions for the predicate language?
          </h4>
          <p>
            Please talk to support or submit a GitHub issue and we will consider
            adding helpers which are generally useful.
          </p>
          <h4 data-testid="can-i-have-multiple-login-rules-in-a-single-cluster">
            Can I have multiple Login Rules in a single cluster?
          </h4>
          <p>
            Yes. All Login Rules installed in the cluster will first be sorted
            by priority and then evaluated in order.
          </p>
        </div>

        {/* FAQ Section 2 */}
        <div>
          <h2 data-testid="machine-id">Machine ID</h2>
          <h3 data-testid="can-mwi-be-used-with-trusted-clusters">
            Can MWI be used with Trusted Clusters?
          </h3>
          <p>You can use MWI for SSH access in trusted leaf clusters.</p>
        </div>
      </FAQContentFilter>
    </FAQPageContext.Provider>
  );
};

const meta: Meta<typeof FAQContentFilter> = {
  title: "components/FAQContentFilter",
  component: FAQContentFilter,
};

export default meta;
type Story = StoryObj<typeof FAQContentFilter>;

export const Default: Story = {
  render: () => <FAQContentFilterMock />,
};

// This test covers the case where a query matches a single Q&A group without sub-groups.
// The non-matching groups are hidden along with the FAQ section that doesn't have any matches.
export const FiltersToMatchingQAGroup: Story = {
  render: () => <FAQContentFilterMock />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step(
      "The typed query matches a single Q&A group without sub-groups",
      async () => {
        await userEvent.type(canvas.getByLabelText("Search FAQs"), "leaf");

        // The group that matches stays visible.
        expect(
          canvas.getByTestId("can-mwi-be-used-with-trusted-clusters"),
        ).toBeVisible();

        // The groups that do not match are hidden.
        expect(
          canvas.getByTestId("which-users-do-login-rules-apply-to"),
        ).not.toBeVisible();
        expect(
          canvas.getByTestId(
            "can-i-define-custom-helper-functions-for-the-predicate-language",
          ),
        ).not.toBeVisible();
        expect(
          canvas.getByTestId(
            "can-i-have-multiple-login-rules-in-a-single-cluster",
          ),
        ).not.toBeVisible();

        // Only the matching FAQ section is shown.
        expect(canvas.getByTestId("zero-trust-access")).not.toBeVisible();
        expect(canvas.getByTestId("machine-id")).toBeVisible();
      },
    );

    await step("Match count equals 1", async () => {
      expect(canvas.getByLabelText("Match count")).toHaveTextContent("1");
    });

    await step("The matching text is highlighted", async () => {
      const marks = canvasElement.querySelectorAll("mark[data-faq-highlight]");
      expect(marks).toHaveLength(1);
      expect(marks[0]).toHaveTextContent("leaf");
    });
  },
};

// In a Q&A group with sub-groups, each h4 sub-group is filtered independently
// and the h3 heading/intro is shown because at least one sub-group has a match.
export const FiltersSubQAGroups: Story = {
  render: () => <FAQContentFilterMock />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Query a h4 sub-group of a Q&A group", async () => {
      await userEvent.type(canvas.getByLabelText("Search FAQs"), "priority");

      // The h3 heading of the Q&A group along with its intro are shown because
      // an inner h4 sub-group matched.
      expect(
        canvas.getByTestId("when-are-login-rules-evaluated"),
      ).toBeVisible();

      // Only the matching h4 sub-group is visible.
      expect(
        canvas.getByTestId(
          "can-i-have-multiple-login-rules-in-a-single-cluster",
        ),
      ).toBeVisible();
      // The non-matching h4 sub-group is hidden.
      expect(
        canvas.getByTestId(
          "can-i-define-custom-helper-functions-for-the-predicate-language",
        ),
      ).not.toBeVisible();

      // The unrelated h3 group in the same FAQ section is hidden.
      expect(
        canvas.getByTestId("which-users-do-login-rules-apply-to"),
      ).not.toBeVisible();
    });

    await step("Match count equals 1", async () => {
      expect(canvas.getByLabelText("Match count")).toHaveTextContent("1");
    });
  },
};

// Clearing the query restores all content and removes highlights.
// The content is restored to the unfiltered state when the query is cleared
// and the highlights are removed and the match count is reset to 0.
export const ClearResetsContentState: Story = {
  render: () => <FAQContentFilterMock />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Search FAQs");

    await step("Query a term that filters content", async () => {
      await userEvent.type(input, "SAML");
      expect(canvas.getByTestId("machine-id")).not.toBeVisible();
      expect(
        canvasElement.querySelectorAll("mark[data-faq-highlight]"),
      ).toHaveLength(1);
    });

    await step("Clear the query", async () => {
      await userEvent.clear(input);

      // Everything should be visible again.
      expect(
        canvas.getByTestId("which-users-do-login-rules-apply-to"),
      ).toBeVisible();
      expect(
        canvas.getByTestId("when-are-login-rules-evaluated"),
      ).toBeVisible();
      expect(
        canvas.getByTestId(
          "can-i-have-multiple-login-rules-in-a-single-cluster",
        ),
      ).toBeVisible();
      expect(canvas.getByTestId("machine-id")).toBeVisible();

      // The highlights are removed and the match count is reset to 0.
      expect(
        canvasElement.querySelectorAll("mark[data-faq-highlight]"),
      ).toHaveLength(0);
      expect(canvas.getByLabelText("Match count")).toHaveTextContent("0");
    });
  },
};

// A query that appears in multiple groups counts every occurrence and
// does not hide any of the matching groups.
export const CountsMatchesAcrossGroups: Story = {
  render: () => <FAQContentFilterMock />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Type a query present in two sections", async () => {
      await userEvent.type(canvas.getByLabelText("Search FAQs"), "login");

      // Both Q&A groups that include matches for the query remain visible.
      expect(
        canvas.getByTestId("which-users-do-login-rules-apply-to"),
      ).toBeVisible();
      expect(
        canvas.getByTestId("when-are-login-rules-evaluated"),
      ).toBeVisible();
      expect(
        canvas.getByTestId(
          "can-i-have-multiple-login-rules-in-a-single-cluster",
        ),
      ).toBeVisible();
      expect(canvas.getByTestId("machine-id")).not.toBeVisible();
      expect(canvas.getByTestId("zero-trust-access")).toBeVisible();
    });

    await step("Reports the match count", async () => {
      expect(canvas.getByLabelText("Match count")).toHaveTextContent("7");
    });
  },
};

export const NoMatches: Story = {
  render: () => <FAQContentFilterMock />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Type a query that has no matches", async () => {
      await userEvent.type(canvas.getByLabelText("Search FAQs"), "nonexistent");

      // All content is hidden when there are no matches.
      expect(
        canvas.getByTestId("which-users-do-login-rules-apply-to"),
      ).not.toBeVisible();
      expect(
        canvas.getByTestId("when-are-login-rules-evaluated"),
      ).not.toBeVisible();
      expect(
        canvas.getByTestId(
          "can-i-have-multiple-login-rules-in-a-single-cluster",
        ),
      ).not.toBeVisible();
      expect(canvas.getByTestId("machine-id")).not.toBeVisible();
      expect(canvas.getByTestId("zero-trust-access")).not.toBeVisible();
    });

    await step("Match count is 0", async () => {
      expect(canvas.getByLabelText("Match count")).toHaveTextContent("0");
    });
  },
};
