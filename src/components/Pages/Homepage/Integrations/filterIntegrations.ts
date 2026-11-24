// Helpers for the search and category filtering

// Reserved filter ids
export const ALL_FILTER_ID = "__all__";
export const OTHER_FILTER_ID = "__other__";

export const OTHER_FILTER_NAME = "Other";

export interface IntegrationFilter {
  // Label shown in the category dropdown
  name: string;
  // Matched against the `tags` of each integration
  id: string;
}

export interface FilterableIntegration {
  title: string;
  description?: string;
  tags?: string[];
}

export interface IntegrationFilterWithCount extends IntegrationFilter {
  count: number;
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

// Whether the integration belongs to the given filter. The "Other" filter
// catches integrations without tags, or whose tags match none of the filters.
export const matchesFilter = (
  integration: FilterableIntegration,
  filterId: string,
  filters: IntegrationFilter[],
): boolean => {
  if (filterId === ALL_FILTER_ID) return true;
  if (filterId === OTHER_FILTER_ID)
    return !filters.some((filter) => integration.tags?.includes(filter.id));
  return !!integration.tags?.includes(filterId);
};

// Returns the integrations that belong to the selected filter and match the search query.
export const filterIntegrations = <T extends FilterableIntegration>(
  integrations: T[],
  {
    query = "",
    filterId = ALL_FILTER_ID,
    filters = [],
  }: { query?: string; filterId?: string; filters?: IntegrationFilter[] },
): T[] =>
  integrations.filter(
    (integration) =>
      matchesFilter(integration, filterId, filters) &&
      matchesQuery(integration, query),
  );

// Returns the filters to list in the dropdown, each with the number of its
// integrations that match the search query. "Other" is appended for any
// integrations that don't belong to the give nfilters. Filters without any
// integration are omitted. This doesn't depend on the query, so a selected
// filter stays listed while searching, with a count of 0.
export const countIntegrationsByFilter = (
  integrations: FilterableIntegration[],
  filters: IntegrationFilter[],
  query: string = "",
): IntegrationFilterWithCount[] => {
  if (filters.length === 0) return [];
  const matching = integrations.filter((integration) =>
    matchesQuery(integration, query),
  );
  return [...filters, { name: OTHER_FILTER_NAME, id: OTHER_FILTER_ID }]
    .filter((filter) =>
      integrations.some((integration) =>
        matchesFilter(integration, filter.id, filters),
      ),
    )
    .map((filter) => ({
      ...filter,
      count: matching.filter((integration) =>
        matchesFilter(integration, filter.id, filters),
      ).length,
    }));
};
