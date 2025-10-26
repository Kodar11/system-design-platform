// // prisma/seed.ts

const { PrismaClient, Difficulty } = require('@prisma/client');

const prisma = new PrismaClient();

// --- 1. COMPONENT SEEDING FUNCTION ---
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


// --- 2. PROBLEM SEEDING FUNCTION ---
async function seedProblems() {
  console.log('Start seeding Problem table...');

  const problems = [
    // 1. REAL-TIME STOCK MARKET TICKER FEED (READ-HEAVY FOCUS)
    {
      title: 'Real-Time Stock Market Ticker Feed',
      difficulty: Difficulty.HARD,
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
        budget_usd: 5500, // Budget Constraint
        configuration_targets: { // Configuration Challenge Targets
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
        budget_usd: 8500, // Budget Constraint
        configuration_targets: { // Configuration Challenge Targets
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
    const existing = await prisma.problem.findFirst({
      where: { title: problem.title },
    });

    if (!existing) {
      await prisma.problem.create({
        data: {
          title: problem.title,
          difficulty: problem.difficulty,
          requirements: problem.requirements,
          isDeleted: false,
        },
      });
      console.log(`Created problem: ${problem.title}`);
    } else {
      // Update existing problems to ensure new requirements are applied
      await prisma.problem.update({
        where: { id: existing.id },
        data: {
          title: problem.title,
          difficulty: problem.difficulty,
          requirements: problem.requirements,
          isDeleted: false,
        },
      });
      console.log(`Updated problem: ${problem.title}`);
    }
  }

  console.log('Seeding of Problem table finished.');
}


// --- MAIN EXECUTION ---
async function main() {
  await seedComponents();
  await seedProblems();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
