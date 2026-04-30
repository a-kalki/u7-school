import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, basename } from 'path';

/**
 * SETTINGS
 */
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-3.1-flash-lite-preview'; // Actual model name
const OUTPUT_DIR = 'output';

/**
 * Get available courses from the output directory
 */
function getAvailableCourses() {
  if (!existsSync(OUTPUT_DIR)) return [];

  return readdirSync(OUTPUT_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name => existsSync(join(OUTPUT_DIR, name, 'syllabus.json')));
}

/**
 * Function to request summary from Gemini API
 */
async function getSummary(title, content) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  const prompt = `You are an educational course methodologist. Analyze the content of the lesson "${title}" and write a brief summary (2-4 sentences, approximately 300 characters).
Write only the summary text in English, without any introductory remarks or preamble.

LESSON CONTENT:
${content}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 200,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('  [!] Unexpected Gemini response structure:', JSON.stringify(data));
      return null;
    }

    let summary = data.candidates[0].content.parts[0].text.trim();
    return summary;
  } catch (error) {
    console.error(`  [!] Error:`, error.message);
    return null;
  }
}

/**
 * Function for testing a single file
 */
async function testSingleFile(filePath) {
  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  console.log(`\n=== MODEL TEST: ${MODEL} ===`);
  console.log(`File: ${filePath}`);

  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const firstLine = lines.find(l => l.trim().length > 0) || "";
  const title = firstLine.startsWith('#') ? firstLine.replace('#', '').trim() : basename(filePath);

  console.log(`Title: ${title}`);
  console.log(`Waiting for AI to respond...\n`);

  const summary = await getSummary(title, content);

  if (summary) {
    console.log(`--- OUTPUT ---`);
    console.log(summary);
    console.log(`--------------`);
  } else {
    console.log('Agent returned no output');
  }
}

/**
 * Main function to process a course (batch mode)
 */
async function enrichCourse(courseName) {
  const courseDir = join(OUTPUT_DIR, courseName);
  const syllabusPath = join(courseDir, 'syllabus.json');

  if (!existsSync(syllabusPath)) return;

  console.log(`\n>>> Processing course: ${courseName.toUpperCase()}`);
  const sections = JSON.parse(readFileSync(syllabusPath, 'utf-8'));

  let updated = false;
  for (const section of sections) {
    for (const lesson of section.lessons) {
      if (lesson.summary) continue;

      // Если mdFile нет в JSON, вычисляем его из URL
      let mdFile = lesson.mdFile;
      if (!mdFile && lesson.url) {
        const urlParts = lesson.url.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        mdFile = lastPart.includes('.') 
          ? lastPart.substring(0, lastPart.lastIndexOf('.')) + '.md'
          : lastPart + '.md';
      }

      if (!mdFile) continue;

      const mdPath = join(courseDir, mdFile);
      if (existsSync(mdPath)) {
        const content = readFileSync(mdPath, 'utf-8');
        process.stdout.write(`  [process] ${lesson.title} ... `);

        const summary = await getSummary(lesson.title, content);

        if (summary) {
          lesson.summary = summary;
          process.stdout.write(`Done.\n`);
          updated = true;
          // Save frequently to avoid losing progress
          writeFileSync(syllabusPath, JSON.stringify(sections, null, 2));
        }
      }
    }
  }

  if (!updated) {
    console.log(`  No new lessons to process for ${courseName}.`);
  }
}

/**
 * Entry point
 */
async function run() {
  const args = process.argv.slice(2);
  const available = getAvailableCourses();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: bun run enrich_syllabus.js [options]

Options:
  --all               Process all courses found in the output directory
  --course NAME(S)    Process specific courses (comma-separated: --course git,sql)
  --file PATH         Test the model on a single file
  --help              Show this help
    `);
    return;
  }

  // --- MODE: SINGLE FILE TEST ---
  const fileIdx = args.indexOf('--file');
  if (fileIdx !== -1 && args[fileIdx + 1]) {
    await testSingleFile(args[fileIdx + 1]);
    return;
  }

  // --- MODE: SPECIFIC COURSES ---
  const courseIdx = args.indexOf('--course');
  if (courseIdx !== -1 && args[courseIdx + 1]) {
    const targetNames = args[courseIdx + 1].split(',').map(s => s.trim().toLowerCase());
    for (const name of targetNames) {
      if (available.includes(name)) {
        await enrichCourse(name);
      } else {
        console.warn(`[!] Course "${name}" not found in output directory.`);
      }
    }
    return;
  }

  // --- MODE: ALL COURSES ---
  if (args.includes('--all')) {
    console.log(`Found ${available.length} courses: ${available.join(', ')}`);
    for (const course of available) {
      await enrichCourse(course);
    }
    console.log('\n--- ALL TASKS COMPLETED ---');
    return;
  }

  console.log('No mode selected. Use --all, --course, or --file. See --help for details.');
}

run().catch(console.error);
