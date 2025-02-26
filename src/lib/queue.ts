import { getDb } from "./db";
import { rawData, processedData, sessions } from "./schema";
import { eq } from "drizzle-orm";
import crypto from 'crypto';

// Define the queue item type
interface QueueItem {
  sessionId: string;
  rawDataId: string;
}

// Simple queue
export const processQueue: QueueItem[] = [];
let isProcessing = false;

// Function to process a single item
async function processItem(item: QueueItem) {
  const db = getDb();
  
  try {
    console.log(`Processing item: sessionId=${item.sessionId}, rawDataId=${item.rawDataId}`);
    
    // Update session status
    await db.update(sessions)
      .set({ status: 'processing' })
      .where(eq(sessions.id, item.sessionId));
    
    // Get the raw data
    const rawDataRecord = await db.select()
      .from(rawData)
      .where(eq(rawData.id, item.rawDataId))
      .get();
    
    if (!rawDataRecord) {
      throw new Error(`Raw data not found with ID: ${item.rawDataId}`);
    }
    
    // Parse the raw data
    let parsedData;
    try {
      parsedData = JSON.parse(rawDataRecord.data);
      console.log("Successfully parsed data for session");
    } catch (error) {
      console.error("Error parsing data:", error);
      throw new Error("Failed to parse JSON data");
    }
    
    // Clean and prepare the data
    const cleanedData = cleanAndPrepareData(parsedData);
    
    // Call LLM with the cleaned data
    const llmResponse = await callLLMWithData(cleanedData);
    
    // Store the processed data
    await db.insert(processedData).values({
      id: crypto.randomUUID(),
      sessionId: item.sessionId,
      data: JSON.stringify(llmResponse),
      processedAt: new Date().toISOString()
    });
    
    // Update session status
    await db.update(sessions)
      .set({ status: 'complete' })
      .where(eq(sessions.id, item.sessionId));
      
    console.log(`Processing complete for session: ${item.sessionId}`);
  } catch (error) {
    console.error(`Error processing item ${item.sessionId}:`, error);
    
    // Update session status to error
    await db.update(sessions)
      .set({ status: 'error' })
      .where(eq(sessions.id, item.sessionId));
  }
}

// Function to clean and prepare data
function cleanAndPrepareData(data: any) {
  // Check if data has the expected structure
  if (!data || !Array.isArray(data.data)) {
    console.warn("Data doesn't have expected structure:", data);
    return { concatenatedText: "", screenData: [] };
  }
  
  // Extract and concatenate all text content from OCR items
  let concatenatedText = "";
  const screenData = [];
  
  // Sort the data by timestamp to maintain chronological order
  const sortedData = [...data.data].sort((a, b) => {
    return new Date(a.content.timestamp).getTime() - new Date(b.content.timestamp).getTime();
  });
  
  for (const item of sortedData) {
    if (item.type === "OCR" && item.content && item.content.text) {
      // Add to the concatenated text with separators for readability
      if (item.content.text.trim()) {
        concatenatedText += item.content.text + "\n\n---\n\n";
        
        // Create a structured item for each screen capture
        screenData.push({
          timestamp: item.content.timestamp,
          windowName: item.content.windowName || "Unknown",
          url: item.content.browserUrl || "Unknown",
          text: item.content.text
        });
      }
    }
  }
  
  return {
    concatenatedText,
    screenData,
    totalItems: data.data.length,
    captureTimespan: data.data.length > 0 ? {
      start: data.data[0].content.timestamp,
      end: data.data[data.data.length - 1].content.timestamp
    } : null
  };
}

// Function to call LLM with the cleaned data
// Function to call LLM with the cleaned data
async function callLLMWithData(cleanedData: any) {
    console.log("Calling LLM with cleaned data");
    
    // 1. Create the system prompt with very clear instructions
    const systemPrompt = `
  You are JobExtractorGPT, a specialized AI that extracts detailed job posting information from LinkedIn screen captures.
  
  ## TASK
  Analyze the provided text from LinkedIn screen captures and extract ONLY job posting information.
  Return the data as a clean, structured JSON object.
  
  ## INPUT FORMAT
  You will receive text content from multiple LinkedIn screen captures. The same job posting may appear in multiple captures.
  
  ## OUTPUT FORMAT - JSON
  Respond with a valid JSON object with the following structure:
  {
    "jobPostings": [
      {
        "id": "1", 
        "role": "Frontend Engineer", 
        "company": "Company Name", 
        "poster": "Recruiter Name", 
        "location": "Bengaluru", 
        "salaryInfo": "Up to 230 LPA", 
        "experienceRequired": "3-5 YOE", 
        "skills": ["React", "Angular", "JavaScript"], 
        "applyInfo": {
          "link": "https://link-to-apply.com", 
          "email": "example@email.com", 
          "deadline": "2025-03-08", 
          "instructions": "Available for in-person interview on 8th March 2025"
        },
        "description": "Brief description of the job", 
        "postedTime": "6h ago", 
        "rawText": "Original job posting text" 
      }
    ],
    "count": 1, 
    "summary": "Found 1 job posting during LinkedIn browsing session"
  }
  
  ## RULES
  1. Extract ONLY job postings - ignore all other content
  2. Deduplicate job postings that appear multiple times
  3. Extract as much information as possible for each field
  4. Return ONLY the JSON object
  5. If no job postings are found, return an empty jobPostings array
  6. Ensure the JSON is valid and properly formatted
  7. Include the raw text of each job posting in the rawText field
  8. Do not include any explanatory text outside the JSON object
  9. Be precise with the extraction, especially for URLs and contact information
  
  ## EXAMPLE OUTPUT - JSON
  {
    "jobPostings": [
      {
        "id": "1",
        "role": "Frontend Engineer",
        "company": "ABC Tech",
        "poster": "Jane Smith",
        "location": "Bengaluru",
        "salaryInfo": "Up to 230 LPA",
        "experienceRequired": "3-5 YOE",
        "skills": ["React", "Angular", "JavaScript", "HTML", "CSS"],
        "applyInfo": {
          "link": "https://linkd.in/example",
          "email": "",
          "deadline": "2025-03-08",
          "instructions": "Apply only if available for in-person interview on 8th March 2025"
        },
        "description": "We're hiring a Frontend Engineer with expertise in React/Angular for our product company",
        "postedTime": "6h ago",
        "rawText": "* Hiring: Frontend Engineer | Bengaluru | Up to 230 LPA We're hiring a Frontend Engineer (3-5 YOE) with expertise in React/Angular, JavaScript, HTML, CSS"
      }
    ],
    "count": 1,
    "summary": "Found 1 job posting during LinkedIn browsing session"
  }
  `;
  
    // 2. Call the DeepSeek LLM API with the system prompt and cleaned data
    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` // Replace with your actual API key
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: cleanedData.concatenatedText
            }
          ],
          temperature: 0.1, // Low temperature for more deterministic output
          response_format: { type: "json_object" }, // Request JSON format
          max_tokens: 4000 // Set a reasonable limit to avoid truncation
        })
      });
      
      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();

      console.log("response data is", responseData)
      
      // Parse the response from DeepSeek
      let llmResponse;
      try {
        // Check if the content is empty
        if (!responseData.choices[0].message.content || 
            responseData.choices[0].message.content.trim() === '') {
          console.warn("DeepSeek API returned empty content");
          return {
            jobPostings: [],
            count: 0,
            summary: "No job postings were extracted due to API limitation."
          };
        }
        
        // Parse the JSON response
        llmResponse = JSON.parse(responseData.choices[0].message.content);

        console.log("llm response is", llmResponse)
        
        // Validate the structure
        if (!llmResponse.jobPostings) {
          llmResponse.jobPostings = [];
        }
        
        if (typeof llmResponse.count !== 'number') {
          llmResponse.count = llmResponse.jobPostings.length;
        }
        
        if (!llmResponse.summary) {
          llmResponse.summary = `Found ${llmResponse.jobPostings.length} potential job postings during LinkedIn browsing session.`;
        }
        
        return llmResponse;
      } catch (parseError) {
        console.error("Error parsing LLM response:", parseError);
        console.error("Raw response:", responseData.choices[0].message.content);
        
        // If parsing fails, return a structured error response
        return {
          jobPostings: [],
          count: 0,
          summary: "Failed to parse job postings due to invalid JSON from LLM.",
          error: parseError,
          rawResponse: responseData.choices[0].message.content
        };
      }
    } catch (error) {
      console.error("Error calling DeepSeek LLM API:", error);
      return {
        jobPostings: [],
        count: 0,
        summary: "Error processing job postings.",
        error: error
      };
    }
  }

// Worker function to continuously process the queue
async function worker() {
  if (isProcessing || processQueue.length === 0) {
    // Schedule next check
    setTimeout(worker, 1000);
    return;
  }
  
  isProcessing = true;
  
  try {
    const item = processQueue.shift();
    if (item) {
      await processItem(item);
    }
  } catch (error) {
    console.error("Worker encountered an error:", error);
  } finally {
    isProcessing = false;
    // Schedule next check
    setTimeout(worker, 1000);
  }
}

// Start the worker
worker();