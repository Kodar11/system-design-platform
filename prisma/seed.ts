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


import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding Problem table...');

  const problems = [
    {
      title: 'Design a URL Shortener Service',
      difficulty: Difficulty.EASY,
      requirements: {
        description: 'Design a URL shortening service like bit.ly that converts long URLs into short, easy-to-share links. The service should handle URL creation, retrieval, and analytics.',
        functional_requirements: [
          'Users can submit a long URL and receive a short URL',
          'When users visit the short URL, they are redirected to the original URL',
          'Track the number of clicks for each short URL',
          'Short URLs should be unique and not expire',
          'API endpoints for creating and retrieving URLs'
        ],
        non_functional_requirements: [
          'High availability (99.9% uptime)',
          'Low latency for redirects (< 100ms)',
          'Scalable to handle millions of URLs',
          'Handle 1000 requests per second'
        ],
        scale: '10 million URLs stored, 1000 reads per second, 100 writes per second',
        constraints: [
          'Short URLs should be 6-8 characters long',
          'System should prevent duplicate short URLs',
          'Must handle concurrent requests safely'
        ]
      }
    },
    {
      title: 'Design a Real-Time Chat Application',
      difficulty: Difficulty.MEDIUM,
      requirements: {
        description: 'Design a real-time chat application similar to WhatsApp or Slack that supports one-on-one messaging, group chats, and online status indicators.',
        functional_requirements: [
          'Users can send and receive messages in real-time',
          'Support for one-on-one and group conversations',
          'Display online/offline status of users',
          'Message history persistence',
          'Support for text messages and file attachments',
          'Read receipts and typing indicators'
        ],
        non_functional_requirements: [
          'Messages should be delivered within 1 second',
          'System should handle millions of concurrent users',
          'Data should be encrypted in transit and at rest',
          'High availability with no single point of failure',
          '99.99% uptime'
        ],
        scale: '50 million active users, 10 million concurrent connections, 1 billion messages per day',
        constraints: [
          'Maximum message size: 10KB',
          'Maximum file attachment size: 50MB',
          'Group chat limit: 500 members',
          'Message retention: 1 year'
        ]
      }
    },
    {
      title: 'Design a Video Streaming Platform',
      difficulty: Difficulty.HARD,
      requirements: {
        description: 'Design a video streaming platform like YouTube or Netflix that allows users to upload, store, process, and stream videos at scale with adaptive bitrate streaming.',
        functional_requirements: [
          'Users can upload videos of various formats and sizes',
          'System transcodes videos to multiple resolutions (360p, 720p, 1080p, 4K)',
          'Users can search and discover videos',
          'Streaming with adaptive bitrate based on network conditions',
          'Support for live streaming',
          'Video recommendations based on user preferences',
          'Comments and likes functionality',
          'View count tracking and analytics'
        ],
        non_functional_requirements: [
          'Low latency video playback (< 2 seconds to start)',
          'Support for millions of concurrent viewers',
          'High bandwidth efficiency',
          '99.95% availability',
          'Global content delivery with low latency',
          'Handle peak traffic during viral events'
        ],
        scale: '100 million daily active users, 500,000 videos uploaded daily, 10 petabytes of storage, 1 billion video views per day',
        constraints: [
          'Maximum video upload size: 10GB',
          'Maximum video length: 12 hours',
          'Support for 4K resolution streaming',
          'Video processing should complete within 30 minutes for 1-hour videos',
          'Must support major video formats (MP4, AVI, MOV, etc.)'
        ]
      }
    },
    {
      title: 'Design a Ride-Sharing Application',
      difficulty: Difficulty.MEDIUM,
      requirements: {
        description: 'Design a ride-sharing platform like Uber or Lyft that connects riders with drivers in real-time, handles location tracking, fare calculation, and payment processing.',
        functional_requirements: [
          'Riders can request rides and see nearby available drivers',
          'Drivers can accept or decline ride requests',
          'Real-time location tracking for both riders and drivers',
          'Estimated time of arrival (ETA) calculation',
          'Dynamic pricing based on demand and supply',
          'In-app payment processing',
          'Rating system for drivers and riders',
          'Trip history and receipts'
        ],
        non_functional_requirements: [
          'Real-time updates with < 1 second latency',
          'High availability during peak hours',
          'Accurate location tracking within 10 meters',
          'Handle millions of concurrent users',
          'Fault tolerant system with no data loss'
        ],
        scale: '10 million daily active users, 1 million concurrent ride requests, 500,000 active drivers',
        constraints: [
          'Location updates every 5 seconds',
          'Maximum wait time for driver matching: 30 seconds',
          'Support for multiple payment methods',
          'Must handle surge pricing during peak hours'
        ]
      }
    },
    {
      title: 'Design a Social Media News Feed',
      difficulty: Difficulty.HARD,
      requirements: {
        description: 'Design a social media news feed system like Facebook or Twitter that displays personalized content to users based on their connections, interactions, and preferences.',
        functional_requirements: [
          'Users can create posts (text, images, videos)',
          'Users can follow/unfollow other users',
          'Generate personalized feed based on user interests',
          'Support for likes, comments, and shares',
          'Real-time notifications for interactions',
          'Trending topics and hashtags',
          'Content moderation and filtering'
        ],
        non_functional_requirements: [
          'Feed should load within 2 seconds',
          'Handle billions of posts',
          'Real-time updates for new content',
          'Personalization algorithm should run efficiently',
          '99.9% availability',
          'Low latency for global users'
        ],
        scale: '1 billion monthly active users, 100 million daily active users, 500 million posts per day',
        constraints: [
          'Maximum post length: 5000 characters',
          'Maximum image size: 20MB',
          'Feed should show posts from last 7 days by default',
          'Personalization should consider last 30 days of activity'
        ]
      }
    }
  ];

  for (const problem of problems) {
    // Check if problem already exists by title (since title is not @unique)
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
      console.log(`Problem already exists: ${problem.title}`);
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