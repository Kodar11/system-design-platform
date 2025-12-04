"use server";

import { prisma } from "@/lib/prisma/userService";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { NEXT_AUTH_CONFIG } from "@/lib/nextAuthConfig";
import Razorpay from "razorpay";
import crypto from 'crypto';
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";

interface RazorpaySubscription {
  id: string;
  entity: string;
  plan_id: string;
  status: string;
  quantity?: number;
  total_count?: number;
}

interface RazorpaySubscriptionCreateOptions {
  plan_id: string;
  customer_notify: 0 | 1;
  quantity: number;
  total_count: number;
}

interface RazorpayInstance {
  subscriptions: {
    create: (options: RazorpaySubscriptionCreateOptions) => Promise<RazorpaySubscription>;
  };
  orders?: {
    create: (options: { amount: number; currency: string; receipt: string; notes?: Record<string, string> }) => Promise<{ id: string; currency?: string }>;
  };
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
}) as RazorpayInstance;

type JsonCompatible = { [key: string]: JsonCompatible } | string | number | boolean | null | JsonCompatible[];

// --- AI CONFIGURATION ---
// Use the new SDK
import { GoogleGenAI, Type } from "@google/genai";



// Use the namespace for the class name
const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' });


// Add this complete function to your src/actions/actions.ts file (after the existing functions)

const evaluationSchema = {
    type: Type.OBJECT,
    properties: {
        score: { 
            type: Type.NUMBER, 
            description: "Overall score from 0-100 based on completeness, scalability, best practices, and requirement fulfillment" 
        },
        feedback: { 
            type: Type.STRING, 
            description: "Comprehensive feedback on the solution (4-6 paragraphs covering overall design, strengths, weaknesses, and specific recommendations)" 
        },
        strengths: {
            type: Type.ARRAY,
            description: "List of 3-5 specific strengths in the solution with technical details",
            items: { type: Type.STRING }
        },
        improvements: {
            type: Type.ARRAY,
            description: "List of 3-5 specific areas that need improvement with actionable suggestions",
            items: { type: Type.STRING }
        },
        component_analysis: {
            type: Type.STRING,
            description: "Detailed analysis of component choices, architecture patterns, and technology decisions (2-3 paragraphs)"
        },
        scalability_assessment: {
            type: Type.STRING,
            description: "In-depth assessment of scalability, bottlenecks, load handling, and performance considerations (2-3 paragraphs)"
        }
    },
    required: ["score", "feedback", "strengths", "improvements", "component_analysis", "scalability_assessment"]
};
// Add this interface at the top of your actions.ts file
interface NodeData {
    id: string;
    type?: string;
    position?: { x: number; y: number };
    data?: {
        label?: string;
        componentId?: string;
        metadata?: Record<string, unknown>;
    };
}

interface EdgeData {
    id: string;
    source: string;
    target: string;
    label?: string;
    type?: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    animated?: boolean;
    style?: React.CSSProperties;
}

interface DiagramData {
    nodes?: NodeData[];
    edges?: EdgeData[];
}

// Local type to represent Problem records that include the new JSON fields
interface ProblemWithComponents {
  id: string;
  title: string;
  requirements?: unknown;
  initialRequirementsQa?: unknown;
  interviewQuestions?: unknown;
  components?: unknown;
  starterDiagram?: { nodes?: unknown[]; edges?: unknown[] } | null;
  difficulty?: string;
  submissions?: unknown[];
}

// Updated submitProblemSolution function in src/app/actions.ts
// (Replace the existing function with this updated version)

interface SubmittedAnswer {
  question: string;
  answer: string;
}

interface TranscriptHistoryEntry {
  role: 'AI' | 'User';
  message: string;
  timestamp: number;
  context?: string;
}

/**
 * Submits a problem solution and evaluates it using AI
 * @param problemId The ID of the problem being solved
 * @param diagramData The diagram data containing nodes and edges
 * @param submittedAnswers Array of answers corresponding to interviewQuestions (practice mode)
 * @param transcriptHistory Full conversation transcript (mock interview mode)
 * @param interviewMode The mode used: 'practice' or 'mock'
 * @returns The submission ID to redirect to the result page
 */
export async function submitProblemSolution(
  problemId: string,
  diagramData: DiagramData,
  databaseSchema?: unknown,
  submittedAnswers: string[] = [],
  transcriptHistory?: TranscriptHistoryEntry[],
  interviewMode?: 'practice' | 'mock'
): Promise<string> {
  const session = await getServerSession(NEXT_AUTH_CONFIG);
  if (!session?.user?.id) {
    throw new Error("Unauthorized - Please log in to submit solutions");
  }

  // 1. Validate input
  if (!problemId || !diagramData) {
    throw new Error("Missing required data: problemId and diagramData are required");
  }

  // Validate submitted answers length (optional, but ensure it's an array)
  if (!Array.isArray(submittedAnswers)) {
    submittedAnswers = [];
  }

  // 2. Get the problem from database
  const problemRaw = (await prisma.problem.findUnique({
    where: { id: problemId, isDeleted: false },
  })) as any;

  if (!problemRaw) {
    throw new Error("Problem not found or has been deleted");
  }

  const problem = problemRaw as ProblemWithComponents;

  // Enforce credit checks server-side: user must have credits for the chosen mode
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) {
    throw new Error("User not found");
  }
  // Check for available credits either from daily allotment (P1) or purchased packs (P2)
  // If neither P1 nor P2 has available credits, block the submission.
  const now = new Date();
  const hasDaily = interviewMode === 'mock' ? (dbUser.subscriptionStatus === 'PRO' && dbUser.dailyDesignCredits > 0)
                                             : (dbUser.subscriptionStatus === 'PRO' && dbUser.dailyProblemCredits > 0);

  // Sum up unexpired purchased credits (P2) stored on the User record
  const purchasedValid = !!(dbUser.purchasedCreditsExpiresAt && new Date(dbUser.purchasedCreditsExpiresAt) >= now);
  const totalPurchased = purchasedValid ? (interviewMode === 'mock' ? (dbUser.purchasedMockCredits || 0) : (dbUser.purchasedPracticeCredits || 0)) : 0;
  const hasPurchased = totalPurchased > 0;

  if (!hasDaily && !hasPurchased) {
    if (interviewMode === 'mock') {
      throw new Error('Insufficient mock interview credits. Please upgrade, purchase credits, or wait for reset.');
    }
    throw new Error('Insufficient practice credits. Please upgrade, purchase credits, or wait for reset.');
  }

  // 3. Extract meaningful information from the diagram
  const componentSummary = diagramData.nodes?.map((node) => {
    const componentName = node.data?.label || node.data?.componentId || 'Unknown Component';
    const componentType = node.type || 'generic';
    const metadata = node.data?.metadata || {};
    
    return {
      name: componentName,
      type: componentType,
      metadata: metadata,
      position: node.position
    };
  }) || [];

  const connectionSummary = diagramData.edges?.map((edge) => {
    const sourceNode = diagramData.nodes?.find((n) => n.id === edge.source);
    const targetNode = diagramData.nodes?.find((n) => n.id === edge.target);
    
    return {
      from: sourceNode?.data?.label || edge.source,
      to: targetNode?.data?.label || edge.target,
      type: edge.label || edge.type || 'connection',
      id: edge.id
    };
  }) || [];

  // 4. Build submitted answers with questions for context
  const interviewQuestions = problem.interviewQuestions as { Q: string; A: string }[];
  const answersWithQuestions: SubmittedAnswer[] = interviewMode === 'mock' 
    ? [] 
    : interviewQuestions.map((q, index) => ({
        question: q.Q,
        answer: submittedAnswers[index] || ''
      }));

  const transcriptFormatted = transcriptHistory 
    ? transcriptHistory.map(entry => `[${entry.role}] ${entry.message}`).join('\n')
    : '';

  // 5. Build comprehensive evaluation prompt (UPDATED to include answers)
  const prompt = `
You are an expert System Design Evaluator with 15+ years of experience in distributed systems, cloud architecture, scalability, and software engineering best practices.

PROBLEM TO SOLVE:
═══════════════════════════════════════════════════════════════════
Title: ${problem.title}
Difficulty Level: ${problem.difficulty}

Requirements:
${JSON.stringify(problem.requirements, null, 2)}
═══════════════════════════════════════════════════════════════════

${interviewMode === 'mock' ? `
MOCK INTERVIEW MODE - FULL CONVERSATION TRANSCRIPT:
═══════════════════════════════════════════════════════════════════
${transcriptFormatted}
═══════════════════════════════════════════════════════════════════
` : `
PRACTICE MODE - INTERVIEW QUESTIONS:
═══════════════════════════════════════════════════════════════════
${JSON.stringify(interviewQuestions, null, 2)}
═══════════════════════════════════════════════════════════════════

STUDENT'S SUBMITTED ANSWERS:
═══════════════════════════════════════════════════════════════════
${JSON.stringify(answersWithQuestions, null, 2)}
═══════════════════════════════════════════════════════════════════
`}

STUDENT'S SUBMITTED SOLUTION:
═══════════════════════════════════════════════════════════════════
Total Components: ${componentSummary.length}
Total Connections: ${connectionSummary.length}

Components Used:
${componentSummary.map((comp, idx) => `${idx + 1}. ${comp.name} (Type: ${comp.type})
   Metadata: ${JSON.stringify(comp.metadata, null, 2)}`).join('\n')}

Data Flow & Connections:
${connectionSummary.map((conn, idx) => `${idx + 1}. ${conn.from} → ${conn.to} (${conn.type})`).join('\n')}

Complete Diagram Structure:
${JSON.stringify({ components: componentSummary, connections: connectionSummary }, null, 2)}
═══════════════════════════════════════════════════════════════════

STUDENT'S SUBMITTED DATABASE SCHEMA:
═══════════════════════════════════════════════════════════════════
${databaseSchema && Array.isArray(databaseSchema) && databaseSchema.length > 0 ? JSON.stringify(databaseSchema, null, 2) : 'NO DATABASE SCHEMA PROVIDED'}
═══════════════════════════════════════════════════════════════════

EVALUATION CRITERIA:
Evaluate the solution comprehensively based on these dimensions:

1. REQUIREMENT FULFILLMENT (25 points)
   - Does the diagram address all functional requirements?
   - Are non-functional requirements considered in component choices?
   - Does it meet the scale requirements through architecture?

2. ARCHITECTURE & DESIGN (25 points)
   - Are the right architectural patterns used?
   - Is the component selection appropriate for the problem?
   - Is the design modular and maintainable?
   - Do connections represent logical data/control flows?

3. SCALABILITY & PERFORMANCE (20 points)
   - Can it handle the required scale?
   - Are there identified bottlenecks?
   - Is horizontal/vertical scaling considered?
   - Are caching/CDN strategies appropriate?

4. VERBAL EXPLANATION QUALITY (20 points)
   ${interviewMode === 'mock' 
     ? '- Evaluate the full conversation transcript: clarity of responses, handling of follow-ups, and technical depth.'
     : '- Do the submitted answers demonstrate deep understanding of choices?'}
   - Are justifications technically sound and specific?
   - Do answers address potential trade-offs and alternatives?
   - Is the communication clear and structured?
   ${interviewMode === 'mock' 
     ? '- For mock interviews: assess realistic interview performance including composure and thought process.'
     : ''}

5. RELIABILITY & BEST PRACTICES (10 points)
   - Single points of failure addressed?
   - Security, monitoring, cost optimization considered?
   - Modern cloud-native approaches used?

INSTRUCTIONS:
- Provide a score from 0-100 based on the criteria above (weight verbal answers appropriately for interview simulation).
- Give detailed, constructive feedback that helps the student improve, referencing specific answers and diagram elements.
- Be specific about what works well and what needs improvement in both diagram and verbal responses.
- Consider the difficulty level when scoring.
- Highlight technical correctness, practical considerations, and communication effectiveness.
- Suggest specific improvements with examples for both architecture and explanations.
- If critical components or poor justifications are missing, mention explicitly.

Evaluate now:`;

  try {
    console.log('Starting AI evaluation for problem:', problemId);
    
    // 6. Call AI for evaluation
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: evaluationSchema,
      },
    });

    const responseText = result?.text?.trim();
    if (!responseText) {
      throw new Error("AI evaluation response was empty. Please try again.");
    }

    const evaluationResult = JSON.parse(responseText);
    console.log('Evaluation completed with score:', evaluationResult.score);

    // 7. Validate evaluation result
    if (typeof evaluationResult.score !== 'number' || 
      evaluationResult.score < 0 || 
      evaluationResult.score > 100) {
      throw new Error("Invalid evaluation score received");
    }

    if (!evaluationResult.feedback || !evaluationResult.strengths || !evaluationResult.improvements) {
      throw new Error("Incomplete evaluation result received");
    }

    // 8. Atomically consume credits (P1 first, then P2) and create the submission inside a transaction
    // This prevents race conditions where multiple concurrent submissions could overdraw credits.
    const creditField = interviewMode === 'mock' ? 'dailyDesignCredits' : 'dailyProblemCredits';

    try {
      const submission = await prisma.$transaction(async (tx) => {
        // Attempt to consume P1 (daily allotment) first if available
        const dailyWhere = { id: session.user.id, subscriptionStatus: 'PRO', [creditField]: { gt: 0 } } as unknown as Prisma.UserWhereInput;
        const dailyData = { [creditField]: { decrement: 1 } } as unknown as Prisma.UserUpdateManyMutationInput;
        const dailyUpdate = await tx.user.updateMany({ where: dailyWhere, data: dailyData });

        if (dailyUpdate.count === 1) {
          // Successfully consumed daily credit
          return tx.submission.create({
            data: {
              userId: session.user.id,
              problemId: problemId,
              submittedDiagramData: diagramData as unknown as Prisma.InputJsonValue,
              submittedAnswers: ({
                answers: (interviewMode === 'mock' ? transcriptHistory : submittedAnswers),
                databaseSchema: databaseSchema || null
              }) as unknown as Prisma.InputJsonValue,
              evaluationResult: evaluationResult as unknown as Prisma.InputJsonValue,
            },
          });
        }

        // If daily consumption failed, attempt to consume from user's purchased credits (P2)
        const nowTs = new Date();
        const purchasedWhere = ({
          id: session.user.id,
          purchasedCreditsExpiresAt: { gte: nowTs },
          ...(interviewMode === 'mock' ? { purchasedMockCredits: { gt: 0 } } : { purchasedPracticeCredits: { gt: 0 } }),
        }) as unknown as Prisma.UserWhereInput;
        const purchasedData = (interviewMode === 'mock'
          ? { purchasedMockCredits: { decrement: 1 } }
          : { purchasedPracticeCredits: { decrement: 1 } }) as unknown as Prisma.UserUpdateManyMutationInput;
        const updateResult = await tx.user.updateMany({ where: purchasedWhere, data: purchasedData });

        if (!updateResult || updateResult.count !== 1) {
          throw new Error('Insufficient credits (concurrent modifications or expired purchases). Please try again.');
        }

        // Create submission after successfully decrementing purchased credits
        return tx.submission.create({
          data: {
            userId: session.user.id,
            problemId: problemId,
            submittedDiagramData: diagramData as unknown as Prisma.InputJsonValue,
            submittedAnswers: ({
              answers: (interviewMode === 'mock' ? transcriptHistory : submittedAnswers),
              databaseSchema: databaseSchema || null
            }) as unknown as Prisma.InputJsonValue,
            evaluationResult: evaluationResult as unknown as Prisma.InputJsonValue,
          },
        });
      });

      console.log('Submission saved successfully:', submission.id);
      return submission.id;
    } catch (txErr) {
      console.error('Failed to create submission with atomic credit consumption:', txErr);
      if (txErr instanceof Error && txErr.message.includes('Insufficient credits')) {
        throw txErr; // Propagate user-facing insufficient credit error
      }
      throw new Error('Submission failed due to a server error. Please try again.');
    }

  } catch (error: unknown) {
    console.error("Error evaluating solution:", error);
    
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('API key')) {
        throw new Error('API configuration error. Please contact support.');
      }
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        throw new Error('Service temporarily unavailable. Please try again in a few minutes.');
      }
      throw new Error(`Solution evaluation failed: ${error.message}`);
    }
    
    throw new Error("An unexpected error occurred during evaluation. Please try again.");
  }
}
// Import the cloud services data
import cloudServicesData from '@/lib/kbs/cloudServicesData.json';

// Define the schema using the Type enum
const designSchema = {
    type: Type.OBJECT,
    properties: {
        design_rationale: { type: Type.STRING, description: "A brief, 2-3 sentence explanation of the chosen architecture." },
        components: {
            type: Type.ARRAY,
            description: "An array of architectural components for the design.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "A unique, short identifier (e.g., 'c1', 'db-main')." },
                    name: { type: Type.STRING, description: "A human-readable name for the component (e.g., 'User Service', 'PostgreSQL DB')." },
                    type: { type: Type.STRING, description: "The architectural category (e.g., 'Compute', 'Database', 'Cache'). Use the 'category' from the cloud services data." },
                    provider: { type: Type.STRING, description: "The cloud provider (e.g., 'AWS', 'Azure', 'GCP'). Use the exact 'provider' from the cloud services data." },
                    service: { type: Type.STRING, description: "The specific service name (e.g., 'EC2', 'RDS', 'Cloud Run'). Use the exact 'name' from the cloud services data." },
                    purpose: { type: Type.STRING, description: "What this component does." },
                    estimated_cost_per_month: { type: Type.NUMBER, description: "The estimated monthly cost in USD (must be a number). Use the exact 'monthlyRate' from the selected cloud service entry." },
                    cloudServiceId: { type: Type.STRING, description: "The exact ID from the cloud services catalog (e.g., 'aws-ec2-t3-medium-ondemand')." },
                },
                required: ["id", "name", "type", "provider", "service", "purpose", "estimated_cost_per_month", "cloudServiceId"],
            },
        },
        connections: {
            type: Type.ARRAY,
            description: "An array of connections between components.",
            items: {
                type: Type.OBJECT,
                properties: {
                    source: { type: Type.STRING, description: "The ID of the source component." },
                    target: { type: Type.STRING, description: "The ID of the target component." },
                    label: { type: Type.STRING, description: "The type of connection (e.g., 'HTTP', 'gRPC', 'Async')." },
                },
                required: ["source", "target", "label"],
            },
        },
        total_estimated_cost_per_month: { type: Type.NUMBER, description: "The sum of all component costs." },
    },
    required: ["design_rationale", "components", "connections", "total_estimated_cost_per_month"],
};

export async function createDesign(formData: FormData): Promise<string> {
    const session = await getServerSession(NEXT_AUTH_CONFIG);
    if (!session?.user?.id) {
        console.error("Session user ID not found:", session);
        throw new Error("Unauthorized or session user ID not found");
    }

    // 1. Get user input from form data
    const applicationType = formData.get('applicationType') as string;
    const targetScale = formData.get('targetScale') as string;
    const keyFeatures = formData.get('keyFeatures') as string;
    const nonFunctionalRequirements = formData.get('nonFunctionalRequirements') as string;
    const budget = formData.get('budget') as string;

    if (!applicationType || !targetScale || !keyFeatures || !nonFunctionalRequirements || !budget) {
        throw new Error("All design requirements must be provided.");
    }
   
    // 2. Construct the prompt
    // The prompt is simpler because the schema defines the required structure.
    const prompt = `
        You are an expert System Design Architect. Based on the following requirements, generate a concise and optimal system design architecture. The design MUST be returned strictly as a JSON object matching the provided schema.
         
        IMPORTANT CONSTRAINTS:
        - You MUST select components ONLY from the provided CLOUD SERVICES CATALOG below. Do NOT invent, hallucinate, or use any services, providers, or pricing not listed here.
        - For each component, map exactly to one entry in the catalog: use 'category' as 'type', 'provider' as 'provider', 'name' as 'service', 'monthlyRate' as 'estimated_cost_per_month', and the full 'id' as 'cloudServiceId'.
        - Create a short unique internal ID (e.g., 'c1', 'db1') for the 'id' field used in connections.
        - Infer and describe the 'purpose' based on the component's role in fulfilling the requirements.
        - Choose the most appropriate term (e.g., On-Demand, 1-Year) for each service based on the budget and scale to optimize costs.
        - The total_estimated_cost_per_month MUST fit within the budget constraint. Prioritize cost-effective options while meeting requirements.
        - Use 4-8 components maximum for a balanced architecture.
        - Connections must form a logical flow (e.g., frontend → API → database).
         
        CLOUD SERVICES CATALOG (use ONLY these entries):
        ${JSON.stringify(cloudServicesData, null, 2)}
         
        Requirements:
        - Application Type: ${applicationType}
        - Target Scale: ${targetScale}
        - Key Features: ${keyFeatures}
        - Non-Functional Requirements: ${nonFunctionalRequirements}
        - Budget Constraint: ${budget} (total_estimated_cost_per_month must fit within this range)
         
        Ensure all component 'id' fields are unique and connections reference these IDs.
    `;

    try {
        // Use the recommended model: gemini-2.5-flash
        const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: designSchema,
            },
        });
      
        const responseText = result?.text?.trim();

        if (!responseText) {
            throw new Error("AI response was empty.");
        }
      
        // The response text is guaranteed to be JSON due to the configuration
        const jsonResponse = JSON.parse(responseText);

        // Basic validation to ensure schema compliance
        if (!jsonResponse.design_rationale || !jsonResponse.components || !Array.isArray(jsonResponse.components)) {
            throw new Error("AI response did not match expected schema.");
        }

        // Additional validation: Ensure total cost fits budget roughly (parse budget range)
        const budgetMatch = budget.match(/\$(\d+)-?\$?(\d*)/);
        if (budgetMatch) {
            const minBudget = parseInt(budgetMatch[1], 10);
            const maxBudget = budgetMatch[2] ? parseInt(budgetMatch[2], 10) : Infinity;
            if (jsonResponse.total_estimated_cost_per_month < minBudget || jsonResponse.total_estimated_cost_per_month > maxBudget) {
                throw new Error("Generated design exceeds budget constraints.");
            }
        }

        // 3. Save the design to the database
        const design = await prisma.design.create({
            data: {
                userId: session.user.id,
                name: `Design for ${applicationType} (${new Date().toISOString().split('T')[0]})`,
                diagramData: jsonResponse,
                isDeleted: false,
            },
        });
      
        revalidatePath('/design'); // Invalidate cache for design list
      
        return design.id;

    } catch (error: unknown) {
        console.error("Error generating or saving design:", error);
        if (error instanceof Error) {
            throw new Error(`Design generation failed: ${error.message}`);
        }
        throw new Error("An unexpected error occurred during design generation.");
    }
}

const saltRounds = 10;

/**
 * Creates a Razorpay subscription and returns the ID.
 * @param planName The name of the plan the user selected.
 */
export async function createRazorpaySubscription(planName: string) {
  const session = await getServerSession(NEXT_AUTH_CONFIG);
  if (!session?.user?.id) {
    console.error("Session user ID not found:", session);
    throw new Error("Unauthorized or session user ID not found");
  }

  const plan = await prisma.plan.findUnique({ where: { name: planName } });
  if (!plan) {
    throw new Error("Plan not found");
  }

  if (!plan.razorpayPlanId) {
    console.error("razorpayPlanId not found for plan:", planName);
    throw new Error("Plan configuration incomplete: missing razorpayPlanId");
  }

  const subscriptionOptions: RazorpaySubscriptionCreateOptions = {
    plan_id: plan.razorpayPlanId,
    customer_notify: 1,
    quantity: 1,
    total_count: 12,
  };

  try {
    console.log("Creating subscription with options:", subscriptionOptions);
    const subscription = await razorpay.subscriptions.create(subscriptionOptions);

    console.log("Subscription created successfully:", subscription);

    // Ensure the database has a matching User record for the current session.
    // Some session shapes (or mismatched auth flows) may have an ID that doesn't match the DB user id.
    // Lookup using session.user.id first, then fall back to session.user.email.
    let dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!dbUser && session.user.email) {
      dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    }

    if (!dbUser) {
      console.warn("No matching DB user found for session when creating payment. Attempting to create a user record from session:", {
        sessionUserId: session.user.id,
        sessionUserEmail: session.user.email,
      });

      // Create a new user record derived from the session so we can attach the Payment.
      // Ensure unique username and provide a random hashed password since password is required in schema.
      const emailLower = session.user.email?.toLowerCase() || '';
      const baseUsername = session.user.username || (emailLower.split('@')[0] || `user_${Math.random().toString(36).slice(2,8)}`);

      // Ensure username uniqueness
      let uniqueUsername = baseUsername;
      let attempt = 0;
      while (await prisma.user.findUnique({ where: { username: uniqueUsername } })) {
        attempt += 1;
        uniqueUsername = `${baseUsername}_${Math.floor(Math.random() * 9000) + 1000}`;
        if (attempt > 5) break; // fallback after a few tries
      }

      // Generate a random password and hash it (not used, but required by schema)
      const randomPassword = Math.random().toString(36).slice(2, 12);
      const hashedPassword = await bcrypt.hash(randomPassword, saltRounds);

      try {
        dbUser = await prisma.user.create({
          data: {
            // Preserve session user id if present to maintain linkage
            id: session.user.id,
            email: emailLower,
            username: uniqueUsername,
            password: hashedPassword,
            // role will default to USER in Prisma schema but explicit is okay
            role: 'USER',
          },
        });
        console.log('Created DB user from session for payment association:', dbUser.id);
      } catch (createError) {
        console.error('Failed to create DB user from session:', createError);
        throw new Error('Failed to create user record for the current session. Please contact support.');
      }
    }

    await prisma.payment.create({
      data: {
        userId: dbUser.id,
        planId: plan.id,
        razorpaySubscriptionId: subscription.id,
        status: "PENDING",
      },
    });

    // Immediately mark the user as PRO and reset daily credits so the user gains access
    // right after a successful subscription creation. Webhook will still reconcile state
    // (e.g., mark ACTIVE or CANCELLED) when payments are charged; this immediate update
    // provides a better UX in case webhooks are delayed or don't reach the server.
    try {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          subscriptionStatus: "PRO",
          dailyDesignCredits: 2,
          dailyProblemCredits: 10,
          lastCreditReset: new Date(),
        },
      });
      console.log("User provisioned as PRO immediately after subscription creation:", dbUser.id);
    } catch (userProvisionErr) {
      console.error("Failed to provision user as PRO after subscription creation:", userProvisionErr);
    }

    return { subscriptionId: subscription.id };
  } catch (error: unknown) { // Use 'unknown' for better type safety
    console.error("Error creating Razorpay subscription:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to create subscription order: ${error.message}`);
    }
    throw new Error("Failed to create subscription order due to an unknown error.");
  }
}
// --- START OTP STORE DEFINITIONS ---

enum Role {
    USER = "USER",
    ADMIN = "ADMIN",
}

interface TempUserData {
    username: string;
    password: string; // Hashed password
    role: Role;
}

// Type guard to ensure JSON compatibility

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_RESEND_ATTEMPTS = 10;
const RESEND_COOLDOWN_SECONDS = 1;

/**
 * Generates and stores the OTP in the database.
 * @param email The user's email.
 * @param newUserData Optional: User data only passed during the INITIAL signup.
 * @returns The generated OTP.
 */
export async function generateAndStoreOtp(email: string, newUserData?: TempUserData): Promise<string> {
    const now = Date.now();
    const emailLower = email.toLowerCase();
    
    const currentEntry = await prisma.otp.findUnique({
        where: { email: emailLower },
    });
    
    // 1. Check Cooldown
    if (currentEntry && Number(currentEntry.expiresAt) > now) {
        const timeSinceLastSend = now - (Number(currentEntry.expiresAt) - OTP_EXPIRY_MS);
        if (timeSinceLastSend < RESEND_COOLDOWN_SECONDS * 1000) {
            throw new Error(`Please wait ${RESEND_COOLDOWN_SECONDS - Math.floor(timeSinceLastSend / 1000)} seconds before trying to resend.`);
        }
    }

    // 2. Determine User Data
    const userDataToStore = newUserData || (currentEntry?.tempUserData as TempUserData | undefined);
    if (!userDataToStore) {
        throw new Error("Cannot generate OTP: Missing user data. Please sign up again.");
    }

    // 3. Check Resend Count
    const resendCount = (currentEntry && Number(currentEntry.expiresAt) > now) 
        ? currentEntry.resendCount + 1
        : 1;

    if (resendCount > MAX_RESEND_ATTEMPTS) {
        throw new Error("Maximum resend attempts reached. Please wait 10 minutes or contact support.");
    }
    
    // 4. Generate and Store/Upsert in DB
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = BigInt(now + OTP_EXPIRY_MS);

    await prisma.otp.upsert({
        where: { email: emailLower },
        update: {
            otp,
            expiresAt,
            resendCount,
            //@ts-expect-error - Prisma JSON field requires specific type casting
            tempUserData: userDataToStore as unknown as JsonCompatible, // Cast to JSON-compatible type
        },
        create: {
            email: emailLower,
            otp,
            expiresAt,
            resendCount,
            //@ts-expect-error - Prisma JSON field requires specific type casting
            tempUserData: userDataToStore as unknown as JsonCompatible, // Cast to JSON-compatible type
        },
    });
    
    console.log(`OTP stored for ${emailLower}:`, { otp, expiresAt });
    
    return otp;
}

/**
 * Checks the OTP against the database.
*/
export async function verifyAndCleanOtp(email: string, otp: string): Promise<boolean> {
    const emailLower = email.toLowerCase();
    const storedOtp = await prisma.otp.findUnique({
        where: { email: emailLower },
    });
    
    console.log(`Verifying OTP for ${emailLower}:`, { storedOtp, inputOtp: otp, now: Date.now() });
    
    if (!storedOtp) {
        return false; // OTP not found
    }
    
    if (Number(storedOtp.expiresAt) < Date.now()) {
        await prisma.otp.delete({ where: { email: emailLower } }); // Clean up expired
        console.log(`OTP for ${emailLower} expired at ${new Date(Number(storedOtp.expiresAt)).toISOString()}`);
        return false; // Expired
    }
    
    if (storedOtp.otp === otp) {
        return true; // Verification successful, cleanup handled by createUserAfterOtp
    }
    
    return false; // Invalid OTP
}

/**
 * Creates a user in the database after successful OTP verification.
 * @param email The user's email.
 * @param otp The one-time password.
*/
export async function createUserAfterOtp(email: string, otp: string) {
    const emailLower = email.toLowerCase();
    const storedOtp = await prisma.otp.findUnique({
        where: { email: emailLower },
    });
    
    if (!storedOtp || storedOtp.otp !== otp || Number(storedOtp.expiresAt) < Date.now()) {
        throw new Error("Invalid or expired OTP.");
    }
    
    //@ts-expect-error - Prisma JSON field requires specific type casting
    const tempUserData = storedOtp.tempUserData as TempUserData; // Cast retrieved JSON to TempUserData
    const { username, password, role } = tempUserData;

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email: emailLower },
        });
        if (existingUser) {
            throw new Error("User already exists.");
        }
    await prisma.user.create({
      data: {
        email: emailLower,
        username,
        password,
        role,
        // New users start with 1 mock and 1 practice credit and FREE status
        subscriptionStatus: 'FREE',
        dailyDesignCredits: 1,
        dailyProblemCredits: 1,
        lastCreditReset: new Date(),
      },
    });
        await prisma.otp.delete({ where: { email: emailLower } });
        console.log(`User ${emailLower} created and OTP cleaned up.`);
    } catch (error: unknown) {
        console.error("Error creating user:", error);
        if (error instanceof Error) {
            throw new Error(error.message || "Failed to create user.");
        }
        throw new Error("Failed to create user due to an unknown error.");
    }
}

export async function signupUser(formData: FormData) {
    const { username, email, password, role } = Object.fromEntries(formData) as {
        username: string;
        email: string;
        password: string;
        role: Role;
    };
    if (!username || !email || !password || !role) {
        throw new Error("Missing required fields");
    }
    try {
        const emailLower = email.toLowerCase();
        
        const existingUser = await prisma.user.findUnique({
            where: { email: emailLower },
        });

        if (existingUser) {
            throw new Error("User already exists");
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const validRole = (Object.values(Role) as string[]).includes(role) ? role : "USER";

        await sendOtp(emailLower, { 
            username, 
            password: hashedPassword, 
            role: validRole as Role 
        });

    } catch (error: unknown) {
        console.error("Error creating user:", error);
        if (error instanceof Error) {
            throw new Error(error.message || "Failed to create user.");
        }
        throw new Error("Failed to create user due to an unknown error.");
    }

    redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}

export async function sendOtp(email: string, newUserData?: TempUserData) {
    if (!email) {
        throw new Error("Email is required");
    }
    try {
        const emailLower = email.toLowerCase();
        
        const otp = await generateAndStoreOtp(emailLower, newUserData);
        console.log("Otp generated:", otp);
        
        // Use pooled transporter for better performance
        const { getEmailTransporter } = await import("@/lib/email/transporter");
        const transporter = getEmailTransporter();
        
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: "Your One-Time Password (OTP) for Verification",
            html: `<p>Your One-Time Password (OTP) for verification is: <strong>${otp}</strong>. This OTP is valid for 10 minutes.</p>`,
        };
        await transporter.sendMail(mailOptions);
        
    } catch (error: unknown) {
        console.error("Error sending OTP:", error);
        if (error instanceof Error) {
            throw new Error(error.message || "Failed to send OTP. Please try again later.");
        }
        throw new Error("Failed to send OTP due to an unknown error.");
    }
}

export async function getProblem(problemId: string) {
  const problemRaw = (await prisma.problem.findUnique({
    where: { id: problemId, isDeleted: false },
  })) as any;
  if (!problemRaw) {
    throw new Error("Problem not found");
  }
  return problemRaw as ProblemWithComponents;
}

interface TranscriptEntry {
  role: 'AI' | 'User';
  message: string;
  timestamp: number;
  context?: string;
}

interface ComponentEvent {
  componentId: string;
  componentLabel: string;
  timestamp: number;
}

interface InterviewerRequest {
  problemId: string;
  transcriptHistory: TranscriptEntry[];
  interviewPhase: 'clarification' | 'design' | 'complete';
  clarifyingQuestionCount: number;
  maxClarifyingQuestions: number;
  componentBatchQueue: ComponentEvent[];
  globalCooldownTime: number | null;
  lastInterruptionTime: number | null;
  trigger: 'user_message' | 'component_added' | 'idle_timeout' | 'structured_time' | 'initial';
  userMessage?: string;
}

interface InterviewerResponse {
  aiMessage: string;
  shouldLockModal: boolean;
  newPhase: 'clarification' | 'design' | 'complete';
  cooldownDuration: number;
  transitionToDesign: boolean;
}

const interviewResponseSchema = {
  type: Type.OBJECT,
  properties: {
    aiMessage: { 
      type: Type.STRING, 
      description: "The AI interviewer's message or question to the user" 
    },
    shouldAskFollowUp: { 
      type: Type.BOOLEAN, 
      description: "Whether a follow-up question should be asked if the answer was insufficient" 
    },
    followUpQuestion: { 
      type: Type.STRING, 
      description: "The follow-up question to ask if shouldAskFollowUp is true" 
    },
    scoreLevel: { 
      type: Type.NUMBER, 
      description: "Score level from 1-5 indicating answer quality (1=poor, 5=excellent)" 
    },
    transitionToDesign: { 
      type: Type.BOOLEAN, 
      description: "Whether to transition from clarification to design phase" 
    },
  },
  required: ["aiMessage", "shouldAskFollowUp", "scoreLevel", "transitionToDesign"],
};

export async function interactWithInterviewer(request: InterviewerRequest): Promise<InterviewerResponse> {
  const session = await getServerSession(NEXT_AUTH_CONFIG);
  if (!session?.user?.id) {
    throw new Error("Unauthorized - Please log in");
  }

  const now = Date.now();
  
  if (request.globalCooldownTime && now < request.globalCooldownTime) {
    const remainingSeconds = Math.ceil((request.globalCooldownTime - now) / 1000);
    throw new Error(`Please wait ${remainingSeconds} seconds before the AI can respond.`);
  }

  const problem = await prisma.problem.findUnique({
    where: { id: request.problemId, isDeleted: false },
    select: {
      id: true,
      title: true,
      requirements: true,
      difficulty: true,
      components: true,
      starterDiagram: true,
    },
  });

  if (!problem) {
    throw new Error("Problem not found");
  }

  const buildTranscriptContext = (): string => {
    if (request.transcriptHistory.length === 0) return "No previous conversation.";
    return request.transcriptHistory
      .map(entry => `[${entry.role}]: ${entry.message}`)
      .join('\n');
  };

  const buildComponentBatchContext = (): string => {
    if (request.componentBatchQueue.length === 0) return "";
    return `\nRecent components added:\n${request.componentBatchQueue
      .map(c => `- ${c.componentLabel} (ID: ${c.componentId})`)
      .join('\n')}`;
  };

  let systemPrompt = '';
  
  if (request.trigger === 'initial') {
    systemPrompt = `You are an experienced System Design Interviewer conducting a mock interview.

PROBLEM:
Title: ${problem.title}
Difficulty: ${problem.difficulty}
Requirements: ${JSON.stringify(problem.requirements, null, 2)}

PHASE: ${request.interviewPhase === 'clarification' ? 'CLARIFICATION' : 'HIGH-LEVEL DESIGN'}

INSTRUCTIONS:
${request.interviewPhase === 'clarification' ? `
- The user can ask clarifying questions to understand requirements better.
- You have a STRICT LIMIT of ${request.maxClarifyingQuestions} clarifying questions total.
- Current count: ${request.clarifyingQuestionCount}/${request.maxClarifyingQuestions}
- Count EACH distinct question in the user's message.
- If the total exceeds the limit, IMMEDIATELY set transitionToDesign=true and instruct them to start designing.
- Be helpful but concise. Answer their questions clearly.
- If they're not asking questions or say they're ready, transition to design phase.
` : `
- The user is now designing their system architecture.
- You will ask strategic questions about their component choices based on triggers:
  * Component placement (batched if multiple during cooldown)
  * Idle time (user hasn't interacted for a while)
  * Structured intervals (every 5-7 minutes)
- Ask ONE strategic question focusing on the most critical aspect.
- If the user's answer is weak (score < 4), you may ask ONE subtle follow-up to probe deeper.
- If they fail both the initial question AND the follow-up, STOP asking about that topic and move on.
- Be realistic, challenging, and professional like a real interviewer.
`}

CONVERSATION HISTORY:
${buildTranscriptContext()}

Respond now based on the current trigger: ${request.trigger}`;

  } else if (request.trigger === 'user_message') {
    if (request.interviewPhase === 'clarification') {
      const questionPattern = /[?]/g;
      const questionCount = (request.userMessage || '').match(questionPattern)?.length || 0;
      
      systemPrompt = `You are a System Design Interviewer in the CLARIFICATION PHASE.

PROBLEM: ${problem.title}

Current clarifying questions asked: ${request.clarifyingQuestionCount}/${request.maxClarifyingQuestions}
Questions in this message: ${questionCount}
New total would be: ${request.clarifyingQuestionCount + questionCount}

CONVERSATION HISTORY:
${buildTranscriptContext()}

USER'S NEW MESSAGE:
${request.userMessage}

INSTRUCTIONS:
- Answer the user's clarifying questions clearly and concisely.
- Count the number of distinct questions (indicated by '?' typically).
- If new total exceeds ${request.maxClarifyingQuestions}, IMMEDIATELY set transitionToDesign=true and say:
  "You've reached the maximum number of clarifying questions. Let's move to the design phase. Please start building your architecture diagram."
- Otherwise, answer helpfully and set transitionToDesign=false.`;

    } else {
      const lastAIQuestion = request.transcriptHistory
        .slice()
        .reverse()
        .find(entry => entry.role === 'AI' && entry.context === 'question');

      systemPrompt = `You are a System Design Interviewer in the DESIGN PHASE.

PROBLEM: ${problem.title}

CONVERSATION HISTORY:
${buildTranscriptContext()}

LAST AI QUESTION:
${lastAIQuestion ? lastAIQuestion.message : 'None'}

USER'S ANSWER:
${request.userMessage}

INSTRUCTIONS:
- Evaluate the user's answer to your question.
- Assign a scoreLevel from 1-5:
  1-2: Poor/Incorrect answer
  3: Partial understanding
  4-5: Good/Excellent answer
- If scoreLevel < 4 AND this is the FIRST attempt on this topic, set shouldAskFollowUp=true and provide a subtle probe in followUpQuestion.
- If scoreLevel < 4 AND there was already a follow-up on this topic, set shouldAskFollowUp=false and move on.
- If scoreLevel >= 4, acknowledge positively and set shouldAskFollowUp=false.
- ALWAYS set transitionToDesign=false in this phase.`;
    }

  } else if (request.trigger === 'component_added' || request.trigger === 'structured_time' || request.trigger === 'idle_timeout') {
    systemPrompt = `You are a System Design Interviewer in the DESIGN PHASE.

PROBLEM: ${problem.title}

CONVERSATION HISTORY:
${buildTranscriptContext()}

TRIGGER: ${request.trigger}
${buildComponentBatchContext()}

INSTRUCTIONS:
- The user has added components or time has passed.
- Ask ONE strategic, challenging question about their design choices.
- Focus on the most critical component if multiple were added.
- Probe scalability, trade-offs, consistency, availability, performance, or architecture patterns.
- Be professional and realistic like a real interviewer.
- Set transitionToDesign=false, shouldAskFollowUp=false for initial interrupt questions.`;
  }

  try {
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: interviewResponseSchema,
      },
    });

    const responseText = result?.text?.trim();
    if (!responseText) {
      throw new Error("AI response was empty");
    }

    const aiResponse = JSON.parse(responseText);

    const cooldownDuration = request.interviewPhase === 'clarification' ? 3000 : 8000;

    const shouldLockModal = request.interviewPhase === 'design' || aiResponse.shouldAskFollowUp;

    const newPhase: 'clarification' | 'design' | 'complete' = 
      aiResponse.transitionToDesign ? 'design' : request.interviewPhase;

    return {
      aiMessage: aiResponse.aiMessage,
      shouldLockModal,
      newPhase,
      cooldownDuration,
      transitionToDesign: aiResponse.transitionToDesign || false,
    };

  } catch (error: unknown) {
    console.error("Error in interactWithInterviewer:", error);
    
    if (error instanceof Error) {
      throw new Error(`AI interviewer error: ${error.message}`);
    }
    
    throw new Error("An unexpected error occurred during the interview.");
  }
}

/**
 * Create a one-time purchased credit pack (P2).
 * Sessions -> mockCredits = sessions, practiceCredits = sessions * 3
 * Expires in ~12 months from purchase time.
 */
export async function createOneTimeCreditPack(sessions: number) {
  const session = await getServerSession(NEXT_AUTH_CONFIG);
  if (!session?.user?.id) {
    throw new Error('Unauthorized or session user ID not found');
  }

  if (!Number.isInteger(sessions) || sessions <= 0) {
    throw new Error('Invalid sessions count');
  }

  const mockCredits = sessions;
  const practiceCredits = sessions * 3;
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // ~12 months

  try {
    // Add purchased credits onto the User record and set expiry to ~12 months
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        purchasedMockCredits: { increment: mockCredits } as unknown as Prisma.UserUpdateInput,
        purchasedPracticeCredits: { increment: practiceCredits } as unknown as Prisma.UserUpdateInput,
        purchasedCreditsExpiresAt: expiresAt,
      } as unknown as Prisma.UserUpdateInput,
    });

    return { ok: true, purchasedMockCredits: updated.purchasedMockCredits };
  } catch (err) {
    console.error('Failed to create one-time credit pack:', err);
    throw new Error('Failed to create purchase. Please try again later.');
  }
}

// Mapping of pack ids to amounts (in INR rupees) and sessions for server-side pricing
const ONE_TIME_PACKS: Record<string, { sessions: number; priceInRupees: number }> = {
  'pack-small': { sessions: 1, priceInRupees: 199 },
  'pack-medium': { sessions: 3, priceInRupees: 499 },
  'pack-large': { sessions: 10, priceInRupees: 1299 },
};

/**
 * Create a Razorpay order for a one-time credit pack. Returns orderId and amount.
 * packId must be one of the server-known pack keys to avoid client tampering.
 */
export async function createOneTimeOrder(packId: string) {
  const session = await getServerSession(NEXT_AUTH_CONFIG);
  if (!session?.user?.id) throw new Error('Unauthorized');

  const pack = ONE_TIME_PACKS[packId];
  if (!pack) throw new Error('Invalid pack');

  const amountPaise = Math.round(pack.priceInRupees * 100);

  try {
    // Create Razorpay order
    const order = await (razorpay as unknown as { orders: { create: (opts: { amount: number; currency: string; receipt: string; notes?: Record<string, string> }) => Promise<{ id: string; currency?: string }> } }).orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `one_time_pack_${packId}_${Date.now()}`,
      notes: { userId: session.user.id, packId },
    });

    return {
      orderId: order.id,
      amount: amountPaise,
      currency: order.currency || 'INR',
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
    };
  } catch (err) {
    console.error('Failed to create Razorpay order:', err);
    throw new Error('Failed to create payment order');
  }
}

/**
 * Confirm a Razorpay payment (client provides payment_id, order_id, signature).
 * Verifies signature and on success creates the Purchase record and a Payment entry.
 */
export async function confirmOneTimePayment(
  razorpay_payment_id: string,
  razorpay_order_id: string,
  razorpay_signature: string,
  packId: string
) {
  const session = await getServerSession(NEXT_AUTH_CONFIG);
  if (!session?.user?.id) throw new Error('Unauthorized');

  // verify signature
  const generated = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generated !== razorpay_signature) {
    throw new Error('Invalid payment signature');
  }

  // Payment is valid — create Purchase and Payment records
  const pack = ONE_TIME_PACKS[packId];
  if (!pack) throw new Error('Invalid pack');

  const mockCredits = pack.sessions;
  const practiceCredits = pack.sessions * 3;
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        purchasedMockCredits: { increment: mockCredits } as unknown as Prisma.UserUpdateInput,
        purchasedPracticeCredits: { increment: practiceCredits } as unknown as Prisma.UserUpdateInput,
        purchasedCreditsExpiresAt: expiresAt,
      } as unknown as Prisma.UserUpdateInput,
    });
    
    return { ok: true };
  } catch (err) {
    console.error('Failed to record confirmed payment:', err);
    throw new Error('Failed to record purchase');
  }
}