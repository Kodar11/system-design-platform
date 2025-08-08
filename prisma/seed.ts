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
      metadata: { instance_types: ['m5.large', 'c5.xlarge'], scaling_policy: { min: 1, max: 3 } },
    },
    {
      name: 'Client',
      type: 'COMPUTE',
      iconUrl: '/assets/icons/client.svg',
      documentationUrl: 'https://docs.example.com/client',
      metadata: {},
    },
    {
      name: 'Kubernetes Cluster',
      type: 'COMPUTE',
      iconUrl: '/assets/icons/kubernetes.svg',
      documentationUrl: 'https://docs.kubernetes.io/',
      metadata: { node_count: 3, node_type: 'm5.xlarge' },
    },
    {
      name: 'Microservice',
      type: 'COMPUTE',
      iconUrl: '/assets/icons/service.svg',
      documentationUrl: 'https://docs.example.com/microservices',
      metadata: {},
    },
    // Databases & Storage
    {
      name: 'Database',
      type: 'DATABASE',
      iconUrl: '/assets/icons/database.svg',
      documentationUrl: 'https://docs.example.com/database',
      metadata: { engines: ['PostgreSQL', 'MongoDB'], default_engine: 'PostgreSQL', storage_gb: 100 },
    },
    {
      name: 'Cache',
      type: 'CACHE',
      iconUrl: '/assets/icons/cache.svg',
      documentationUrl: 'https://docs.example.com/cache',
      metadata: { types: ['Redis', 'Memcached'] },
    },
    {
      name: 'Object Storage',
      type: 'STORAGE',
      iconUrl: '/assets/icons/bucket.svg',
      documentationUrl: 'https://docs.example.com/storage',
      metadata: { access_tiers: ['Standard', 'Infrequent Access'] },
    },
    {
      name: 'Block Storage',
      type: 'STORAGE',
      iconUrl: '/assets/icons/hard-drive.svg',
      documentationUrl: 'https://docs.example.com/hard-drive',
      metadata: { volume_size_gb: 50 },
    },
    // Networking
    {
      name: 'Load Balancer',
      type: 'NETWORKING',
      iconUrl: '/assets/icons/load-balancer.svg',
      documentationUrl: 'https://docs.example.com/load-balancer',
      metadata: { rules: [] },
    },
    {
      name: 'API Gateway',
      type: 'NETWORKING',
      iconUrl: '/assets/icons/api-gateway.svg',
      documentationUrl: 'https://docs.example.com/api-gateway',
      metadata: { endpoints: [] },
    },
    {
      name: 'CDN',
      type: 'NETWORKING',
      iconUrl: '/assets/icons/cdn.svg',
      documentationUrl: 'https://docs.example.com/cdn',
      metadata: { caching_policy: 'default' },
    },
    {
      name: 'DNS',
      type: 'NETWORKING',
      iconUrl: '/assets/icons/dns.svg',
      documentationUrl: 'https://docs.example.com/dns',
      metadata: {},
    },
    // Messaging & Other
    {
      name: 'Message Queue',
      type: 'MESSAGING',
      iconUrl: '/assets/icons/message-queue.svg',
      documentationUrl: 'https://docs.example.com/queue',
      metadata: {},
    },
    {
      name: 'Event Bus',
      type: 'MESSAGING',
      iconUrl: '/assets/icons/event-bus.svg',
      documentationUrl: 'https://docs.example.com/event-bus',
      metadata: {},
    },
    {
      name: 'Security',
      type: 'SECURITY',
      iconUrl: '/assets/icons/shield.svg',
      documentationUrl: 'https://docs.example.com/security',
      metadata: {},
    },
    {
      name: 'Monitoring',
      type: 'MONITORING',
      iconUrl: '/assets/icons/graph.svg',
      documentationUrl: 'https://docs.example.com/monitoring',
      metadata: {},
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