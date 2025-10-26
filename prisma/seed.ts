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

// const { PrismaClient, Difficulty } = require('@prisma/client');

// const prisma = new PrismaClient();

// async function main() {
//   console.log('Start seeding Problem table...');

//   const problems = [
//     // 1. REAL-TIME STOCK MARKET TICKER FEED (READ-HEAVY FOCUS)
//     {
//       title: 'Real-Time Stock Market Ticker Feed',
//       difficulty: Difficulty.HARD,
//       requirements: {
//         description: 'Design a system that ingests real-time stock price updates, stores historical data, and serves live ticker feeds to millions of concurrent users with minimal latency. **Primary goal: Sub-100ms P99 Read Latency.**',
//         functional_requirements: [
//           'Ingest 1,000,000 price updates per second via a persistent stream.',
//           'Serve live ticker feeds for 10,000 stocks.',
//           'Provide historical price lookups (daily/minute bars).',
//           'Price data must be validated and stored immutably.'
//         ],
//         non_functional_requirements: [
//           'Read Latency (P99) for live feed < 100ms.',
//           'High Availability (99.999% uptime) and durability.',
//           'Scalable to handle millions of concurrent viewers.'
//         ],
//         scale: '10 million concurrent active viewers, 10,000 writes/sec (ingestion), 500,000 reads/sec (live feed).',
//         constraints: [
//           'Historical data retention: 5 years (low access).',
//           'System must handle burst load of new viewers without degradation.',
//           'Latency requirements apply globally.'
//         ],
//         budget_usd: 5500, // Budget Constraint
//         configuration_targets: { // Configuration Challenge Targets
//           "Message Queue": {
//             "partitions": { min: 5, max: 20 }, // Enough partitions for ingestion rate
//             "replication_factor": 3 // High durability
//           },
//           "Cache": {
//             "memory_gb": { min: 256, max: 512 }, // Large cache size for hot data
//             "cluster_mode": "Clustered (Sharded)" // Required for high read scale
//           },
//           "Database": {
//             "read_replicas": { min: 5, max: 10 }, // Heavy read scaling for historical data
//             "sharding": false // Assumes time-series or partitioning handles write scale
//           },
//           "CDN": {
//             "geo_distribution": "Global", // Required for global low latency
//             "caching_policy": "Aggressive (Long TTL)"
//           }
//         }
//       }
//     },

//     // 2. INDUSTRIAL IOT SENSOR DATA INTEGRATION (WRITE-HEAVY FOCUS)
//     {
//       title: 'Industrial IoT Sensor Data Integration',
//       difficulty: Difficulty.HARD,
//       requirements: {
//         description: 'Design a reliable, fault-tolerant system to ingest, process, and store time-series data from 5 million industrial IoT sensors, where **0% data loss is unacceptable** during ingestion. **Primary goal: 1,000,000 writes/sec throughput.**',
//         functional_requirements: [
//           'Ingest one metric per device every 5 seconds (1 million writes/sec total).',
//           'Store raw data in a permanent archive (Object Storage).',
//           'Process raw data to calculate real-time aggregates.',
//           'Provide an API to query aggregates (P90, P99) for the last 24 hours.'
//         ],
//         non_functional_requirements: [
//           'Write Throughput: 0% data loss during ingestion.',
//           'Low Write Latency (P95 < 200ms).',
//           'Fault tolerant and highly durable.'
//         ],
//         scale: '5 million active devices, 1,000,000 writes per second (ingestion), 1,000 reads/sec (aggregate queries).',
//         constraints: [
//           'Must support backpressure during traffic spikes.',
//           'Raw data retention: 1 year in Object Storage.',
//           'Must use a dedicated Stream Processor component for aggregation.'
//         ],
//         budget_usd: 8500, // Budget Constraint
//         configuration_targets: { // Configuration Challenge Targets
//           "Message Queue": {
//             "partitions": { min: 50, max: 100 }, // High number of partitions required for massive write scale
//             "replication_factor": 3 // Critical for 0% data loss
//           },
//           "Database": {
//             "write_nodes": { min: 5, max: 15 }, // Dedicated write scaling
//             "read_replicas": { min: 1, max: 3 }, // Low read scaling required
//             "sharding": true // Must enable sharding to handle data volume
//           },
//           "Stream Processor": {
//             "processing_units": { min: 8, max: 16 } // Significant parallel processing power needed
//           },
//           "Load Balancer": {
//             "rate_limiting_rps": { min: 1000000, max: 1200000 } // Set rate limit at ingress
//           }
//         }
//       }
//     },
//   ];
//   
//   // --- Problem Seeding Logic (Unchanged) ---
//   for (const problem of problems) {
//     // Check if problem already exists by title (since title is not @unique)
//     const existing = await prisma.problem.findFirst({
//       where: { title: problem.title },
//     });

//     if (!existing) {
//       await prisma.problem.create({
//         data: {
//           title: problem.title,
//           difficulty: problem.difficulty,
//           requirements: problem.requirements,
//           isDeleted: false,
//         },
//       });
//       console.log(`Created problem: ${problem.title}`);
//     } else {
//       // Update existing problems to ensure new requirements are applied
//       await prisma.problem.update({
//         where: { id: existing.id },
//         data: {
//           title: problem.title,
//           difficulty: problem.difficulty,
//           requirements: problem.requirements,
//           isDeleted: false,
//         },
//       });
//       console.log(`Updated problem: ${problem.title}`);
//     }
//   }

//   console.log('Seeding of Problem table finished.');
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
// const { PrismaClient } = require('@prisma/client');
// const prisma = new PrismaClient();

// async function main() {
//   console.log('Start seeding Component table...');

//   const components = [
//     // --- 1. Compute & Server (UPDATED CONFIGURATION) ---
//     {
//       name: 'Server',
//       type: 'COMPUTE',
//       iconUrl: '/assets/icons/server.svg',
//       documentationUrl: 'https://docs.example.com/server',
//       metadata: {
//         instance: {
//           label: "Instance Type",
//           options: ["t2.micro", "m5.large", "c5.xlarge"],
//           configs: {
//             "t2.micro": { cpu: 1, memory_gb: 1, cost_factor: 0.05 },
//             "m5.large": { cpu: 2, memory_gb: 8, cost_factor: 0.15 },
//             "c5.xlarge": { cpu: 4, memory_gb: 8, cost_factor: 0.30 }
//           },
//           required: true // Forces instance type selection
//         },
//         scaling_policy: {
//           label: "Scaling Policy",
//           min_instances: { type: "number", label: "Min Instances", default: 1, required: true },
//           max_instances: { type: "number", label: "Max Instances", default: 3, required: true }
//         },
//         multi_az: { type: "boolean", label: "Multi-AZ Enabled", default: false } // HA factor
//       }
//     },
//     {
//       name: 'Client',
//       type: 'COMPUTE',
//       iconUrl: '/assets/icons/client.svg',
//       documentationUrl: 'https://docs.example.com/client',
//       metadata: {
//         platform: {
//           label: "Platform",
//           options: ["Web", "Mobile", "Desktop"]
//         }
//       }
//     },
//     {
//       name: 'Kubernetes Cluster',
//       type: 'COMPUTE',
//       iconUrl: '/assets/icons/kubernetes.svg',
//       documentationUrl: 'https://docs.kubernetes.io/',
//       metadata: {
//         node_config: {
//           label: "Node Configuration",
//           node_count: { type: "number", label: "Number of Nodes", default: 3, required: true, cost_factor: 15.00 }, // $15 per node/month baseline
//           node_type: {
//             label: "Node Instance Type",
//             options: ["m5.large", "m5.xlarge", "c5.2xlarge"]
//           }
//         },
//         multi_region: { type: "boolean", label: "Multi-Region Deployment", default: false }
//       }
//     },
//     {
//       name: 'Microservice',
//       type: 'COMPUTE',
//       iconUrl: '/assets/icons/service.svg',
//       documentationUrl: 'https://docs.example.com/microservices',
//       metadata: {
//         language: {
//           label: "Programming Language",
//           options: ["Node.js", "Python", "Go", "Java"]
//         }
//       }
//     },
//     
//     // NEW: Stream Processor Component (Uses Server Icon)
//     {
//       name: 'Stream Processor',
//       type: 'COMPUTE',
//       iconUrl: '/assets/icons/server.svg', // Reusing server icon
//       documentationUrl: 'https://docs.example.com/stream-processor',
//       metadata: {
//         framework: {
//           label: "Processing Framework",
//           options: ["Apache Flink", "Spark Streaming", "Lambda/Cloud Functions"]
//         },
//         processing_units: { type: "number", label: "Parallel Workers (Cores)", default: 4, required: true, cost_factor: 25.00 }, // Cost based on compute
//         state_backend: {
//           label: "State Backend",
//           options: ["In-Memory", "Persistent (EBS)"],
//           default: "Persistent (EBS)"
//         }
//       }
//     },

//     // --- 2. Databases & Storage (UPDATED CONFIGURATION) ---
//     {
//       name: 'Database',
//       type: 'DATABASE',
//       iconUrl: '/assets/icons/database.svg',
//       documentationUrl: 'https://docs.example.com/database',
//       metadata: {
//         engine: { // Combined Type and Engine for simpler choice
//           label: "Database Engine",
//           options: ["PostgreSQL (SQL)", "MongoDB (NoSQL)", "Cassandra (NoSQL)", "DynamoDB (NoSQL)"],
//           required: true
//         },
//         nodes: {
//           label: "Cluster/Node Configuration",
//           write_nodes: { type: "number", label: "Write Nodes (Master/Primary)", default: 1, required: true, cost_factor: 50.00 }, // Master/Write node cost
//           read_replicas: { type: "number", label: "Read Replicas", default: 0, required: true, cost_factor: 30.00 } // Read node cost
//         },
//         storage: {
//           label: "Storage & IOPS",
//           storage_gb: { type: "number", label: "Storage (GB)", default: 100, required: true, cost_factor: 0.10 }, // Storage cost per GB
//           iops_tier: { label: "IOPS/Provisioning", options: ["Standard", "High Performance (SSD)"] }
//         },
//         sharding: { type: "boolean", label: "Enable Horizontal Sharding", default: false }
//       }
//     },
//     // NEW: Geo-Spatial Database (Uses Database Icon)
//     {
//       name: 'Geo-Spatial DB',
//       type: 'DATABASE',
//       iconUrl: '/assets/icons/database.svg', // Reusing database icon
//       documentationUrl: 'https://docs.example.com/geospatial',
//       metadata: {
//         engine: {
//           label: "Geo-Spatial Engine",
//           options: ["PostGIS", "ElasticSearch Geo", "MongoDB Geo"],
//           required: true
//         },
//         nodes: {
//           write_nodes: { type: "number", label: "Write Nodes (Master/Primary)", default: 1, required: true, cost_factor: 60.00 },
//           read_replicas: { type: "number", label: "Read Replicas", default: 1, required: true, cost_factor: 40.00 }
//         },
//         index_type: { label: "Indexing Strategy", options: ["Geohash", "R-Tree", "Quadtree"] }
//       }
//     },
//     {
//       name: 'Cache',
//       type: 'CACHE',
//       iconUrl: '/assets/icons/cache.svg',
//       documentationUrl: 'https://docs.example.com/cache',
//       metadata: {
//         engine: {
//           label: "Cache Engine",
//           options: ["Redis", "Memcached"],
//           required: true
//         },
//         cluster_mode: {
//           label: "Cluster Mode",
//           options: ["Single Node", "Replicated (HA)", "Clustered (Sharded)"],
//           required: true
//         },
//         memory_gb: { type: "number", label: "Cache Size (GB)", default: 5, required: true, cost_factor: 0.50 }, // Memory cost per GB
//         eviction_policy: {
//           label: "Eviction Policy",
//           options: ["LRU", "FIFO", "LFU"]
//         },
//         data_persistence: { type: "boolean", label: "Enable Persistence (RDB/AOF)", default: false }
//       }
//     },
//     {
//       name: 'Object Storage',
//       type: 'STORAGE',
//       iconUrl: '/assets/icons/bucket.svg',
//       documentationUrl: 'https://docs.example.com/storage',
//       metadata: {
//         access_tier: {
//           label: "Access Tier",
//           options: ["Standard", "Infrequent Access", "Archive"],
//           required: true
//         },
//         estimated_size_tb: { type: "number", label: "Estimated Size (TB)", default: 1, required: true, cost_factor: 20.00 } // Storage cost per TB
//       }
//     },
//     {
//       name: 'Block Storage',
//       type: 'STORAGE',
//       iconUrl: '/assets/icons/hard-drive.svg',
//       documentationUrl: 'https://docs.example.com/hard-drive',
//       metadata: {
//         volume_size_gb: { type: "number", label: "Volume Size (GB)", default: 50, required: true, cost_factor: 0.15 },
//         encrypted: { type: "boolean", label: "Enable Encryption", default: true }
//       }
//     },

//     // --- 3. Networking (UPDATED CONFIGURATION) ---
//     {
//       name: 'Load Balancer',
//       type: 'NETWORKING',
//       iconUrl: '/assets/icons/load-balancer.svg',
//       documentationUrl: 'https://docs.example.com/load-balancer',
//       metadata: {
//         type: {
//           label: "Load Balancer Type",
//           options: ["Application (L7)", "Network (L4)"],
//           required: true
//         },
//         multi_az: { type: "boolean", label: "Multi-AZ Enabled", default: true },
//         rate_limiting_rps: { type: "number", label: "Max RPS Threshold", default: 1000, cost_factor: 0.001 } // Cost per 1k req
//       }
//     },
//     {
//       name: 'API Gateway',
//       type: 'NETWORKING',
//       iconUrl: '/assets/icons/api-gateway.svg',
//       documentationUrl: 'https://docs.example.com/api-gateway',
//       metadata: {
//         authentication: {
//           label: "Authentication Type",
//           options: ["None", "API Key", "OAuth2"],
//           required: true
//         },
//         caching_enabled: { type: "boolean", label: "Enable Edge Caching", default: false }
//       }
//     },
//     {
//       name: 'CDN',
//       type: 'NETWORKING',
//       iconUrl: '/assets/icons/cdn.svg',
//       documentationUrl: 'https://docs.example.com/cdn',
//       metadata: {
//         caching_policy: {
//           label: "Caching Policy",
//           options: ["Default TTL", "Aggressive (Long TTL)", "No Cache"],
//           required: true
//         },
//         geo_distribution: {
//           label: "Geo Distribution",
//           options: ["Regional", "Global"],
//           required: true
//         },
//         cache_hit_ratio_target: { type: "number", label: "Target Hit Ratio (%)", default: 80 }
//       }
//     },
//     {
//       name: 'DNS',
//       type: 'NETWORKING',
//       iconUrl: '/assets/icons/dns.svg',
//       documentationUrl: 'https://docs.example.com/dns',
//       metadata: {
//         record_types: {
//           label: "Supported Record Types",
//           options: ["A", "AAAA", "CNAME", "TXT", "MX"]
//         }
//       }
//     },

//     // --- 4. Messaging & Other (UPDATED CONFIGURATION) ---
//     {
//       name: 'Message Queue',
//       type: 'MESSAGING',
//       iconUrl: '/assets/icons/http-que.svg',
//       documentationUrl: 'https://docs.example.com/queue',
//       metadata: {
//         engine: {
//           label: "Queue Engine",
//           options: ["Amazon SQS", "RabbitMQ", "Kafka/Kinesis"], // Combine stream into this dropdown
//           required: true
//         },
//         configs: {
//           "Kafka/Kinesis": {
//             partitions: { type: "number", label: "Partitions/Shards", default: 10, required: true, cost_factor: 5.00 }, // Cost per partition
//             replication_factor: { type: "number", label: "Replication Factor", default: 3, required: true }
//           },
//           "Amazon SQS": {
//             type: { label: "Queue Type", options: ["Standard", "FIFO"], required: true },
//             retention_days: { type: "number", label: "Message Retention (Days)", default: 4 }
//           }
//         }
//       }
//     },
//     {
//       name: 'Event Bus',
//       type: 'MESSAGING',
//       iconUrl: '/assets/icons/event-bus.svg',
//       documentationUrl: 'https://docs.example.com/event-bus',
//       metadata: {
//         mode: {
//           label: "Mode",
//           options: ["Fanout", "Direct", "Topic"]
//         }
//       }
//     },
//     {
//       name: 'Security',
//       type: 'SECURITY',
//       iconUrl: '/assets/icons/shield.svg',
//       documentationUrl: 'https://docs.example.com/security',
//       metadata: {
//         firewall: {
//           label: "Firewall Enabled",
//           type: "boolean",
//           default: true
//         }
//       }
//     },
//     {
//       name: 'Monitoring',
//       type: 'MONITORING',
//       iconUrl: '/assets/icons/graph.svg',
//       documentationUrl: 'https://docs.example.com/monitoring',
//       metadata: {
//         alerting: {
//           label: "Alerting Enabled",
//           type: "boolean",
//           default: true
//         }
//       }
//     }
//   ];

//   for (const component of components) {
//     await prisma.component.upsert({
//       where: { name: component.name },
//       update: component,
//       create: component,
//     });
//   }

//   console.log('Seeding of Component table finished.');
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });


// // prisma/seed.ts
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// async function main() {
//   console.log('Start seeding Component table...');

//   const components = [
//     // Compute & Server
//     {
//       name: 'Server',
//       type: 'COMPUTE',
//       iconUrl: '/assets/icons/server.svg',
//       documentationUrl: 'https://docs.example.com/server',
//       metadata: {
//         instance: {
//           label: "Instance Type",
//           options: ["t2.micro", "m5.large", "c5.xlarge"],
//           configs: {
//             "t2.micro": { cpu: 1, memory_gb: 1 },
//             "m5.large": { cpu: 2, memory_gb: 8 },
//             "c5.xlarge": { cpu: 4, memory_gb: 8 }
//           }
//         },
//         scaling_policy: {
//           label: "Scaling Policy",
//           min: 1,
//           max: 3
//         }
//       }
//     },
//     {
//       name: 'Client',
//       type: 'COMPUTE',
//       iconUrl: '/assets/icons/client.svg',
//       documentationUrl: 'https://docs.example.com/client',
//       metadata: {
//         platform: {
//           label: "Platform",
//           options: ["Web", "Mobile", "Desktop"]
//         }
//       }
//     },
//     {
//       name: 'Kubernetes Cluster',
//       type: 'COMPUTE',
//       iconUrl: '/assets/icons/kubernetes.svg',
//       documentationUrl: 'https://docs.kubernetes.io/',
//       metadata: {
//         node_config: {
//           label: "Node Configuration",
//           node_count: { type: "number", label: "Number of Nodes", default: 3 },
//           node_type: {
//             label: "Node Instance Type",
//             options: ["m5.large", "m5.xlarge", "c5.2xlarge"]
//           }
//         }
//       }
//     },
//     {
//       name: 'Microservice',
//       type: 'COMPUTE',
//       iconUrl: '/assets/icons/service.svg',
//       documentationUrl: 'https://docs.example.com/microservices',
//       metadata: {
//         language: {
//           label: "Programming Language",
//           options: ["Node.js", "Python", "Go", "Java"]
//         }
//       }
//     },

//     // Databases & Storage
//     {
//       name: 'Database',
//       type: 'DATABASE',
//       iconUrl: '/assets/icons/database.svg',
//       documentationUrl: 'https://docs.example.com/database',
//       metadata: {
//         type: {
//           label: "Database Type",
//           options: ["SQL", "NoSQL"],
//           sub_options: {
//             SQL: {
//               label: "SQL Engine",
//               options: ["PostgreSQL", "MySQL", "SQLite"],
//               configs: {
//                 PostgreSQL: {
//                   storage_gb: { type: "number", label: "Storage (GB)", default: 100 },
//                   replication: { type: "dropdown", label: "Replication", options: ["Single Instance", "Read Replicas"] }
//                 }
//               }
//             },
//             NoSQL: {
//               label: "NoSQL Type",
//               options: ["Document DB", "Graph DB"],
//               configs: {
//                 "Document DB": {
//                   storage_gb: { type: "number", label: "Storage (GB)", default: 50 },
//                   sharding: { type: "boolean", label: "Enable Sharding", default: false }
//                 }
//               }
//             }
//           }
//         }
//       }
//     },
//     {
//       name: 'Cache',
//       type: 'CACHE',
//       iconUrl: '/assets/icons/cache.svg',
//       documentationUrl: 'https://docs.example.com/cache',
//       metadata: {
//         engine: {
//           label: "Cache Engine",
//           options: ["Redis", "Memcached"]
//         },
//         eviction_policy: {
//           label: "Eviction Policy",
//           options: ["LRU", "FIFO", "LFU"]
//         }
//       }
//     },
//     {
//       name: 'Object Storage',
//       type: 'STORAGE',
//       iconUrl: '/assets/icons/bucket.svg',
//       documentationUrl: 'https://docs.example.com/storage',
//       metadata: {
//         access_tier: {
//           label: "Access Tier",
//           options: ["Standard", "Infrequent Access", "Archive"]
//         }
//       }
//     },
//     {
//       name: 'Block Storage',
//       type: 'STORAGE',
//       iconUrl: '/assets/icons/hard-drive.svg',
//       documentationUrl: 'https://docs.example.com/hard-drive',
//       metadata: {
//         volume_size_gb: { type: "number", label: "Volume Size (GB)", default: 50 },
//         encrypted: { type: "boolean", label: "Enable Encryption", default: true }
//       }
//     },

//     // Networking
//     {
//       name: 'Load Balancer',
//       type: 'NETWORKING',
//       iconUrl: '/assets/icons/load-balancer.svg',
//       documentationUrl: 'https://docs.example.com/load-balancer',
//       metadata: {
//         protocol: {
//           label: "Protocol",
//           options: ["HTTP", "HTTPS", "TCP"]
//         },
//         health_check: {
//           label: "Health Check Path",
//           type: "string",
//           default: "/health"
//         }
//       }
//     },
//     {
//       name: 'API Gateway',
//       type: 'NETWORKING',
//       iconUrl: '/assets/icons/api-gateway.svg',
//       documentationUrl: 'https://docs.example.com/api-gateway',
//       metadata: {
//         authentication: {
//           label: "Authentication Type",
//           options: ["None", "API Key", "OAuth2"]
//         }
//       }
//     },
//     {
//       name: 'CDN',
//       type: 'NETWORKING',
//       iconUrl: '/assets/icons/cdn.svg',
//       documentationUrl: 'https://docs.example.com/cdn',
//       metadata: {
//         caching_policy: {
//           label: "Caching Policy",
//           options: ["Default", "Aggressive", "Custom"]
//         }
//       }
//     },
//     {
//       name: 'DNS',
//       type: 'NETWORKING',
//       iconUrl: '/assets/icons/dns.svg',
//       documentationUrl: 'https://docs.example.com/dns',
//       metadata: {
//         record_types: {
//           label: "Supported Record Types",
//           options: ["A", "AAAA", "CNAME", "TXT", "MX"]
//         }
//       }
//     },

//     // Messaging & Other
//     {
//       name: 'Message Queue',
//       type: 'MESSAGING',
//       iconUrl: '/assets/icons/http-que.svg',
//       documentationUrl: 'https://docs.example.com/queue',
//       metadata: {
//         engine: {
//           label: "Queue Engine",
//           options: ["RabbitMQ", "Kafka", "Amazon SQS"]
//         }
//       }
//     },
//     {
//       name: 'Event Bus',
//       type: 'MESSAGING',
//       iconUrl: '/assets/icons/event-bus.svg',
//       documentationUrl: 'https://docs.example.com/event-bus',
//       metadata: {
//         mode: {
//           label: "Mode",
//           options: ["Fanout", "Direct", "Topic"]
//         }
//       }
//     },
//     {
//       name: 'Security',
//       type: 'SECURITY',
//       iconUrl: '/assets/icons/shield.svg',
//       documentationUrl: 'https://docs.example.com/security',
//       metadata: {
//         firewall: {
//           label: "Firewall Enabled",
//           type: "boolean",
//           default: true
//         }
//       }
//     },
//     {
//       name: 'Monitoring',
//       type: 'MONITORING',
//       iconUrl: '/assets/icons/graph.svg',
//       documentationUrl: 'https://docs.example.com/monitoring',
//       metadata: {
//         alerting: {
//           label: "Alerting Enabled",
//           type: "boolean",
//           default: true
//         }
//       }
//     }
//   ];

//   for (const component of components) {
//     await prisma.component.upsert({
//       where: { name: component.name },
//       update: component,
//       create: component,
//     });
//   }

//   console.log('Seeding of Component table finished.');
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });


// import { PrismaClient, Difficulty } from '@prisma/client';

// const prisma = new PrismaClient();

// async function main() {
//   console.log('Start seeding Problem table...');

//   const problems = [
//     {
//       title: 'Design a URL Shortener Service',
//       difficulty: Difficulty.EASY,
//       requirements: {
//         description: 'Design a URL shortening service like bit.ly that converts long URLs into short, easy-to-share links. The service should handle URL creation, retrieval, and analytics.',
//         functional_requirements: [
//           'Users can submit a long URL and receive a short URL',
//           'When users visit the short URL, they are redirected to the original URL',
//           'Track the number of clicks for each short URL',
//           'Short URLs should be unique and not expire',
//           'API endpoints for creating and retrieving URLs'
//         ],
//         non_functional_requirements: [
//           'High availability (99.9% uptime)',
//           'Low latency for redirects (< 100ms)',
//           'Scalable to handle millions of URLs',
//           'Handle 1000 requests per second'
//         ],
//         scale: '10 million URLs stored, 1000 reads per second, 100 writes per second',
//         constraints: [
//           'Short URLs should be 6-8 characters long',
//           'System should prevent duplicate short URLs',
//           'Must handle concurrent requests safely'
//         ]
//       }
//     },
//     {
//       title: 'Design a Real-Time Chat Application',
//       difficulty: Difficulty.MEDIUM,
//       requirements: {
//         description: 'Design a real-time chat application similar to WhatsApp or Slack that supports one-on-one messaging, group chats, and online status indicators.',
//         functional_requirements: [
//           'Users can send and receive messages in real-time',
//           'Support for one-on-one and group conversations',
//           'Display online/offline status of users',
//           'Message history persistence',
//           'Support for text messages and file attachments',
//           'Read receipts and typing indicators'
//         ],
//         non_functional_requirements: [
//           'Messages should be delivered within 1 second',
//           'System should handle millions of concurrent users',
//           'Data should be encrypted in transit and at rest',
//           'High availability with no single point of failure',
//           '99.99% uptime'
//         ],
//         scale: '50 million active users, 10 million concurrent connections, 1 billion messages per day',
//         constraints: [
//           'Maximum message size: 10KB',
//           'Maximum file attachment size: 50MB',
//           'Group chat limit: 500 members',
//           'Message retention: 1 year'
//         ]
//       }
//     },
//     {
//       title: 'Design a Video Streaming Platform',
//       difficulty: Difficulty.HARD,
//       requirements: {
//         description: 'Design a video streaming platform like YouTube or Netflix that allows users to upload, store, process, and stream videos at scale with adaptive bitrate streaming.',
//         functional_requirements: [
//           'Users can upload videos of various formats and sizes',
//           'System transcodes videos to multiple resolutions (360p, 720p, 1080p, 4K)',
//           'Users can search and discover videos',
//           'Streaming with adaptive bitrate based on network conditions',
//           'Support for live streaming',
//           'Video recommendations based on user preferences',
//           'Comments and likes functionality',
//           'View count tracking and analytics'
//         ],
//         non_functional_requirements: [
//           'Low latency video playback (< 2 seconds to start)',
//           'Support for millions of concurrent viewers',
//           'High bandwidth efficiency',
//           '99.95% availability',
//           'Global content delivery with low latency',
//           'Handle peak traffic during viral events'
//         ],
//         scale: '100 million daily active users, 500,000 videos uploaded daily, 10 petabytes of storage, 1 billion video views per day',
//         constraints: [
//           'Maximum video upload size: 10GB',
//           'Maximum video length: 12 hours',
//           'Support for 4K resolution streaming',
//           'Video processing should complete within 30 minutes for 1-hour videos',
//           'Must support major video formats (MP4, AVI, MOV, etc.)'
//         ]
//       }
//     },
//     {
//       title: 'Design a Ride-Sharing Application',
//       difficulty: Difficulty.MEDIUM,
//       requirements: {
//         description: 'Design a ride-sharing platform like Uber or Lyft that connects riders with drivers in real-time, handles location tracking, fare calculation, and payment processing.',
//         functional_requirements: [
//           'Riders can request rides and see nearby available drivers',
//           'Drivers can accept or decline ride requests',
//           'Real-time location tracking for both riders and drivers',
//           'Estimated time of arrival (ETA) calculation',
//           'Dynamic pricing based on demand and supply',
//           'In-app payment processing',
//           'Rating system for drivers and riders',
//           'Trip history and receipts'
//         ],
//         non_functional_requirements: [
//           'Real-time updates with < 1 second latency',
//           'High availability during peak hours',
//           'Accurate location tracking within 10 meters',
//           'Handle millions of concurrent users',
//           'Fault tolerant system with no data loss'
//         ],
//         scale: '10 million daily active users, 1 million concurrent ride requests, 500,000 active drivers',
//         constraints: [
//           'Location updates every 5 seconds',
//           'Maximum wait time for driver matching: 30 seconds',
//           'Support for multiple payment methods',
//           'Must handle surge pricing during peak hours'
//         ]
//       }
//     },
//     {
//       title: 'Design a Social Media News Feed',
//       difficulty: Difficulty.HARD,
//       requirements: {
//         description: 'Design a social media news feed system like Facebook or Twitter that displays personalized content to users based on their connections, interactions, and preferences.',
//         functional_requirements: [
//           'Users can create posts (text, images, videos)',
//           'Users can follow/unfollow other users',
//           'Generate personalized feed based on user interests',
//           'Support for likes, comments, and shares',
//           'Real-time notifications for interactions',
//           'Trending topics and hashtags',
//           'Content moderation and filtering'
//         ],
//         non_functional_requirements: [
//           'Feed should load within 2 seconds',
//           'Handle billions of posts',
//           'Real-time updates for new content',
//           'Personalization algorithm should run efficiently',
//           '99.9% availability',
//           'Low latency for global users'
//         ],
//         scale: '1 billion monthly active users, 100 million daily active users, 500 million posts per day',
//         constraints: [
//           'Maximum post length: 5000 characters',
//           'Maximum image size: 20MB',
//           'Feed should show posts from last 7 days by default',
//           'Personalization should consider last 30 days of activity'
//         ]
//       }
//     }
//   ];

//   for (const problem of problems) {
//     // Check if problem already exists by title (since title is not @unique)
//     const existing = await prisma.problem.findFirst({
//       where: { title: problem.title },
//     });

//     if (!existing) {
//       await prisma.problem.create({
//         data: {
//           title: problem.title,
//           difficulty: problem.difficulty,
//           requirements: problem.requirements,
//           isDeleted: false,
//         },
//       });
//       console.log(`Created problem: ${problem.title}`);
//     } else {
//       console.log(`Problem already exists: ${problem.title}`);
//     }
//   }

//   console.log('Seeding of Problem table finished.');
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });