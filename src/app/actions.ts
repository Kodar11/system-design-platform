"use server";

import { prisma } from "@/lib/prisma/userService";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { NEXT_AUTH_CONFIG } from "@/lib/nextAuthConfig";
import Razorpay from "razorpay";
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

// Updated submitProblemSolution function in src/app/actions.ts
// (Replace the existing function with this updated version)

interface SubmittedAnswer {
  question: string;
  answer: string;
}

/**
 * Submits a problem solution and evaluates it using AI
 * @param problemId The ID of the problem being solved
 * @param diagramData The diagram data containing nodes and edges
 * @param submittedAnswers Array of answers corresponding to interviewQuestions
 * @returns The submission ID to redirect to the result page
 */
export async function submitProblemSolution(
  problemId: string, 
  diagramData: DiagramData,
  submittedAnswers: string[] // Array of strings, indexed to match interviewQuestions
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
  const problem = await prisma.problem.findUnique({
    where: { id: problemId, isDeleted: false }
  });

  if (!problem) {
    throw new Error("Problem not found or has been deleted");
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
  const answersWithQuestions: SubmittedAnswer[] = interviewQuestions.map((q, index) => ({
    question: q.Q,
    answer: submittedAnswers[index] || ''
  }));

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

INTERVIEW QUESTIONS (for evaluation of verbal responses):
═══════════════════════════════════════════════════════════════════
${JSON.stringify(interviewQuestions, null, 2)}
═══════════════════════════════════════════════════════════════════

STUDENT'S SUBMITTED ANSWERS:
═══════════════════════════════════════════════════════════════════
${JSON.stringify(answersWithQuestions, null, 2)}
═══════════════════════════════════════════════════════════════════

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
   - Do the submitted answers demonstrate deep understanding of choices?
   - Are justifications technically sound and specific?
   - Do answers address potential trade-offs and alternatives?
   - Is the communication clear and structured?

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

    // 8. Save submission to database - UPDATED to include submittedAnswers
    const submission = await prisma.submission.create({
      data: {
        userId: session.user.id,
        problemId: problemId,
        submittedDiagramData: diagramData as Prisma.InputJsonValue,
        submittedAnswers: submittedAnswers as Prisma.InputJsonValue, // NEW: Save answers
        evaluationResult: evaluationResult as Prisma.InputJsonValue,
      },
    });

    console.log('Submission saved successfully:', submission.id);

    // 9. Return submission ID for redirect
    return submission.id;

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

// // Define the schema using the Type enum
// const designSchema = {
//     type: Type.OBJECT,
//     properties: {
//         design_rationale: { type: Type.STRING, description: "A brief, 2-3 sentence explanation of the chosen architecture." },
//         components: {
//             type: Type.ARRAY,
//             description: "An array of architectural components for the design.",
//             items: {
//                 type: Type.OBJECT,
//                 properties: {
//                     id: { type: Type.STRING, description: "A unique, short identifier (e.g., 'c1', 'db-main')." },
//                     name: { type: Type.STRING, description: "A human-readable name for the component (e.g., 'User Service', 'PostgreSQL DB')." },
//                     type: { type: Type.STRING, description: "The architectural category (e.g., 'Compute', 'Database', 'Cache')." },
//                     provider: { type: Type.STRING, description: "The cloud provider (e.g., 'AWS', 'Azure', 'GCP')." },
//                     service: { type: Type.STRING, description: "The specific service name (e.g., 'EC2', 'RDS', 'Cloud Run')." },
//                     purpose: { type: Type.STRING, description: "What this component does." },
//                     estimated_cost_per_month: { type: Type.NUMBER, description: "The estimated monthly cost in USD (must be a number)." },
//                 },
//                 required: ["id", "name", "type", "provider", "service", "purpose", "estimated_cost_per_month"],
//             },
//         },
//         connections: {
//             type: Type.ARRAY,
//             description: "An array of connections between components.",
//             items: {
//                 type: Type.OBJECT,
//                 properties: {
//                     source: { type: Type.STRING, description: "The ID of the source component." },
//                     target: { type: Type.STRING, description: "The ID of the target component." },
//                     label: { type: Type.STRING, description: "The type of connection (e.g., 'HTTP', 'gRPC', 'Async')." },
//                 },
//                 required: ["source", "target", "label"],
//             },
//         },
//         total_estimated_cost_per_month: { type: Type.NUMBER, description: "The sum of all component costs." },
//     },
//     required: ["design_rationale", "components", "connections", "total_estimated_cost_per_month"],
// };

// export async function createDesign(formData: FormData): Promise<string> {
//     const session = await getServerSession(NEXT_AUTH_CONFIG);
//     if (!session?.user?.id) {
//         console.error("Session user ID not found:", session);
//         throw new Error("Unauthorized or session user ID not found");
//     }

//     // 1. Get user input from form data
//     const applicationType = formData.get('applicationType') as string;
//     const targetScale = formData.get('targetScale') as string;
//     const keyFeatures = formData.get('keyFeatures') as string;
//     const nonFunctionalRequirements = formData.get('nonFunctionalRequirements') as string;
//     const budget = formData.get('budget') as string;

//     if (!applicationType || !targetScale || !keyFeatures || !nonFunctionalRequirements || !budget) {
//         throw new Error("All design requirements must be provided.");
//     }
   
//     // 2. Construct the prompt
//     // The prompt is simpler because the schema defines the required structure.
//     const prompt = `
//         You are an expert System Design Architect. Based on the following requirements, generate a concise and optimal system design architecture. The design MUST be returned strictly as a JSON object matching the provided schema.
         
//         Requirements:
//         - Application Type: ${applicationType}
//         - Target Scale: ${targetScale}
//         - Key Features: ${keyFeatures}
//         - Non-Functional Requirements: ${nonFunctionalRequirements}
//         - Budget: ${budget}
         
//         Ensure all component 'id' fields are unique and connections reference these IDs. Use a major cloud provider (e.g., AWS, Azure, GCP).
//     `;

//     try {
//         // Use the recommended model: gemini-2.5-flash
//         const result = await genAI.models.generateContent({
//             model: "gemini-2.5-flash",
//             contents: prompt,
//             config: {
//                 responseMimeType: "application/json",
//                 responseSchema: designSchema,
//             },
//         });
      
//         const responseText = result?.text?.trim();

//         if (!responseText) {
//             throw new Error("AI response was empty.");
//         }
      
//         // The response text is guaranteed to be JSON due to the configuration
//         const jsonResponse = JSON.parse(responseText);

//         // Basic validation to ensure schema compliance
//         if (!jsonResponse.design_rationale || !jsonResponse.components || !Array.isArray(jsonResponse.components)) {
//             throw new Error("AI response did not match expected schema.");
//         }

//         // 3. Save the design to the database
//         const design = await prisma.design.create({
//             data: {
//                 userId: session.user.id,
//                 name: `Design for ${applicationType} (${new Date().toISOString().split('T')[0]})`,
//                 diagramData: jsonResponse,
//                 isDeleted: false,
//             },
//         });
      
//         revalidatePath('/design'); // Invalidate cache for design list
      
//         return design.id;

//     } catch (error: unknown) {
//         console.error("Error generating or saving design:", error);
//         if (error instanceof Error) {
//             throw new Error(`Design generation failed: ${error.message}`);
//         }
//         throw new Error("An unexpected error occurred during design generation.");
//     }
// }
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

    await prisma.payment.create({
      data: {
        userId: session.user.id,
        planId: plan.id,
        razorpaySubscriptionId: subscription.id,
        status: "PENDING",
      },
    });

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
        
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_SERVER_HOST,
            port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
            secure: process.env.EMAIL_SERVER_PORT === "465",
            auth: {
                user: process.env.EMAIL_SERVER_USER,
                pass: process.env.EMAIL_SERVER_PASSWORD,
            },
        });
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
  const problem = await prisma.problem.findUnique({
    where: { id: problemId, isDeleted: false },
  });
  if (!problem) {
    throw new Error("Problem not found");
  }
  return problem;
}