/**
 * Single source of truth mapping each integration name to its logo so a docs
 * page can render the full integrations grid with one import:
 *
 *   import { integrationIcons } from "@site/src/components/Icon/integrationIcons";
 *
 * Entries marked with a TODO below use a generic category icon or
 * placeholder because no official logo asset has been sourced yet.
 */

import awsSvg from "./svg/aws.svg";
import awsidentitySvg from "./svg/awsIdentity.svg";
import activeDirectorySvg from "./svg/active-directory.svg";
import windowsSvg from "./svg/windows.svg";
import googlecloudSvg from "./svg/googleCloud.svg";
import amazonDocumentDbSvg from "./svg/amazon-document-db.svg";
import amazonDynamoDbSvg from "./svg/amazon-dynamo-db.svg";
import awsEc2Svg from "./svg/aws-ec2.svg";
import awsEcsSvg from "./svg/aws-ecs.svg";
import amazonElasticacheSvg from "./svg/amazon-elastiCache.svg";
import amazonKeyspacesSvg from "./svg/amazon-keyspaces.svg";
import amazonMemoryDbSvg from "./svg/amazon-memory-db.svg";
import amazonOpensearchSvg from "./svg/amazon-openSearch.svg";
import amazonRdsSvg from "./svg/amazon-rds.svg";
import amazonRedshiftSvg from "./svg/amazon-redshift.svg";
import ansibleSvg from "./svg/ansible.svg";
import argoSvg from "./svg/argo.svg";
import linuxSvg from "./svg/linux.svg";
import azureSvg from "./svg/azure.svg";
import azureRedisSvg from "./svg/azure-redis.svg";
import azurePostgresqlServerSvg from "./svg/azure-postgresql-server.svg";
import azureDevopsSvg from "./svg/azure-devops.svg";
import azureSqlServerSvg from "./svg/azure-sql-server.svg";
import bitbucketSvg from "./svg/bitbucket.svg";
import cassandraSvg from "./svg/cassandra.svg";
import circleciSvg from "./svg/circleci.svg";
import clickhouseSvg from "./svg/clickhouse.svg";
import cockroachDbSvg from "./svg/cockroach-db.svg";
import dbeaverSvg from "./svg/dbeaver.svg";
import datadogSvg from "./svg/datadog.svg";
import digitaloceanSvg from "./svg/digitalocean.svg";
import discordSvg from "./svg/discord.svg";
import elasticStackSvg from "./svg/elastic-stack.svg";
import elasticsearchSvg from "./svg/elasticsearch.svg";
import fluentdSvg from "./svg/fluentd.svg";
import githubSvg from "./svg/github.svg";
import githubactionsSvg from "./svg/githubActions.svg";
import gitlabSvg from "./svg/gitlab.svg";
import googleCloudSvg from "./svg/google-cloud.svg";
import kubernetesSvg from "./svg/kubernetes.svg";
import gSuiteSvg from "./svg/g-suite.svg";
import grafanaSvg from "./svg/grafana.svg";
import hashicorpVaultSvg from "./svg/hashicorp-vault.svg";
import ibmSvg from "./svg/ibm.svg";
import jamfProSvg from "./teleport-svg/jamf-pro.svg";
import jenkinsSvg from "./svg/jenkins.svg";
import jetbrainsSvg from "./svg/jetbrains.svg";
import jiraSvg from "./svg/jira.svg";
import keycloakSvg from "./svg/keycloak.svg";
import mailgunSvg from "./svg/mailgun.svg";
import mariaDbSvg from "./svg/maria-db.svg";
import mattermostSvg from "./svg/mattermost.svg";
import msEntraIdSvg from "./svg/ms-entra-id.svg";
import databaseSvg from "./svg/database.svg";
import msteamsSvg from "./svg/msteams.svg";
import mongodbSvg from "./svg/mongodb.svg";
import mysqlSvg from "./svg/mysql.svg";
import notionSvg from "./svg/notion.svg";
import oktaSvg from "./svg/okta.svg";
import oneLoginSvg from "./svg/one-login.svg";
import integrationsSvg from "./svg/integrations.svg";
import cliSvg from "./teleport-svg/cli.svg";
import opsgenieSvg from "./svg/opsgenie.svg";
import oracleSvg from "./svg/oracle.svg";
import pagerdutySvg from "./svg/pagerduty.svg";
import pantherSvg from "./svg/panther.svg";
import pingfederateSvg from "./svg/pingfederate.svg";
import postgresqlSvg from "./svg/postgresql.svg";
import puttyWinscpSvg from "./svg/putty-winscp.svg";
import redisSvg from "./svg/redis.svg";
import sailpointSvg from "./svg/sailpoint.svg";
import slackSvg from "./teleport-svg/slack.svg";
import snowflakeSvg from "./teleport-svg/snowflake.svg";
import spaceliftSvg from "./svg/spacelift.svg";
import splunkSvg from "./svg/splunk.svg";
import terraformSvg from "./svg/terraform.svg";
import vscodeSvg from "./svg/vscode.svg";
import vitessSvg from "./svg/vitess.svg";
import yubicoSvg from "./svg/yubico.svg";

export const integrationIcons: Record<string, string> = {
  "AWS": awsSvg,
  "AWS (IAM Roles Anywhere)": awsidentitySvg,
  "AWS CloudHSM": awsSvg,
  "AWS IAM Identity Center": awsidentitySvg,
  "AWS IAM Roles Anywhere": awsidentitySvg,
  "AWS KMS": awsSvg,
  "Active Directory": activeDirectorySvg,
  "Active Directory Federation Services (ADFS)": windowsSvg,
  "AlloyDB": googlecloudSvg,
  "Amazon Athena": awsSvg,
  "Amazon Bedrock AgentCore Gateway": awsSvg,
  "Amazon DocumentDB": amazonDocumentDbSvg,
  "Amazon DynamoDB": amazonDynamoDbSvg,
  "Amazon EC2": awsEc2Svg,
  // TODO: no official logo sourced yet - replace with a real asset
  "Amazon EKS": awsSvg,
  "Amazon ElastiCache": amazonElasticacheSvg,
  "Amazon Keyspaces (Apache Cassandra)": amazonKeyspacesSvg,
  "Amazon MemoryDB": amazonMemoryDbSvg,
  "Amazon OpenSearch": amazonOpensearchSvg,
  "Amazon RDS": amazonRdsSvg,
  "Amazon RDS (Aurora PostgreSQL)": amazonRdsSvg,
  "Amazon RDS (Oracle)": amazonRdsSvg,
  "Amazon RDS (SQL Server)": amazonRdsSvg,
  "Amazon RDS Proxy": amazonRdsSvg,
  "Amazon Redshift": amazonRedshiftSvg,
  "Ansible": ansibleSvg,
  "Ansible AWX": ansibleSvg,
  "Argo CD": argoSvg,
  "Auditd (Linux Audit System)": linuxSvg,
  "Azure": azureSvg,
  "Azure Cache for Redis": azureRedisSvg,
  "Azure Data Studio": azureSvg,
  "Azure Database for PostgreSQL/MySQL": azurePostgresqlServerSvg,
  "Azure DevOps": azureDevopsSvg,
  "Azure Kubernetes Service (AKS)": azureSvg,
  "Azure SQL Server": azureSqlServerSvg,
  "Bitbucket Pipelines": bitbucketSvg,
  "Cassandra / ScyllaDB": cassandraSvg,
  "CircleCI": circleciSvg,
  "ClickHouse": clickhouseSvg,
  "CockroachDB": cockroachDbSvg,
  "DBeaver": dbeaverSvg,
  "Datadog": datadogSvg,
  "DigitalOcean": digitaloceanSvg,
  "Discord": discordSvg,
  "Elastic Stack": elasticStackSvg,
  "Elasticsearch": elasticsearchSvg,
  "Fluentd": fluentdSvg,
  "GitHub": githubSvg,
  "GitHub Actions": githubactionsSvg,
  "GitLab": gitlabSvg,
  "GitLab CI": gitlabSvg,
  "Google Cloud": googlecloudSvg,
  "Google Cloud KMS": googlecloudSvg,
  "Google Cloud SQL": googleCloudSvg,
  "Google Cloud Spanner": googleCloudSvg,
  "Google Kubernetes Engine (GKE)": kubernetesSvg,
  "Google Workspace": gSuiteSvg,
  "Grafana": grafanaSvg,
  "HashiCorp Vault": hashicorpVaultSvg,
  "IBM Cloud": ibmSvg,
  "Jamf Pro": jamfProSvg,
  "Jenkins": jenkinsSvg,
  "JetBrains IDEs": jetbrainsSvg,
  "Jira": jiraSvg,
  "Keycloak": keycloakSvg,
  "Mailgun": mailgunSvg,
  "MariaDB": mariaDbSvg,
  "Mattermost": mattermostSvg,
  "Microsoft Entra ID": msEntraIdSvg,
  "Microsoft Intune": windowsSvg,
  "Microsoft SQL Server": databaseSvg,
  "Microsoft Teams": msteamsSvg,
  "MongoDB": mongodbSvg,
  "MongoDB Atlas": mongodbSvg,
  "MongoDB Compass": mongodbSvg,
  "MySQL": mysqlSvg,
  "MySQL / MariaDB": mysqlSvg,
  "MySQL Workbench": mysqlSvg,
  "NoSQL Workbench": awsSvg,
  "Notion": notionSvg,
  "Okta": oktaSvg,
  "OneLogin": oneLoginSvg,
  // TODO: no official logo sourced yet - replace with a real asset
  "OpenClaw": integrationsSvg,
  "OpenSSH": cliSvg,
  // TODO: no official logo sourced yet - replace with a real asset
  "OpenText NetIQ": integrationsSvg,
  "Opsgenie": opsgenieSvg,
  "Oracle Cloud": oracleSvg,
  "Oracle Database": oracleSvg,
  "Oracle Exadata": oracleSvg,
  "PagerDuty": pagerdutySvg,
  "Panther": pantherSvg,
  "PingFederate": pingfederateSvg,
  "PostgreSQL": postgresqlSvg,
  "PuTTY": puttyWinscpSvg,
  "Redis": redisSvg,
  "SailPoint": sailpointSvg,
  // TODO: no official logo sourced yet - replace with a real asset
  "ServiceNow": integrationsSvg,
  "Slack": slackSvg,
  "Snowflake": snowflakeSvg,
  "Spacelift": spaceliftSvg,
  "Splunk": splunkSvg,
  "Terraform": terraformSvg,
  "Terraform Cloud / HCP Terraform": terraformSvg,
  "Visual Studio Code": vscodeSvg,
  "Vitess": vitessSvg,
  "WinSCP": puttyWinscpSvg,
  "YubiHSM2": yubicoSvg,
  "YubiKey": yubicoSvg,
  // TODO: no official logo sourced yet - replace with a real asset
  "env0": integrationsSvg,
  "pgAdmin": postgresqlSvg,
};
