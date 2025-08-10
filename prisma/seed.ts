// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding Component table...');

  const components = [
    // Compute & Server
    {
      name: 'Server',
      type: 'COMPUTE',
      iconUrl: '/assets/icons/server.svg',
      documentationUrl: 'https://docs.example.com/server',
      metadata: {
        instance: {
          label: "Instance Type",
          options: ["t2.micro", "m5.large", "c5.xlarge"],
          configs: {
            "t2.micro": { cpu: 1, memory_gb: 1 },
            "m5.large": { cpu: 2, memory_gb: 8 },
            "c5.xlarge": { cpu: 4, memory_gb: 8 }
          }
        },
        scaling_policy: {
          label: "Scaling Policy",
          min: 1,
          max: 3
        }
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
          node_count: { type: "number", label: "Number of Nodes", default: 3 },
          node_type: {
            label: "Node Instance Type",
            options: ["m5.large", "m5.xlarge", "c5.2xlarge"]
          }
        }
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

    // Databases & Storage
    {
      name: 'Database',
      type: 'DATABASE',
      iconUrl: '/assets/icons/database.svg',
      documentationUrl: 'https://docs.example.com/database',
      metadata: {
        type: {
          label: "Database Type",
          options: ["SQL", "NoSQL"],
          sub_options: {
            SQL: {
              label: "SQL Engine",
              options: ["PostgreSQL", "MySQL", "SQLite"],
              configs: {
                PostgreSQL: {
                  storage_gb: { type: "number", label: "Storage (GB)", default: 100 },
                  replication: { type: "dropdown", label: "Replication", options: ["Single Instance", "Read Replicas"] }
                }
              }
            },
            NoSQL: {
              label: "NoSQL Type",
              options: ["Document DB", "Graph DB"],
              configs: {
                "Document DB": {
                  storage_gb: { type: "number", label: "Storage (GB)", default: 50 },
                  sharding: { type: "boolean", label: "Enable Sharding", default: false }
                }
              }
            }
          }
        }
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
          options: ["Redis", "Memcached"]
        },
        eviction_policy: {
          label: "Eviction Policy",
          options: ["LRU", "FIFO", "LFU"]
        }
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
          options: ["Standard", "Infrequent Access", "Archive"]
        }
      }
    },
    {
      name: 'Block Storage',
      type: 'STORAGE',
      iconUrl: '/assets/icons/hard-drive.svg',
      documentationUrl: 'https://docs.example.com/hard-drive',
      metadata: {
        volume_size_gb: { type: "number", label: "Volume Size (GB)", default: 50 },
        encrypted: { type: "boolean", label: "Enable Encryption", default: true }
      }
    },

    // Networking
    {
      name: 'Load Balancer',
      type: 'NETWORKING',
      iconUrl: '/assets/icons/load-balancer.svg',
      documentationUrl: 'https://docs.example.com/load-balancer',
      metadata: {
        protocol: {
          label: "Protocol",
          options: ["HTTP", "HTTPS", "TCP"]
        },
        health_check: {
          label: "Health Check Path",
          type: "string",
          default: "/health"
        }
      }
    },
    {
      name: 'API Gateway',
      type: 'NETWORKING',
      iconUrl: '/assets/icons/api-gateway.svg',
      documentationUrl: 'https://docs.example.com/api-gateway',
      metadata: {
        authentication: {
          label: "Authentication Type",
          options: ["None", "API Key", "OAuth2"]
        }
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
          options: ["Default", "Aggressive", "Custom"]
        }
      }
    },
    {
      name: 'DNS',
      type: 'NETWORKING',
      iconUrl: '/assets/icons/dns.svg',
      documentationUrl: 'https://docs.example.com/dns',
      metadata: {
        record_types: {
          label: "Supported Record Types",
          options: ["A", "AAAA", "CNAME", "TXT", "MX"]
        }
      }
    },

    // Messaging & Other
    {
      name: 'Message Queue',
      type: 'MESSAGING',
      iconUrl: '/assets/icons/http-que.svg',
      documentationUrl: 'https://docs.example.com/queue',
      metadata: {
        engine: {
          label: "Queue Engine",
          options: ["RabbitMQ", "Kafka", "Amazon SQS"]
        }
      }
    },
    {
      name: 'Event Bus',
      type: 'MESSAGING',
      iconUrl: '/assets/icons/event-bus.svg',
      documentationUrl: 'https://docs.example.com/event-bus',
      metadata: {
        mode: {
          label: "Mode",
          options: ["Fanout", "Direct", "Topic"]
        }
      }
    },
    {
      name: 'Security',
      type: 'SECURITY',
      iconUrl: '/assets/icons/shield.svg',
      documentationUrl: 'https://docs.example.com/security',
      metadata: {
        firewall: {
          label: "Firewall Enabled",
          type: "boolean",
          default: true
        }
      }
    },
    {
      name: 'Monitoring',
      type: 'MONITORING',
      iconUrl: '/assets/icons/graph.svg',
      documentationUrl: 'https://docs.example.com/monitoring',
      metadata: {
        alerting: {
          label: "Alerting Enabled",
          type: "boolean",
          default: true
        }
      }
    }
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

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
