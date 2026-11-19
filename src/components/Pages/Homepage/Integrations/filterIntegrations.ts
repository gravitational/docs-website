// Helpers for the search and category filtering

export const ALL_FILTER_ID = "all";

export interface IntegrationFilter {
  // Label shown in the category dropdown and as the group heading
  name: string;
  // Matched against the `tags` of each integration
  id: string;
}

export interface FilterableIntegration {
  title: string;
  description?: string;
  tags?: string[];
}

export interface IntegrationGroup<T extends FilterableIntegration> {
  id: string;
  name: string;
  integrations: T[];
}

// Case-insensitive substring match against the title and description.
export const matchesQuery = (
  integration: FilterableIntegration,
  query: string,
): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [integration.title, integration.description].some((text) =>
    text?.toLowerCase().includes(q),
  );
};

export const searchIntegrations = <T extends FilterableIntegration>(
  integrations: T[],
  query: string,
): T[] =>
  integrations.filter((integration) => matchesQuery(integration, query));

export const groupIntegrations = <T extends FilterableIntegration>(
  integrations: T[],
  filters: IntegrationFilter[],
  selectedFilterId: string = ALL_FILTER_ID,
): IntegrationGroup<T>[] =>
  filters
    .filter(
      (filter) =>
        selectedFilterId === ALL_FILTER_ID || filter.id === selectedFilterId,
    )
    .map((filter) => ({
      id: filter.id,
      name: filter.name,
      integrations: integrations.filter((integration) =>
        integration.tags?.includes(filter.id),
      ),
    }))
    .filter((group) => group.integrations.length > 0);
