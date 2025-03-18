# Monthly Report Direct Implementation

## Overview

This document outlines the implementation of a direct approach to generating monthly reports using Claude 3.7 Sonnet Extended. The direct approach reads the system prompt, outline file, and metrics data file directly and passes them to the LLM in a single API call, rather than generating content for each section separately.

## Implementation Details

### 1. New API Route

Created a new API route at `app/api/monthly-report-direct/route.ts` that:

- Reads the system prompt from `monthlyrptsysprompt.txt`
- Reads the outline file from `Monthly Report Outline - 03-14-2025.docx.txt`
- Reads the metrics data from `10X Business Metrics - 03-06-2025e.csv`
- Combines them into a single prompt
- Calls one of three APIs based on user selection:
  - Anthropic API (using Claude 3.5 Sonnet)
  - OpenAI API (using GPT-4o)
  - Perplexity API
- Returns the generated report

### 2. Report Context Update

Updated `app/monthly-report/report-context.tsx` to add:

- A new `LlmProvider` type in `types/report.ts` for selecting between 'anthropic' and 'perplexity'
- A new field `llm_provider` in the `ReportTemplate` interface to store the selected provider
- A new function `updateLlmProvider()` to update the provider preference
- Modified the `generateReportDirect()` function to pass the provider preference to the API

### 3. UI Update

Updated `app/monthly-report/components/ReportGenerator.tsx` to:

- Import the new `generateReportDirect` function and `updateLlmProvider` from the report context
- Add a new handler function `handleGenerateReportDirect`
- Add a new "Generate Direct" button to the UI
- Add checkboxes for selecting between Anthropic (Claude) and Perplexity LLM providers

## Usage

1. Create a new report or select an existing one
2. Click the "Generate Direct" button
3. The system will:
   - Call the API with the report title
   - The API will read the system prompt, outline, and metrics data files
   - The API will call Claude 3.7 Sonnet Extended with the combined prompt
   - The generated report will be displayed in the UI

## Benefits

- Simpler approach that doesn't require generating content for each section separately
- Potentially faster since it only makes one API call
- May produce more coherent reports since the LLM sees all the data at once
- Optimized token limits for each provider:
  - Anthropic (Claude 3.5): 8,192 max tokens output
  - OpenAI (GPT-4o): 4,000 max tokens output
- Provides flexibility to choose between different LLM providers:
  - Anthropic (Claude 3.5): High-quality reports with excellent reasoning
  - OpenAI (GPT-4o): State-of-the-art model with strong business analysis capabilities
  - Perplexity: Alternative option with different strengths

## Configuration

All API keys are read from `.env.local` file, with the following environment variables:

```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

The implementation includes a fallback mechanism for both providers that:

1. First tries to read the API keys from the environment variables (which should include `.env.local`)
2. If that fails, it attempts to read the `.env.local` file directly
3. If both methods fail, it returns a clear error message

This ensures the API keys are properly loaded even if there are issues with the Next.js environment variable loading.

## Files Modified

1. Created `app/api/monthly-report-direct/route.ts`
2. Updated `app/monthly-report/report-context.tsx`
3. Updated `app/monthly-report/components/ReportGenerator.tsx`
