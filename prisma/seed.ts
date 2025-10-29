// prisma/seed.ts

const { PrismaClient, Difficulty } = require('@prisma/client');

const prisma = new PrismaClient();

// --- 1. CLOUD SERVICE SEEDING FUNCTION (KBS DATA) ---
async function seedCloudServices() {
  console.log('Start seeding CloudService table (KBS data)...');

  const cloudServices = [
    // --- DATABASE (NoSQL/Document) ---
    {
      id: 'mongodb-atlas-m10-ondemand', provider: 'MongoDB', category: 'DATABASE', name: 'Atlas M10 Dedicated', term: 'On-Demand', shortDescription: 'Managed NoSQL database for flexible document storage and scalable applications with shared/dedicated clusters.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 60.00, rawHourlyRate: 0.0822, rawConsumptionRate: null, upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'mongodb-atlas-m10-1yr', provider: 'MongoDB', category: 'DATABASE', name: 'Atlas M10 Dedicated', term: '1-Year Commitment', shortDescription: 'Annual commitment for Atlas clusters offering up to 30% savings on dedicated resources.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 42.00, rawHourlyRate: 0.0575, rawConsumptionRate: null, upfrontFee: 300, termInMonths: 12
    },
    {
      id: 'mongodb-atlas-m10-3yr', provider: 'MongoDB', category: 'DATABASE', name: 'Atlas M10 Dedicated', term: '3-Year Commitment', shortDescription: 'Long-term commitment for maximum discounts up to 50% on MongoDB hosting.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 30.00, rawHourlyRate: 0.0411, rawConsumptionRate: null, upfrontFee: 600, termInMonths: 36
    },
    {
      id: 'aws-dynamodb-ondemand', provider: 'AWS', category: 'DATABASE', name: 'DynamoDB On-Demand', term: 'On-Demand', shortDescription: 'NoSQL key-value store for high-performance, serverless database operations with automatic scaling.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 25.00, rawHourlyRate: null, rawConsumptionRate: '0.25/million reads; 1.25/million writes', upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'aws-dynamodb-1yr', provider: 'AWS', category: 'DATABASE', name: 'DynamoDB Reserved', term: '1-Year Reserved', shortDescription: 'Reserved capacity for DynamoDB provisioned throughput, saving up to 54%.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 11.50, rawHourlyRate: null, rawConsumptionRate: '0.115/million reads; 0.575/million writes', upfrontFee: 100, termInMonths: 12
    },
    {
      id: 'aws-dynamodb-3yr', provider: 'AWS', category: 'DATABASE', name: 'DynamoDB Reserved', term: '3-Year Reserved', shortDescription: 'Three-year reservation for up to 77% savings on consistent read/write capacity.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 5.75, rawHourlyRate: null, rawConsumptionRate: '0.0575/million reads; 0.2875/million writes', upfrontFee: 200, termInMonths: 36
    },
    {
      id: 'azure-cosmosdb-nosql-ondemand', provider: 'Azure', category: 'DATABASE', name: 'Cosmos DB NoSQL', term: 'On-Demand', shortDescription: 'Globally distributed NoSQL database with multi-model support and low-latency access.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 5.84, rawHourlyRate: 0.008, rawConsumptionRate: null, upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'azure-cosmosdb-nosql-1yr', provider: 'Azure', category: 'DATABASE', name: 'Cosmos DB NoSQL', term: '1-Year Reserved', shortDescription: 'Reserved RU/s capacity for up to 40% savings on provisioned throughput.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 3.50, rawHourlyRate: 0.0048, rawConsumptionRate: null, upfrontFee: 20, termInMonths: 12
    },
    {
      id: 'azure-cosmosdb-nosql-3yr', provider: 'Azure', category: 'DATABASE', name: 'Cosmos DB NoSQL', term: '3-Year Reserved', shortDescription: 'Long-term reservation for up to 63% discount on Cosmos DB resources.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 2.16, rawHourlyRate: 0.003, rawConsumptionRate: null, upfrontFee: 40, termInMonths: 36
    },
    {
      id: 'gcp-firestore-ondemand', provider: 'GCP', category: 'DATABASE', name: 'Firestore', term: 'On-Demand', shortDescription: 'Serverless NoSQL document database for mobile, web, and IoT apps with real-time sync.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 10.00, rawHourlyRate: null, rawConsumptionRate: '0.06/100k reads; 0.18/100k writes', upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'gcp-firestore-1yr', provider: 'GCP', category: 'DATABASE', name: 'Firestore', term: '1-Year CUD', shortDescription: 'Committed use discount of 20% for sustained Firestore operations.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 8.00, rawHourlyRate: null, rawConsumptionRate: '0.048/100k reads; 0.144/100k writes', upfrontFee: 50, termInMonths: 12
    },
    {
      id: 'gcp-firestore-3yr', provider: 'GCP', category: 'DATABASE', name: 'Firestore', term: '3-Year CUD', shortDescription: 'Three-year commitment for up to 37% savings on document reads/writes.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 6.30, rawHourlyRate: null, rawConsumptionRate: '0.0378/100k reads; 0.1134/100k writes', upfrontFee: 100, termInMonths: 36
    },
    {
      id: 'aws-keyspaces-ondemand', provider: 'AWS', category: 'DATABASE', name: 'Keyspaces On-Demand', term: 'On-Demand', shortDescription: 'Managed Cassandra-compatible database for wide-column NoSQL workloads.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 15.00, rawHourlyRate: null, rawConsumptionRate: '0.25/million reads; 1.25/million writes', upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'aws-keyspaces-1yr', provider: 'AWS', category: 'DATABASE', name: 'Keyspaces Reserved', term: '1-Year Reserved', shortDescription: 'Reserved capacity for up to 50% savings on Cassandra throughput.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 7.50, rawHourlyRate: null, rawConsumptionRate: '0.125/million reads; 0.625/million writes', upfrontFee: 50, termInMonths: 12
    },
    {
      id: 'aws-keyspaces-3yr', provider: 'AWS', category: 'DATABASE', name: 'Keyspaces Reserved', term: '3-Year Reserved', shortDescription: 'Long-term reservation for up to 70% discount on Keyspaces.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 4.50, rawHourlyRate: null, rawConsumptionRate: '0.075/million reads; 0.375/million writes', upfrontFee: 100, termInMonths: 36
    },
    {
      id: 'aws-rds-postgres-t3medium-ondemand', provider: 'AWS', category: 'DATABASE', name: 'RDS PostgreSQL db.t3.medium', term: 'On-Demand', shortDescription: 'Managed relational DB for transactional apps with automated backups.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 52.56, rawHourlyRate: 0.072, rawConsumptionRate: null, upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'aws-rds-postgres-t3medium-1yr', provider: 'AWS', category: 'DATABASE', name: 'RDS PostgreSQL db.t3.medium', term: '1-Year RI', shortDescription: 'Reserved RDS for cost savings on SQL workloads.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 34.17, rawHourlyRate: 0.0468, rawConsumptionRate: null, upfrontFee: 250, termInMonths: 12
    },
    {
      id: 'aws-rds-postgres-t3medium-3yr', provider: 'AWS', category: 'DATABASE', name: 'RDS PostgreSQL db.t3.medium', term: '3-Year RI', shortDescription: 'Long-term RDS reservation for high availability databases.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 23.55, rawHourlyRate: 0.0323, rawConsumptionRate: null, upfrontFee: 500, termInMonths: 36
    },
    {
      id: 'azure-sql-gp-vcore-ondemand', provider: 'Azure', category: 'DATABASE', name: 'SQL Database General Purpose', term: 'On-Demand', shortDescription: 'Managed SQL for scalable relational data with vCore model.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 100.00, rawHourlyRate: 0.137, rawConsumptionRate: null, upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'azure-sql-gp-vcore-1yr', provider: 'Azure', category: 'DATABASE', name: 'SQL Database General Purpose', term: '1-Year Reserved', shortDescription: 'Reserved capacity for up to 35% savings on vCores.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 65.00, rawHourlyRate: 0.089, rawConsumptionRate: null, upfrontFee: 400, termInMonths: 12
    },
    {
      id: 'azure-sql-gp-vcore-3yr', provider: 'Azure', category: 'DATABASE', name: 'SQL Database General Purpose', term: '3-Year Reserved', shortDescription: '55% discount for committed SQL databases.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 45.00, rawHourlyRate: 0.062, rawConsumptionRate: null, upfrontFee: 800, termInMonths: 36
    },
    {
      id: 'gcp-cloudsql-pg-n1std1-ondemand', provider: 'GCP', category: 'DATABASE', name: 'Cloud SQL PostgreSQL db-n1-standard-1', term: 'On-Demand', shortDescription: 'Fully managed PostgreSQL for web apps and analytics.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 60.30, rawHourlyRate: 0.0826, rawConsumptionRate: null, upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'gcp-cloudsql-pg-n1std1-1yr', provider: 'GCP', category: 'DATABASE', name: 'Cloud SQL PostgreSQL db-n1-standard-1', term: '1-Year Commitment', shortDescription: '25% off for one-year SQL commitments.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 45.23, rawHourlyRate: 0.0620, rawConsumptionRate: null, upfrontFee: 300, termInMonths: 12
    },
    {
      id: 'gcp-cloudsql-pg-n1std1-3yr', provider: 'GCP', category: 'DATABASE', name: 'Cloud SQL PostgreSQL db-n1-standard-1', term: '3-Year Commitment', shortDescription: '50% discount for long-term managed DBs.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 30.15, rawHourlyRate: 0.0413, rawConsumptionRate: null, upfrontFee: 600, termInMonths: 36
    },
    {
      id: 'azure-cosmosdb-geo-ondemand', provider: 'Azure', category: 'DATABASE', name: 'Cosmos DB Geospatial', term: 'On-Demand', shortDescription: 'NoSQL with built-in geo-indexing for global apps.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 25.00, rawHourlyRate: null, rawConsumptionRate: '0.008/RU-s', upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'aws-rds-postgis-t3micro-ondemand', provider: 'AWS', category: 'DATABASE', name: 'RDS PostGIS db.t3.micro', term: 'On-Demand', shortDescription: 'Geospatial PostgreSQL extension for location-based queries.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 12.41, rawHourlyRate: 0.017, rawConsumptionRate: null, upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'gcp-cloudsql-postgis-ondemand', provider: 'GCP', category: 'DATABASE', name: 'Cloud SQL PostGIS', term: 'On-Demand', shortDescription: 'PostgreSQL with PostGIS for spatial data management.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 30.00, rawHourlyRate: 0.041, rawConsumptionRate: null, upfrontFee: 0, termInMonths: 0
    },
    // --- MESSAGING ---
    {
      id: 'aws-msk-kafka-t3small-ondemand', provider: 'AWS', category: 'MESSAGING', name: 'MSK kafka.t3.small', term: 'On-Demand', shortDescription: 'Managed Apache Kafka service for real-time streaming data pipelines with broker instances.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 98.55, rawHourlyRate: 0.135, rawConsumptionRate: null, upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'aws-msk-kafka-t3small-1yr', provider: 'AWS', category: 'MESSAGING', name: 'MSK kafka.t3.small', term: '1-Year Reserved', shortDescription: 'Reserved broker instances for up to 40% savings on Kafka clusters.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 59.13, rawHourlyRate: 0.081, rawConsumptionRate: null, upfrontFee: 400, termInMonths: 12
    },
    {
      id: 'aws-msk-kafka-t3small-3yr', provider: 'AWS', category: 'MESSAGING', name: 'MSK kafka.t3.small', term: '3-Year Reserved', shortDescription: 'Long-term reservation for up to 60% discount on MSK throughput.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 39.42, rawHourlyRate: 0.054, rawConsumptionRate: null, upfrontFee: 800, termInMonths: 36
    },
    {
      id: 'azure-eventhubs-kafka-ondemand', provider: 'Azure', category: 'MESSAGING', name: 'Event Hubs Kafka', term: 'On-Demand', shortDescription: 'Kafka-compatible event streaming with throughput units for high-volume data ingestion.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 10.95, rawHourlyRate: null, rawConsumptionRate: '0.015/TU', upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'azure-eventhubs-kafka-1yr', provider: 'Azure', category: 'MESSAGING', name: 'Event Hubs Kafka', term: '1-Year Reserved', shortDescription: 'Reserved throughput units for up to 35% savings on event processing.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 7.12, rawHourlyRate: null, rawConsumptionRate: '0.00975/TU', upfrontFee: 50, termInMonths: 12
    },
    {
      id: 'azure-eventhubs-kafka-3yr', provider: 'Azure', category: 'MESSAGING', name: 'Event Hubs Kafka', term: '3-Year Reserved', shortDescription: 'Three-year commitment for maximum savings up to 55% on Kafka endpoints.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 4.93, rawHourlyRate: null, rawConsumptionRate: '0.00675/TU', upfrontFee: 100, termInMonths: 36
    },
    {
      id: 'gcp-managed-kafka-ondemand', provider: 'GCP', category: 'MESSAGING', name: 'Managed Service for Apache Kafka', term: 'On-Demand', shortDescription: 'Fully managed Kafka clusters on GCP for durable, scalable messaging.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 100.00, rawHourlyRate: 0.137, rawConsumptionRate: null, upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'gcp-managed-kafka-1yr', provider: 'GCP', category: 'MESSAGING', name: 'Managed Service for Apache Kafka', term: '1-Year CUD', shortDescription: 'One-year commitment discount of 28% for Kafka brokers.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 72.00, rawHourlyRate: 0.0986, rawConsumptionRate: null, upfrontFee: 300, termInMonths: 12
    },
    {
      id: 'gcp-managed-kafka-3yr', provider: 'GCP', category: 'MESSAGING', name: 'Managed Service for Apache Kafka', term: '3-Year CUD', shortDescription: 'Three-year CUD for 46% savings on managed Kafka.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 54.00, rawHourlyRate: 0.074, rawConsumptionRate: null, upfrontFee: 600, termInMonths: 36
    },
    {
      id: 'aws-sqs-standard-ondemand', provider: 'AWS', category: 'MESSAGING', name: 'SQS Standard', term: 'On-Demand', shortDescription: 'Scalable message queue for decoupled apps.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 0.40, rawHourlyRate: null, rawConsumptionRate: '0.40/million reqs', upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'azure-servicebus-standard-ondemand', provider: 'Azure', category: 'MESSAGING', name: 'Service Bus Standard', term: 'On-Demand', shortDescription: 'Reliable messaging with sessions and transactions.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 0.05, rawHourlyRate: null, rawConsumptionRate: '0.05/million ops', upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'gcp-pubsub-ondemand', provider: 'GCP', category: 'MESSAGING', name: 'Pub/Sub', term: 'On-Demand', shortDescription: 'Asynchronous messaging for real-time data streams.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 0.40, rawHourlyRate: null, rawConsumptionRate: '0.40/million msgs', upfrontFee: 0, termInMonths: 0
    },
    // --- COMPUTE (VM/Containers) ---
    {
      id: 'aws-ec2-t3-medium-ondemand', provider: 'AWS', category: 'COMPUTE', name: 'EC2 t3.medium', term: 'On-Demand', shortDescription: 'General-purpose burstable instance for web servers and dev/test environments with 2 vCPU and 4 GB memory.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 30.37, rawHourlyRate: 0.0416, rawConsumptionRate: null, upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'aws-ec2-t3-medium-1yr', provider: 'AWS', category: 'COMPUTE', name: 'EC2 t3.medium', term: '1-Year RI', shortDescription: 'Reserved general-purpose instance for predictable workloads, offering up to 40% savings over on-demand.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 19.05, rawHourlyRate: 0.0261, rawConsumptionRate: null, upfrontFee: 150, termInMonths: 12
    },
    {
      id: 'aws-ec2-t3-medium-3yr', provider: 'AWS', category: 'COMPUTE', name: 'EC2 t3.medium', term: '3-Year RI', shortDescription: 'Long-term reserved instance for stable production, with up to 60% discount and partial upfront option.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 13.14, rawHourlyRate: 0.0180, rawConsumptionRate: null, upfrontFee: 300, termInMonths: 36
    },
    {
      id: 'azure-vm-b2s-ondemand', provider: 'Azure', category: 'COMPUTE', name: 'VM B2s', term: 'On-Demand', shortDescription: 'Burstable Linux VM for light workloads like small databases or dev servers with 2 vCPU and 4 GB RAM.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 15.77, rawHourlyRate: 0.0216, rawConsumptionRate: null, upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'azure-vm-b2s-1yr', provider: 'Azure', category: 'COMPUTE', name: 'VM B2s', term: '1-Year Reserved', shortDescription: 'Reserved VM for committed usage, saving up to 35% on compute costs for consistent loads.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 10.25, rawHourlyRate: 0.0140, rawConsumptionRate: null, upfrontFee: 100, termInMonths: 12
    },
    {
      id: 'azure-vm-b2s-3yr', provider: 'Azure', category: 'COMPUTE', name: 'VM B2s', term: '3-Year Reserved', shortDescription: 'Three-year commitment for max savings (up to 55%), ideal for enterprise apps.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 7.09, rawHourlyRate: 0.0097, rawConsumptionRate: null, upfrontFee: 200, termInMonths: 36
    },
    {
      id: 'gcp-ce-e2-medium-ondemand', provider: 'GCP', category: 'COMPUTE', name: 'Compute Engine e2-medium', term: 'On-Demand', shortDescription: 'Balanced VM for general apps with 2 vCPU and 4 GB memory, optimized for cost-efficiency.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 24.46, rawHourlyRate: 0.0335, rawConsumptionRate: null, upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'gcp-ce-e2-medium-1yr', provider: 'GCP', category: 'COMPUTE', name: 'Compute Engine e2-medium', term: '1-Year CUD', shortDescription: 'One-year commitment discount (28% off) for steady workloads across regions.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 17.61, rawHourlyRate: 0.0241, rawConsumptionRate: null, upfrontFee: 120, termInMonths: 12
    },
    {
      id: 'gcp-ce-e2-medium-3yr', provider: 'GCP', category: 'COMPUTE', name: 'Compute Engine e2-medium', term: '3-Year CUD', shortDescription: 'Three-year CUD for 46% savings, best for long-term production environments.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 13.19, rawHourlyRate: 0.0181, rawConsumptionRate: null, upfrontFee: 250, termInMonths: 36
    },
    // --- COMPUTE (Orchestration/K8s) ---
    {
      id: 'aws-eks-cluster-ondemand', provider: 'AWS', category: 'COMPUTE', name: 'EKS Cluster', term: 'On-Demand', shortDescription: 'Managed Kubernetes control plane for container orchestration, charged per cluster-hour.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 73.00, rawHourlyRate: 0.10, rawConsumptionRate: null, upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'aws-eks-cluster-1yr', provider: 'AWS', category: 'COMPUTE', name: 'EKS Cluster', term: '1-Year Savings Plan', shortDescription: 'Savings Plan for EKS compute, up to 50% off for committed cluster usage.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 48.00, rawHourlyRate: 0.066, rawConsumptionRate: null, upfrontFee: 300, termInMonths: 12
    },
    {
      id: 'aws-eks-cluster-3yr', provider: 'AWS', category: 'COMPUTE', name: 'EKS Cluster', term: '3-Year Savings Plan', shortDescription: 'Long-term plan for EKS, up to 66% discount on control plane fees.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 32.00, rawHourlyRate: 0.044, rawConsumptionRate: null, upfrontFee: 500, termInMonths: 36
    },
    {
      id: 'azure-aks-cluster-ondemand', provider: 'Azure', category: 'COMPUTE', name: 'AKS Cluster', term: 'On-Demand', shortDescription: 'Managed K8s service with free control plane (pay for nodes only) in standard tier.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 0.00, rawHourlyRate: 0.00, rawConsumptionRate: null, upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'azure-aks-cluster-1yr', provider: 'Azure', category: 'COMPUTE', name: 'AKS Cluster', term: '1-Year Reserved', shortDescription: 'Reserved for node VMs in AKS, up to 48% savings on underlying compute.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 36.00, rawHourlyRate: 0.049, rawConsumptionRate: null, upfrontFee: 200, termInMonths: 12
    },
    {
      id: 'azure-aks-cluster-3yr', provider: 'Azure', category: 'COMPUTE', name: 'AKS Cluster', term: '3-Year Reserved', shortDescription: 'Max savings (up to 65%) for committed AKS node resources.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 25.20, rawHourlyRate: 0.0345, rawConsumptionRate: null, upfrontFee: 400, termInMonths: 36
    },
    {
      id: 'gcp-gke-cluster-ondemand', provider: 'GCP', category: 'COMPUTE', name: 'GKE Standard Cluster', term: 'On-Demand', shortDescription: 'Zonal cluster management fee, with $74.40 free tier credit/month.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 73.00, rawHourlyRate: 0.10, rawConsumptionRate: null, upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'gcp-gke-cluster-1yr', provider: 'GCP', category: 'COMPUTE', name: 'GKE Standard Cluster', term: '1-Year CUD', shortDescription: '20% discount on cluster management for committed usage.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 58.40, rawHourlyRate: 0.08, rawConsumptionRate: null, upfrontFee: 300, termInMonths: 12
    },
    {
      id: 'gcp-gke-cluster-3yr', provider: 'GCP', category: 'COMPUTE', name: 'GKE Standard Cluster', term: '3-Year CUD', shortDescription: '45% off for long-term GKE commitments.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 40.15, rawHourlyRate: 0.055, rawConsumptionRate: null, upfrontFee: 500, termInMonths: 36
    },
    // --- COMPUTE (Serverless/FaaS) ---
    {
      id: 'aws-lambda-ondemand', provider: 'AWS', category: 'COMPUTE', name: 'Lambda', term: 'On-Demand', shortDescription: 'Serverless compute for microservices, billed per invocation and duration.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 5.00, rawHourlyRate: null, rawConsumptionRate: '0.00001667/GB-s; 0.20/million reqs', upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'aws-lambda-1yr', provider: 'AWS', category: 'COMPUTE', name: 'Lambda', term: '1-Year Savings Plan', shortDescription: 'Savings on Lambda compute for predictable event-driven workloads.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 3.25, rawHourlyRate: null, rawConsumptionRate: '0.0000109/GB-s', upfrontFee: 100, termInMonths: 12
    },
    {
      id: 'aws-lambda-3yr', provider: 'AWS', category: 'COMPUTE', name: 'Lambda', term: '3-Year Savings Plan', shortDescription: 'Up to 66% off for high-volume serverless functions.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 2.00, rawHourlyRate: null, rawConsumptionRate: '0.0000067/GB-s', upfrontFee: 200, termInMonths: 36
    },
    {
      id: 'azure-functions-consumption', provider: 'Azure', category: 'COMPUTE', name: 'Functions Consumption', term: 'On-Demand', shortDescription: 'Serverless execution plan, pay-per-execution for event-triggered code.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 4.00, rawHourlyRate: null, rawConsumptionRate: '0.000016/GB-s; 0.20/million execs', upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'azure-functions-premium-1yr', provider: 'Azure', category: 'COMPUTE', name: 'Functions Premium', term: '1-Year Reserved', shortDescription: 'Premium plan with VNet support, reserved for lower latency.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 50.00, rawHourlyRate: 0.068, rawConsumptionRate: null, upfrontFee: 300, termInMonths: 12
    },
    {
      id: 'azure-functions-premium-3yr', provider: 'Azure', category: 'COMPUTE', name: 'Functions Premium', term: '3-Year Reserved', shortDescription: 'Long-term premium for always-ready serverless scaling.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 30.00, rawHourlyRate: 0.041, rawConsumptionRate: null, upfrontFee: 600, termInMonths: 36
    },
    {
      id: 'gcp-cloudfunctions-ondemand', provider: 'GCP', category: 'COMPUTE', name: 'Cloud Functions', term: 'On-Demand', shortDescription: 'Event-driven serverless functions, billed per invocation and compute time.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 3.00, rawHourlyRate: null, rawConsumptionRate: '0.0000025/GB-s; 0.40/million inv', upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'gcp-cloudrun-micro-1yr', provider: 'GCP', category: 'COMPUTE', name: 'Cloud Run (Microservice)', term: '1-Year CUD', shortDescription: 'Container-based microservices with auto-scaling, committed discount.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 20.00, rawHourlyRate: 0.027, rawConsumptionRate: null, upfrontFee: 150, termInMonths: 12
    },
    {
      id: 'gcp-cloudrun-micro-3yr', provider: 'GCP', category: 'COMPUTE', name: 'Cloud Run (Microservice)', term: '3-Year CUD', shortDescription: 'Pay-per-use containers for microservices with long-term savings.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 12.00, rawHourlyRate: 0.016, rawConsumptionRate: null, upfrontFee: 300, termInMonths: 36
    },
    // --- COMPUTE (Streaming) ---
    {
      id: 'aws-kinesis-stream-ondemand', provider: 'AWS', category: 'COMPUTE', name: 'Kinesis Data Streams', term: 'On-Demand', shortDescription: 'Real-time stream processing with shards for high-throughput data ingestion.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 25.00, rawHourlyRate: null, rawConsumptionRate: '0.015/shard-hour', upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'aws-flink-managed-1yr', provider: 'AWS', category: 'COMPUTE', name: 'Managed Apache Flink', term: '1-Year Savings Plan', shortDescription: 'Serverless stream processing with Flink, discounted for steady pipelines.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 80.00, rawHourlyRate: 0.11, rawConsumptionRate: null, upfrontFee: 500, termInMonths: 12
    },
    {
      id: 'aws-flink-managed-3yr', provider: 'AWS', category: 'COMPUTE', name: 'Managed Apache Flink', term: '3-Year Savings Plan', shortDescription: 'Scalable stream analytics with up to 66% savings.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 50.00, rawHourlyRate: 0.068, rawConsumptionRate: null, upfrontFee: 1000, termInMonths: 36
    },
    {
      id: 'azure-streamanalytics-ondemand', provider: 'Azure', category: 'COMPUTE', name: 'Stream Analytics', term: 'On-Demand', shortDescription: 'Real-time analytics on streaming data, billed per streaming unit.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 30.00, rawHourlyRate: null, rawConsumptionRate: '0.011/SU-hour', upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'azure-streamanalytics-1yr', provider: 'Azure', category: 'COMPUTE', name: 'Stream Analytics', term: '1-Year Reserved', shortDescription: 'Reserved units for cost-effective continuous querying.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 20.00, rawHourlyRate: null, rawConsumptionRate: '0.007/SU-hour', upfrontFee: 150, termInMonths: 12
    },
    {
      id: 'azure-streamanalytics-3yr', provider: 'Azure', category: 'COMPUTE', name: 'Stream Analytics', term: '3-Year Reserved', shortDescription: 'Long-term commitment for large-scale stream processing.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 12.00, rawHourlyRate: null, rawConsumptionRate: '0.004/SU-hour', upfrontFee: 300, termInMonths: 36
    },
    {
      id: 'gcp-dataflow-ondemand', provider: 'GCP', category: 'COMPUTE', name: 'Dataflow', term: 'On-Demand', shortDescription: 'Managed stream/batch processing pipelines, vCPU-based billing.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 40.00, rawHourlyRate: 0.055, rawConsumptionRate: '0.0125/vCPU-hour', upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'gcp-dataflow-1yr', provider: 'GCP', category: 'COMPUTE', name: 'Dataflow', term: '1-Year CUD', shortDescription: '28% off for committed Dataflow jobs.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 28.80, rawHourlyRate: 0.0396, rawConsumptionRate: null, upfrontFee: 200, termInMonths: 12
    },
    {
      id: 'gcp-dataflow-3yr', provider: 'GCP', category: 'COMPUTE', name: 'Dataflow', term: '3-Year CUD', shortDescription: '46% discount for production streaming workloads.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 21.60, rawHourlyRate: 0.0297, rawConsumptionRate: null, upfrontFee: 400, termInMonths: 36
    },
    // --- CACHING ---
    {
      id: 'aws-elasticache-redis-t3micro-ondemand', provider: 'AWS', category: 'CACHE', name: 'ElastiCache Redis cache.t3.micro', term: 'On-Demand', shortDescription: 'In-memory caching for low-latency app acceleration.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 12.41, rawHourlyRate: 0.017, rawConsumptionRate: null, upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'aws-elasticache-redis-t3micro-1yr', provider: 'AWS', category: 'CACHE', name: 'ElastiCache Redis cache.t3.micro', term: '1-Year RI', shortDescription: 'Reserved cache nodes for 40% savings.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 8.06, rawHourlyRate: 0.011, rawConsumptionRate: null, upfrontFee: 50, termInMonths: 12
    },
    {
      id: 'aws-elasticache-redis-t3micro-3yr', provider: 'AWS', category: 'CACHE', name: 'ElastiCache Redis cache.t3.micro', term: '3-Year RI', shortDescription: 'Up to 60% off for persistent caching.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 5.56, rawHourlyRate: 0.0076, rawConsumptionRate: null, upfrontFee: 100, termInMonths: 36
    },
    {
      id: 'azure-cache-redis-basic-c0-ondemand', provider: 'Azure', category: 'CACHE', name: 'Cache for Redis Basic C0', term: 'On-Demand', shortDescription: 'Basic tier Redis for development caching with 250 MB.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 16.06, rawHourlyRate: 0.022, rawConsumptionRate: null, upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'azure-cache-redis-basic-c0-1yr', provider: 'Azure', category: 'CACHE', name: 'Cache for Redis Basic C0', term: '1-Year Reserved', shortDescription: 'Reserved for premium tiers (basic not reservable; use premium equiv).',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 10.44, rawHourlyRate: 0.0143, rawConsumptionRate: null, upfrontFee: 80, termInMonths: 12
    },
    {
      id: 'azure-cache-redis-basic-c0-3yr', provider: 'Azure', category: 'CACHE', name: 'Cache for Redis Basic C0', term: '3-Year Reserved', shortDescription: 'Max savings for HA caching setups.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 7.23, rawHourlyRate: 0.0099, rawConsumptionRate: null, upfrontFee: 160, termInMonths: 36
    },
    {
      id: 'gcp-memorystore-redis-basic-ondemand', provider: 'GCP', category: 'CACHE', name: 'Memorystore Redis Basic', term: 'On-Demand', shortDescription: 'Managed Redis for sub-millisecond latency caching.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 20.00, rawHourlyRate: 0.0274, rawConsumptionRate: null, upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'gcp-memorystore-redis-basic-1yr', provider: 'GCP', category: 'CACHE', name: 'Memorystore Redis Basic', term: '1-Year CUD', shortDescription: '20% off for committed Redis instances.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 16.00, rawHourlyRate: 0.0219, rawConsumptionRate: null, upfrontFee: 100, termInMonths: 12
    },
    {
      id: 'gcp-memorystore-redis-basic-3yr', provider: 'GCP', category: 'CACHE', name: 'Memorystore Redis Basic', term: '3-Year CUD', shortDescription: '40% discount for production caches.',
      pricingModelType: 'AMORTIZE_UPFRONT', monthlyRate: 12.00, rawHourlyRate: 0.0165, rawConsumptionRate: null, upfrontFee: 200, termInMonths: 36
    },
    // --- STORAGE ---
    {
      id: 'aws-s3-standard-ondemand', provider: 'AWS', category: 'STORAGE', name: 'S3 Standard', term: 'On-Demand', shortDescription: 'Durable object storage for frequently accessed data.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 23.00, rawHourlyRate: null, rawConsumptionRate: '0.023/GB-month', upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'azure-blob-hot-ondemand', provider: 'Azure', category: 'STORAGE', name: 'Blob Storage Hot', term: 'On-Demand', shortDescription: 'Hot tier for high-throughput object storage.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 18.40, rawHourlyRate: null, rawConsumptionRate: '0.0184/GB-month', upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'gcp-cs-standard-ondemand', provider: 'GCP', category: 'STORAGE', name: 'Cloud Storage Standard', term: 'On-Demand', shortDescription: 'Multi-regional storage for active data with strong consistency.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 20.00, rawHourlyRate: null, rawConsumptionRate: '0.020/GB-month', upfrontFee: 0, termInMonths: 0
    },
    // --- NETWORKING ---
    {
      id: 'aws-alb-ondemand', provider: 'AWS', category: 'NETWORKING', name: 'Application Load Balancer', term: 'On-Demand', shortDescription: 'L7 load balancing for HTTP/HTTPS traffic distribution.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 16.43, rawHourlyRate: 0.0225, rawConsumptionRate: '0.008/LCU-hour', upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'azure-lb-standard-ondemand', provider: 'Azure', category: 'NETWORKING', name: 'Load Balancer Standard', term: 'On-Demand', shortDescription: 'Layer 4/7 balancing with zone redundancy.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 5.00, rawHourlyRate: null, rawConsumptionRate: '0.025/hour + data fees', upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'gcp-https-lb-ondemand', provider: 'GCP', category: 'NETWORKING', name: 'HTTP(S) Load Balancer', term: 'On-Demand', shortDescription: 'Global load balancing with premium networking.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 18.00, rawHourlyRate: null, rawConsumptionRate: '0.025/hour + 0.08/GB', upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'aws-cloudfront-ondemand', provider: 'AWS', category: 'NETWORKING', name: 'CloudFront', term: 'On-Demand', shortDescription: 'Global CDN for low-latency content delivery.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 85.00, rawHourlyRate: null, rawConsumptionRate: '0.085/GB transfer', upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'azure-cdn-standard-ondemand', provider: 'Azure', category: 'NETWORKING', name: 'CDN Standard Microsoft', term: 'On-Demand', shortDescription: 'Microsoft-backed CDN for optimized media delivery.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 81.00, rawHourlyRate: null, rawConsumptionRate: '0.081/GB (Zone 1)', upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'gcp-cloudcdn-ondemand', provider: 'GCP', category: 'NETWORKING', name: 'Cloud CDN', term: 'On-Demand', shortDescription: 'Integrated CDN with Cloud Storage for edge caching.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 80.00, rawHourlyRate: null, rawConsumptionRate: '0.08/GB egress', upfrontFee: 0, termInMonths: 0
    },
    // --- COMPUTE (Static/Web) ---
    {
      id: 'aws-amplify-ondemand', provider: 'AWS', category: 'COMPUTE', name: 'Amplify Hosting', term: 'On-Demand', shortDescription: 'Full-stack serverless for building and deploying web/mobile apps with CI/CD.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 15.00, rawHourlyRate: null, rawConsumptionRate: '0.15/GB served; 0.01/build min', upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'azure-staticwebapps-standard', provider: 'Azure', category: 'COMPUTE', name: 'Static Web Apps Standard', term: 'On-Demand', shortDescription: 'Serverless hosting for static sites with API integration and global CDN.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 9.00, rawHourlyRate: null, rawConsumptionRate: null, upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'gcp-firebase-hosting-ondemand', provider: 'GCP', category: 'COMPUTE', name: 'Firebase Hosting', term: 'On-Demand', shortDescription: 'Fast, secure hosting for web apps with automatic SSL and global edge network.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 20.00, rawHourlyRate: null, rawConsumptionRate: '0.15/GB after 10GB free', upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'aws-apprunner-ondemand', provider: 'AWS', category: 'COMPUTE', name: 'App Runner', term: 'On-Demand', shortDescription: 'Managed service for web apps and APIs from code/repo.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 20.00, rawHourlyRate: 0.007, rawConsumptionRate: null, upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'azure-appservice-web-ondemand', provider: 'Azure', category: 'COMPUTE', name: 'App Service Web', term: 'On-Demand', shortDescription: 'PaaS for hosting web clients with auto-scaling.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 54.75, rawHourlyRate: 0.075, rawConsumptionRate: null, upfrontFee: 0, termInMonths: 0
    },
    {
      id: 'gcp-appengine-std-ondemand', provider: 'GCP', category: 'COMPUTE', name: 'App Engine Standard', term: 'On-Demand', shortDescription: 'Platform for scalable web apps without server management.',
      pricingModelType: 'RATE_HOURLY', monthlyRate: 10.00, rawHourlyRate: 0.05, rawConsumptionRate: null, upfrontFee: 0, termInMonths: 0
    },
  ];

  for (const service of cloudServices) {
    try {
      await prisma.cloudService.upsert({
        where: { id: service.id },
        update: service,
        create: service,
      });
    } catch (e) {
      console.error(`Error seeding service ${service.id}:`, e);
    }
  }

  console.log('Seeding of CloudService table finished.');
}


// --- 2. EXISTING COMPONENT SEEDING FUNCTION ---
async function seedComponents() {
  console.log('Start seeding Component table with costs and constraints...');

  const components = [
    // --- 1. Compute & Server (UPDATED CONFIGURATION) ---
    {
      name: 'Server',
      type: 'COMPUTE',
      iconUrl: '/assets/icons/server.svg',
      documentationUrl: 'https://docs.example.com/server',
      metadata: {
        instance: {
          label: "Instance Type",
          options: ["t2.micro", "m5.large", "c5.xlarge"],
          // Cost is embedded in configs based on hypothetical hourly rate * 730 hours
          configs: { 
            "t2.micro": { cpu: 1, memory_gb: 1, cost_factor: 10.95 }, // $0.015/hr * 730
            "m5.large": { cpu: 2, memory_gb: 8, cost_factor: 54.75 }, // $0.075/hr * 730
            "c5.xlarge": { cpu: 4, memory_gb: 8, cost_factor: 109.50 } // $0.15/hr * 730
          },
          required: true 
        },
        scaling_policy: {
          label: "Scaling Policy",
          min_instances: { type: "number", label: "Min Instances", default: 1, required: true },
          max_instances: { type: "number", label: "Max Instances", default: 3, required: true }
        },
        multi_az: { type: "boolean", label: "Multi-AZ Enabled", default: false }
      }
    },
    {
      name: 'Client',
      type: 'COMPUTE',
      iconUrl: '/assets/icons/client.svg',
      documentationUrl: 'https://docs.example.com/client',
      metadata: {
        platform: {
          label: "Platform",
          options: ["Web", "Mobile", "Desktop"]
        }
      }
    },
    {
      name: 'Kubernetes Cluster',
      type: 'COMPUTE',
      iconUrl: '/assets/icons/kubernetes.svg',
      documentationUrl: 'https://docs.kubernetes.io/',
      metadata: {
        node_config: {
          label: "Node Configuration",
          // $15 per node/month baseline
          node_count: { type: "number", label: "Number of Nodes", default: 3, required: true, cost_factor: 15.00 }, 
          node_type: {
            label: "Node Instance Type",
            options: ["m5.large", "m5.xlarge", "c5.2xlarge"]
          }
        },
        multi_region: { type: "boolean", label: "Multi-Region Deployment", default: false }
      }
    },
    {
      name: 'Microservice',
      type: 'COMPUTE',
      iconUrl: '/assets/icons/service.svg',
      documentationUrl: 'https://docs.example.com/microservices',
      metadata: {
        language: {
          label: "Programming Language",
          options: ["Node.js", "Python", "Go", "Java"]
        }
      }
    },
    // NEW: Stream Processor Component (Uses Server Icon)
    {
      name: 'Stream Processor',
      type: 'COMPUTE',
      iconUrl: '/assets/icons/server.svg', 
      documentationUrl: 'https://docs.example.com/stream-processor',
      metadata: {
        framework: {
          label: "Processing Framework",
          options: ["Apache Flink", "Spark Streaming", "Lambda/Cloud Functions"]
        },
        // Cost based on compute power needed for parallel processing
        processing_units: { type: "number", label: "Parallel Workers (Cores)", default: 4, required: true, cost_factor: 25.00 }, 
        state_backend: {
          label: "State Backend",
          options: ["In-Memory", "Persistent (EBS)"],
          default: "Persistent (EBS)"
        }
      }
    },

    // --- 2. Databases & Storage (UPDATED CONFIGURATION) ---
    {
      name: 'Database',
      type: 'DATABASE',
      iconUrl: '/assets/icons/database.svg',
      documentationUrl: 'https://docs.example.com/database',
      metadata: {
        engine: { 
          label: "Database Engine",
          options: ["PostgreSQL (SQL)", "MongoDB (NoSQL)", "Cassandra (NoSQL)", "DynamoDB (NoSQL)"],
          required: true
        },
        nodes: {
          label: "Cluster/Node Configuration",
          // Master/Write node cost (Base price $50 + multiplier)
          write_nodes: { type: "number", label: "Write Nodes (Master/Primary)", default: 1, required: true, cost_factor: 50.00 }, 
          // Read node cost (Base price $30 + multiplier)
          read_replicas: { type: "number", label: "Read Replicas", default: 0, required: true, cost_factor: 30.00 } 
        },
        storage: {
          label: "Storage & IOPS",
          // Storage cost per GB
          storage_gb: { type: "number", label: "Storage (GB)", default: 100, required: true, cost_factor: 0.10 }, 
          iops_tier: { label: "IOPS/Provisioning", options: ["Standard", "High Performance (SSD)"] }
        },
        sharding: { type: "boolean", label: "Enable Horizontal Sharding", default: false }
      }
    },
    // NEW: Geo-Spatial Database (Uses Database Icon)
    {
      name: 'Geo-Spatial DB',
      type: 'DATABASE',
      iconUrl: '/assets/icons/database.svg', 
      documentationUrl: 'https://docs.example.com/geospatial',
      metadata: {
        engine: {
          label: "Geo-Spatial Engine",
          options: ["PostGIS", "ElasticSearch Geo", "MongoDB Geo"],
          required: true
        },
        nodes: {
          write_nodes: { type: "number", label: "Write Nodes (Master/Primary)", default: 1, required: true, cost_factor: 60.00 },
          read_replicas: { type: "number", label: "Read Replicas", default: 1, required: true, cost_factor: 40.00 }
        },
        index_type: { label: "Indexing Strategy", options: ["Geohash", "R-Tree", "Quadtree"] }
      }
    },
    {
      name: 'Cache',
      type: 'CACHE',
      iconUrl: '/assets/icons/cache.svg',
      documentationUrl: 'https://docs.example.com/cache',
      metadata: {
        engine: {
          label: "Cache Engine",
          options: ["Redis", "Memcached"],
          required: true
        },
        cluster_mode: {
          label: "Cluster Mode",
          options: ["Single Node", "Replicated (HA)", "Clustered (Sharded)"],
          required: true
        },
        // Memory cost per GB
        memory_gb: { type: "number", label: "Cache Size (GB)", default: 5, required: true, cost_factor: 0.50 }, 
        eviction_policy: {
          label: "Eviction Policy",
          options: ["LRU", "FIFO", "LFU"]
        },
        data_persistence: { type: "boolean", label: "Enable Persistence (RDB/AOF)", default: false }
      }
    },
    {
      name: 'Object Storage',
      type: 'STORAGE',
      iconUrl: '/assets/icons/bucket.svg',
      documentationUrl: 'https://docs.example.com/storage',
      metadata: {
        access_tier: {
          label: "Access Tier",
          options: ["Standard", "Infrequent Access", "Archive"],
          required: true
        },
        // Storage cost per TB
        estimated_size_tb: { type: "number", label: "Estimated Size (TB)", default: 1, required: true, cost_factor: 20.00 } 
      }
    },

    // --- 3. Networking (UPDATED CONFIGURATION) ---
    {
      name: 'Load Balancer',
      type: 'NETWORKING',
      iconUrl: '/assets/icons/load-balancer.svg',
      documentationUrl: 'https://docs.example.com/load-balancer',
      metadata: {
        type: {
          label: "Load Balancer Type",
          options: ["Application (L7)", "Network (L4)"],
          required: true
        },
        multi_az: { type: "boolean", label: "Multi-AZ Enabled", default: true },
        // Cost per 1k req capacity provisioned
        rate_limiting_rps: { type: "number", label: "Max RPS Threshold", default: 1000, cost_factor: 0.001 } 
      }
    },
    {
      name: 'CDN',
      type: 'NETWORKING',
      iconUrl: '/assets/icons/cdn.svg',
      documentationUrl: 'https://docs.example.com/cdn',
      metadata: {
        caching_policy: {
          label: "Caching Policy",
          options: ["Default TTL", "Aggressive (Long TTL)", "No Cache"],
          required: true
        },
        geo_distribution: {
          label: "Geo Distribution",
          options: ["Regional", "Global"],
          required: true
        },
        cache_hit_ratio_target: { type: "number", label: "Target Hit Ratio (%)", default: 80 }
      }
    },

    // --- 4. Messaging & Other (UPDATED CONFIGURATION) ---
    {
      name: 'Message Queue',
      type: 'MESSAGING',
      iconUrl: '/assets/icons/http-que.svg',
      documentationUrl: 'https://docs.example.com/queue',
      metadata: {
        engine: {
          label: "Queue Engine",
          options: ["Amazon SQS", "RabbitMQ", "Kafka/Kinesis"],
          required: true
        },
        configs: {
          "Kafka/Kinesis": {
            // Cost per partition/shard
            partitions: { type: "number", label: "Partitions/Shards", default: 10, required: true, cost_factor: 5.00 }, 
            replication_factor: { type: "number", label: "Replication Factor", default: 3, required: true }
          },
          "Amazon SQS": {
            type: { label: "Queue Type", options: ["Standard", "FIFO"], required: true },
            retention_days: { type: "number", label: "Message Retention (Days)", default: 4 }
          }
        }
      }
    },
  ];

  for (const component of components) {
    await prisma.component.upsert({
      where: { name: component.name },
      update: component,
      create: component,
    });
  }

  console.log('Seeding of Component table finished.');
}


// --- 3. PROBLEM SEEDING FUNCTION ---
async function seedProblems() {
  console.log('Start seeding Problem table...');

  // Interface removed to prevent TS-NODE syntax error. Data structure remains JSON.

  const problems = [
    // 1. REAL-TIME STOCK MARKET TICKER FEED (READ-HEAVY FOCUS)
    {
      title: 'Real-Time Stock Market Ticker Feed',
      difficulty: Difficulty.HARD,
      
      // Initial Requirements (Answered Clarification)
      initialRequirementsQa: [
        { Q: 'What is the expected read/write ratio?', A: 'Highly skewed towards read. Approx. 500:1 (500k reads / 1k writes).' },
        { Q: 'Is eventual consistency acceptable for the live feed?', A: 'Yes, but historical data must be strongly consistent.' },
        { Q: 'What is the required P99 Read Latency for the live feed?', A: 'Must be under 100 millisecond  s.' },
      ],
      
      // Interview Questions (Unanswered for student, but includes Ideal Answer for AI/Report)
      interviewQuestions: [
        { 
          Q: 'Justify your choice of database for storing the 5 years of immutable historical data.', 
          IdealA: 'Given the need for strong consistency, immutability, and time-series access, a columnar database (like Cassandra or ScyllaDB) partitioned by time and indexed by stock ticker is optimal. Alternatively, a highly sharded relational database with specialized time-series extensions (like TimescaleDB for PostgreSQL) could be justified for strong consistency if write load isn\'t extreme.' 
        },
        { 
          Q: 'Detail your caching strategy (placement, invalidation, and memory sizing) to meet the sub-100ms P99 latency goal.',
          IdealA: 'A multi-layer caching strategy is required. Use a massive, sharded, in-memory cache cluster (e.g., Redis Cluster, sized to 256GB+) to hold all 10,000 live stock prices in memory. Use a "Write-Through/Write-Around" policy for live updates and a simple "Least Recently Used" (LRU) policy for historical data lookups to ensure the database load is minimized.' 
        },
        { 
          Q: 'How does your CDN configuration specifically handle the delivery of real-time WebSocket/Stream data to millions of concurrent clients?', 
          IdealA: 'The CDN must utilize an Edge Network (WebSocket proxying CDN, like Cloudflare/Akamai) to terminate WebSocket connections geographically close to the users. This significantly reduces latency and offloads the persistent connection state from the origin servers, directly addressing the global latency requirement.' 
        },
        { 
          Q: 'Explain the primary cost-performance trade-off you made to remain within the $5,500 budget constraint.', 
          IdealA: 'The primary trade-off is between the Cache and the Database. We maximize the Cache size (256GB+) to handle the 500k RPS read load, allowing us to use less expensive compute instances for the API tier and fewer (but highly provisioned) Read Replicas on the database. This shifts cost from database scaling (expensive) to memory (predictable and cheaper for read ops).' 
        },
      ],

      // Existing requirements preserved
      requirements: {
        description: 'Design a system that ingests real-time stock price updates, stores historical data, and serves live ticker feeds to millions of concurrent users with minimal latency. **Primary goal: Sub-100ms P99 Read Latency.**',
        functional_requirements: [
          'Ingest 1,000,000 price updates per second via a persistent stream.',
          'Serve live ticker feeds for 10,000 stocks.',
          'Provide historical price lookups (daily/minute bars).',
          'Price data must be validated and stored immutably.'
        ],
        non_functional_requirements: [
          'Read Latency (P99) for live feed < 100ms.',
          'High Availability (99.999% uptime) and durability.',
          'Scalable to handle millions of concurrent viewers.'
        ],
        scale: '10 million concurrent active viewers, 10,000 writes/sec (ingestion), 500,000 reads/sec (live feed).',
        constraints: [
          'Historical data retention: 5 years (low access).',
          'System must handle burst load of new viewers without degradation.',
          'Latency requirements apply globally.'
        ],
        budget_usd: 5500, 
        configuration_targets: { 
          "Message Queue": {
            "partitions": { min: 5, max: 20 },
            "replication_factor": 3 
          },
          "Cache": {
            "memory_gb": { min: 256, max: 512 },
            "cluster_mode": "Clustered (Sharded)"
          },
          "Database": {
            "read_replicas": { min: 5, max: 10 },
            "sharding": false
          },
          "CDN": {
            "geo_distribution": "Global",
            "caching_policy": "Aggressive (Long TTL)"
          }
        }
      }
    },

    // 2. INDUSTRIAL IOT SENSOR DATA INTEGRATION (WRITE-HEAVY FOCUS)
    {
      title: 'Industrial IoT Sensor Data Integration',
      difficulty: Difficulty.HARD,
      
      // Initial Requirements (Answered Clarification)
      initialRequirementsQa: [
        { Q: 'What is the primary metric of concern (e.g., latency, throughput)?', A: 'Data durability and write throughput (1M writes/sec).' },
        { Q: 'How much temporary data loss is acceptable during a spike?', A: 'Zero data loss is the goal (must maintain durability during ingestion).' },
        { Q: 'What is the required retention for raw sensor data?', A: '1 year in Object Storage.' },
      ],
      
      // Interview Questions (Unanswered for student, but includes Ideal Answer for AI/Report)
      interviewQuestions: [
        { 
          Q: 'Justify your choice of message queue/stream (e.g., Kafka vs. Kinesis) and explain how you sized the number of partitions to handle 1M writes/sec.', 
          IdealA: 'Kafka or Kinesis is mandatory for durability and high throughput. The calculation requires $\text{WriteRate / (MaxThroughputPerPartition)}$. For 1M writes/sec, and assuming a maximum of $20\text{k}$ messages per partition, we need a minimum of 50 partitions. This parallelization is crucial for high-velocity ingestion.'
        },
        { 
          Q: 'Describe your database sharding strategy and data model to optimize for time-series write performance.', 
          IdealA: 'A NoSQL time-series database (like Cassandra or DynamoDB) is necessary. The sharding key should be a composite of $\text{Sensor ID}$ and $\text{Time Bucket (e.g., day/hour)}$. This ensures sequential writes stay local on a single node, maximizing write performance while distributing the overall data load across the cluster.' 
        },
        { 
          Q: 'Explain the flow control mechanism you implemented (e.g., Load Balancer rate limiting) to protect your system from backpressure during spikes.', 
          IdealA: 'We must implement rate limiting (e.g., $1.2\text{M}$ RPS) on the API Gateway or Load Balancer layer to buffer against sudden traffic spikes. This protects the downstream Kafka cluster from being instantly overwhelmed, ensuring the durability goal is met. The stream processor service must also be configured with auto-scaling to consume data faster during persistent high load.' 
        },
        { 
          Q: 'Why did you choose the specific replication factor for your message queue and database write nodes?', 
          IdealA: 'We chose a $\text{Replication Factor (RF)}$ of 3 for the message queue and database. This ensures that even if one node fails (Node $\text{A}$), there are still two identical copies (Nodes $\text{B}$ and $\text{C}$) available. This meets the NFR of "Zero data loss" and "Fault tolerant" at the ingestion layer.' 
        },
      ],

      // Existing requirements preserved
      requirements: {
        description: 'Design a reliable, fault-tolerant system to ingest, process, and store time-series data from 5 million industrial IoT sensors, where **0% data loss is unacceptable** during ingestion. **Primary goal: 1,000,000 writes/sec throughput.**',
        functional_requirements: [
          'Ingest one metric per device every 5 seconds (1 million writes/sec total).',
          'Store raw data in a permanent archive (Object Storage).',
          'Process raw data to calculate real-time aggregates.',
          'Provide an API to query aggregates (P90, P99) for the last 24 hours.'
        ],
        non_functional_requirements: [
          'Write Throughput: 0% data loss during ingestion.',
          'Low Write Latency (P95 < 200ms).',
          'Fault tolerant and highly durable.'
        ],
        scale: '5 million active devices, 1,000,000 writes per second (ingestion), 1,000 reads/sec (aggregate queries).',
        constraints: [
          'Must support backpressure during traffic spikes.',
          'Raw data retention: 1 year in Object Storage.',
          'Must use a dedicated Stream Processor component for aggregation.'
        ],
        budget_usd: 8500, 
        configuration_targets: { 
          "Message Queue": {
            "partitions": { min: 50, max: 100 },
            "replication_factor": 3
          },
          "Database": {
            "write_nodes": { min: 5, max: 15 },
            "read_replicas": { min: 1, max: 3 },
            "sharding": true
          },
          "Stream Processor": {
            "processing_units": { min: 8, max: 16 }
          },
          "Load Balancer": {
            "rate_limiting_rps": { min: 1000000, max: 1200000 }
          }
        }
      }
    },
  ];

  // --- Problem Seeding Logic ---
  for (const problem of problems) {
    // Note: We use findFirst because title is not unique, allowing updates
    const existing = await prisma.problem.findFirst({
      where: { title: problem.title },
    });

    // Consolidated data object for upsert, ensuring the new fields are included.
    const dataToSave = {
      title: problem.title,
      difficulty: problem.difficulty,
      requirements: problem.requirements,
      initialRequirementsQa: problem.initialRequirementsQa, 
      interviewQuestions: problem.interviewQuestions,   
      isDeleted: false,
    };


    if (!existing) {
      await prisma.problem.create({
        data: dataToSave,
      });
      console.log(`Created problem: ${problem.title}`);
    } else {
      // Update existing problems to ensure new requirements are applied
      await prisma.problem.update({
        where: { id: existing.id },
        data: dataToSave,
      });
      console.log(`Updated problem: ${problem.title}`);
    }
  }

  console.log('Seeding of Problem table finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



// --- MAIN EXECUTION ---
async function main() {
  await seedComponents();
  await seedProblems();
  await seedCloudServices(); // EXECUTE NEW SEEDING FUNCTION LAST
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });