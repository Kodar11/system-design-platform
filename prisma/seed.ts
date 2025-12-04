// prisma/seed.ts

const { PrismaClient, Difficulty } = require('@prisma/client');

const prisma = new PrismaClient();


// --- 3. PROBLEM SEEDING FUNCTION ---
async function seedProblems() {
  console.log('Start seeding Problem table...');

  // Interface removed to prevent TS-NODE syntax error. Data structure remains JSON.

  const problems = [
    {
      title: 'Design a Distributed ID Generation System',
      difficulty: Difficulty.HARD,

      initialRequirementsQa: [
        { Q: 'Do IDs need strict global monotonicity?', A: 'No — rough time ordering is enough.' },
        { Q: 'Can we use UUIDv4?', A: 'No — they are not numeric, not sortable and index poorly.' },
        { Q: 'Must the solution work after a restart?', A: 'Yes, persistence or recovery must exist.' }
      ],

      interviewQuestions: [
        {
          Q: 'Explain why UUIDs, auto-increment DB IDs, and central ID services are problematic at scale.',
          IdealA: 'UUIDs lack ordering and are expensive for indexing. DB auto-increment becomes a bottleneck and SPOF. Centralized ID services create latency and reliability risk unless replicated with consensus.'
        },
        {
          Q: 'Design your 64-bit ID bit allocation and justify each part.',
          IdealA: 'Example: 41 bits timestamp, 10 bits machine id, 12 bits sequence. Timestamp ensures time ordering, machine ID avoids collisions, and sequence handles per-millisecond concurrency.'
        },
        {
          Q: 'How do you handle clock skew?',
          IdealA: 'Never allow clock to go backward. If detected, pause ID generation until time catches up. Use NTP/Chrony to keep clocks aligned.'
        }
      ],

      requirements: {
        description:
          'You must design a globally distributed ID generator that produces unique, numeric, sortable identifiers without relying on a single central bottleneck.',

        functional_requirements: [
          'Generate IDs for write-heavy workloads',
          'Each ID must be globally unique',
          'IDs must encode time ordering (rough ordering is acceptable)',
          'System must continue generating IDs even if machines restart'
        ],

        non_functional_requirements: [
          'System throughput: 10,000+ IDs/sec minimum',
          'IDs must fit within 64 bits',
          'System must support multi-region deployment',
          'No single point of failure allowed'
        ],

        constraints: [
          'Strict global monotonic ordering is not required',
          'UUIDs are NOT allowed',
          'Time skew between servers is expected',
          'Database cannot be a single dependency for every ID request'
        ],

        scale_assumptions: {
          expected_rps: 10000,
          regions: 3,
          machines: 50
        }
      },

      components: [
        {
          name: 'Client',
          icon: 'client.svg',
          type: 'ACTOR',
          metadata: {}
        },
        {
          name: 'ID Generator Service',
          icon: 'service.svg',
          type: 'COMPUTE',
          metadata: {
            bit_allocation: {
              label: 'Bit Allocation (Total must be 64)',
              fields: [
                { key: 'timestamp_bits', label: 'Timestamp Bits', type: 'number', placeholder: 'e.g., 41' },
                { key: 'machine_bits', label: 'Machine ID Bits', type: 'number', placeholder: 'e.g., 10' },
                { key: 'sequence_bits', label: 'Sequence Bits', type: 'number', placeholder: 'e.g., 12' }
              ]
            },
            persistence_strategy: {
              label: 'Crash Recovery Strategy',
              options: [
                'Batch Persistence',
                'No Persistence (Risky)',
                'Database-backed Sequence Reset',
                'Filesystem Local Counter'
              ]
            }
          }
        },
        {
          name: 'Time Sync System',
          icon: 'clock.svg',
          type: 'INFRA',
          metadata: {
            type: {
              label: 'Synchronization Method',
              options: ['NTP', 'Chrony', 'Hybrid', 'None (Bad Choice)']
            }
          }
        },
        {
          name: 'Database (Optional)',
          icon: 'database.svg',
          type: 'STORAGE',
          metadata: {
            usage: {
              label: 'Usage',
              options: [
                'Batch Allocation',
                'Shard-Aware Stored Procedure (Instagram style)',
                'Not Used'
              ]
            }
          }
        },
        {
          name: 'Message Bus (Optional)',
          icon: 'queue.svg',
          type: 'MESSAGING',
          metadata: {
            role: {
              label: 'Use Case',
              options: ['Replication', 'Heartbeat/Broadcast Machine IDs', 'Not Used']
            }
          }
        },
        {
          name: 'Text Block',
          icon: 'text.svg',
          type: 'ANNOTATION',
          metadata: {
            placeholder: 'Write reasoning here...'
          }
        }
      ],

      starterDiagram: {
  "nodes": [
    {
      "id": "1764773826402",
      "type": "component",
      "position": {
        "x": 285,
        "y": 225
      },
      "data": {
        "originalType": "INFRA",
        "componentId": "Time Sync System",
        "label": "Time Sync System",
        "iconUrl": "/assets/icons/INFRA.svg",
        "metadata": {
          "type": {
            "label": "Synchronization Method",
            "options": [
              "NTP",
              "Chrony",
              "Hybrid",
              "None (Bad Choice)"
            ]
          }
        },
        "type": "Hybrid"
      },
      "width": 108,
      "height": 96,
      "selected": false,
      "dragging": false,
      "positionAbsolute": {
        "x": 285,
        "y": 225
      }
    },
    {
      "id": "1764825249880",
      "type": "component",
      "position": {
        "x": 285,
        "y": 30
      },
      "data": {
        "originalType": "COMPUTE",
        "componentId": "ID Generator Service",
        "label": "ID Generator Service",
        "iconUrl": "/assets/icons/COMPUTE.svg",
        "metadata": {
          "bit_allocation": {
            "label": "Bit Allocation (Total must be 64)",
            "fields": [
              {
                "key": "timestamp_bits",
                "type": "number",
                "label": "Timestamp Bits",
                "placeholder": "e.g., 41"
              },
              {
                "key": "machine_bits",
                "type": "number",
                "label": "Machine ID Bits",
                "placeholder": "e.g., 10"
              },
              {
                "key": "sequence_bits",
                "type": "number",
                "label": "Sequence Bits",
                "placeholder": "e.g., 12"
              }
            ]
          },
          "persistence_strategy": {
            "label": "Crash Recovery Strategy",
            "options": [
              "Batch Persistence",
              "No Persistence (Risky)",
              "Database-backed Sequence Reset",
              "Filesystem Local Counter"
            ]
          }
        }
      },
      "width": 108,
      "height": 116,
      "selected": false,
      "dragging": false,
      "positionAbsolute": {
        "x": 285,
        "y": 30
      }
    },
    {
      "id": "1764825287516",
      "type": "component",
      "position": {
        "x": 45,
        "y": 45
      },
      "data": {
        "originalType": "ACTOR",
        "componentId": "Client",
        "label": "Client",
        "iconUrl": "/assets/icons/ACTOR.svg",
        "metadata": {}
      },
      "width": 100,
      "height": 76,
      "selected": false,
      "positionAbsolute": {
        "x": 45,
        "y": 45
      },
      "dragging": false
    },
    {
      "id": "1764825420363",
      "type": "component",
      "position": {
        "x": 510,
        "y": -60
      },
      "data": {
        "originalType": "STORAGE",
        "componentId": "Database (Optional)",
        "label": "Database (Optional)",
        "iconUrl": "/assets/icons/STORAGE.svg",
        "metadata": {
          "usage": {
            "label": "Usage",
            "options": [
              "Batch Allocation",
              "Shard-Aware Stored Procedure (Instagram style)",
              "Not Used"
            ]
          }
        }
      },
      "width": 108,
      "height": 96,
      "selected": false,
      "positionAbsolute": {
        "x": 510,
        "y": -60
      },
      "dragging": false
    },
    {
      "id": "1764825423143",
      "type": "component",
      "position": {
        "x": 510,
        "y": 120
      },
      "data": {
        "originalType": "MESSAGING",
        "componentId": "Message Bus (Optional)",
        "label": "Message Bus (Optional)",
        "iconUrl": "/assets/icons/MESSAGING.svg",
        "metadata": {
          "role": {
            "label": "Use Case",
            "options": [
              "Replication",
              "Heartbeat/Broadcast Machine IDs",
              "Not Used"
            ]
          }
        },
        "role": "Heartbeat/Broadcast Machine IDs"
      },
      "width": 108,
      "height": 116,
      "selected": false,
      "positionAbsolute": {
        "x": 510,
        "y": 120
      },
      "dragging": false
    }
  ],
  "edges": [
    {
      "source": "1764825249880",
      "sourceHandle": "bottom-out",
      "target": "1764773826402",
      "targetHandle": "top-in",
      "type": "step",
      "animated": false,
      "style": {},
      "id": "reactflow__edge-1764825249880bottom-out-1764773826402top-in"
    },
    {
      "source": "1764825287516",
      "sourceHandle": "right-out",
      "target": "1764825249880",
      "targetHandle": "left-in",
      "type": "step",
      "animated": false,
      "style": {},
      "id": "reactflow__edge-1764825287516right-out-1764825249880left-in"
    },
    {
      "source": "1764825249880",
      "sourceHandle": "right-out",
      "target": "1764825420363",
      "targetHandle": "left-in",
      "type": "step",
      "animated": false,
      "style": {},
      "id": "reactflow__edge-1764825249880right-out-1764825420363left-in"
    },
    {
      "source": "1764825249880",
      "sourceHandle": "right-out",
      "target": "1764825423143",
      "targetHandle": "left-in",
      "type": "step",
      "animated": false,
      "style": {},
      "id": "reactflow__edge-1764825249880right-out-1764825423143left-in"
    }
  ],
  "viewport": {
    "x": 324.6560012284583,
    "y": 197.34772039864373,
    "zoom": 0.92587471228729
  }
},

      evaluationTargets: {
        mustHaveComponents: ['ID Generator Service', 'Time Sync System'],
        mustConfigureBitAllocation: true,
        mustJustifyPersistenceStrategy: true,
        scoringWeights: {
          architectureCorrectness: 40,
          bitAllocationQuality: 30,
          reasoningQuality: 30
        }
      }
    }

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
      components: problem.components || null,
      starterDiagram: problem.starterDiagram || null,
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




// --- MAIN EXECUTION ---
async function main() {
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