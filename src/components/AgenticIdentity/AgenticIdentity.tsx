import cn from "clsx";
import styles from "./AgenticIdentity.module.css";
import Icon, { IconName } from "../Icon";
import Button from "../Button";

type AgenticIdentityFrameworkProps = {
  name: string;
  activeCategoryId: string;
  href: string;
};

type Category = {
  id: string;
  name: string;
};

type Pillar = {
  name: string;
  description: string;
  icon: IconName;
  items: Category[];
};

const AgenticIdentityFramework: React.FC<AgenticIdentityFrameworkProps> = ({
  name,
  activeCategoryId,
  href,
}) => {
  const pillars: Pillar[] = [
    {
      name: "Identity",
      description:
        "Issue cryptographic identities to agents without shared secrets or bootstrapping tokens",
      icon: "certificate",
      items: [
        {
          id: "digital-twins",
          name: "Digital Twins",
        },
        {
          id: "identity-for-long-running-agents",
          name: "Identity for long-running agents",
        },
        {
          id: "identity-for-llm-apps",
          name: "Identity for LLM Apps",
        },
      ],
    },
    {
      name: "Access",
      description:
        "Control and audit what agents can access via MCP proxy, catalog, and LLM rate limits",
      icon: "keyholePurple",
      items: [
        { id: "mcp-access", name: "MCP Access" },
        { id: "mcp-catalog", name: "MCP Catalog" },
        { id: "llm-access", name: "LLM Access" },
      ],
    },
    {
      name: "Security",
      description:
        "Discover unmanaged agents, detect policy violations, and maintain full audit trails",
      icon: "shieldCheck2",
      items: [
        { id: "visibility-discovery", name: "Visibility & Discovery" },
        { id: "audit-security", name: "Audit & Security" },
      ],
    },
    {
      name: "Scheduling & Orchestration",
      description:
        "Run agents reliably on Kubernetes and Temporal with retries, data sharing, and debugging",
      icon: "calendarCheck",
      items: [
        { id: "data-sharing", name: "Data Sharing" },
        { id: "workflows", name: "Workflows" },
        { id: "developer-experience", name: "Developer Experience" },
      ],
    },
  ];
  return (
    <div className={styles.agenticIdentityFramework}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Understand the complete framework</h2>
          <p className={styles.description}>
            {name} is part of one of the four pillars. Explore what comes next.
          </p>
        </div>
        <Button as="link" href={href} className={styles.link}>
          Explore full framework →
        </Button>
      </div>
      <div className={styles.pillars}>
        {pillars.map((pillar) => (
          <div key={pillar.name} className={styles.pillar}>
            <div className={styles.pillarHeader}>
              <Icon name={pillar.icon} size="md" />
              <div>
                <h3 className={styles.pillarTitle}>{pillar.name}</h3>
                <p className={styles.pillarDescription}>{pillar.description}</p>
              </div>
            </div>
            <div>
              <ul className={styles.pillarItems}>
                {pillar.items.map((item) => (
                  <li
                    key={item.name}
                    className={cn(styles.pillarItem, {
                      [styles.active]: item.id === activeCategoryId,
                    })}
                  >
                    {item.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgenticIdentityFramework;
