# Monthly Report System

This directory contains the implementation of the Monthly Report system, which allows users to create, edit, and generate comprehensive monthly performance reports.

## Features

- **In-Application Highlight Entry**: Enter report highlights directly in the application with a structured form
- **Graph Integration**: Save and include graphs from the Metrics Trend Analysis page
- **LLM-Powered Report Generation**: Generate professional reports using the Perplexity API
- **PDF Export**: Export reports as professionally formatted PDFs with the 10X logo
- **Report Management**: Create, edit, and manage multiple reports
- **Browser Storage**: Store report data in the browser's localStorage for easy development and testing

## Architecture

The system is built using the following components:

### Storage

The system uses browser localStorage for data persistence in the current implementation:

- `monthly_reports`: Stores metadata about each report
- `report_highlights`: Stores the highlight content for each section of a report
- `report_graphs`: Stores saved graphs for inclusion in reports

A database schema has been defined for future implementation with Supabase.

### Components

- `ReportManager`: Manages the creation and selection of reports
- `ReportSection`: Displays a collapsible section of the report with highlight entry forms
- `HighlightEntryForm`: Form for entering highlights for a specific section
- `GraphManager`: Manages graphs associated with a report section
- `ReportGenerator`: Generates and previews the final report
- `SaveToReport`: Component for saving graphs from the metrics page to a report
- `Instructions`: Provides step-by-step guidance for using the system

### Context Provider

The `ReportProvider` manages the state of the current report, including:

- Loading and saving report data to localStorage
- Managing highlights and graphs
- Generating the report using the LLM

## Integration with Metrics System

The Monthly Report system integrates with the existing Metrics Trend Analysis system to allow users to:

1. Create and visualize metrics in the Metrics Trend Analysis page
2. Save those visualizations to a specific section of a monthly report
3. Reference the visualizations in the report text

## PDF Generation

The PDF generation uses the `@react-pdf/renderer` library to create professionally formatted PDFs with:

- 10X logo in the header
- Structured sections based on the report template
- Proper formatting of text, lists, and headings
- Footer with confidentiality notice

## Usage

1. **Create a Report**: Use the "Manage Reports" tab to create a new monthly report
2. **Enter Highlights**: Use the "Edit Report" tab to enter highlights for each section
3. **Add Graphs**: Use the Metrics Trend Analysis page to create and save graphs to the report
4. **Generate Report**: Use the "Generate Report" tab to create the final report using the LLM
5. **Export PDF**: Export the generated report as a PDF

## Implementation Notes

### Browser Storage

The current implementation uses the browser's localStorage for data persistence:

- `local-storage-fallback.ts` provides functions for CRUD operations on reports, highlights, and graphs
- Data is stored in JSON format in the browser's localStorage
- UUID generation is used to create unique IDs for reports, highlights, and graphs
- Timestamps are added for created_at and updated_at fields

This approach allows for easy development and testing without requiring a database setup.

## Future Enhancements

- **Database Integration**: Implement the Supabase database schema for persistent storage
- **Collaborative Editing**: Allow multiple users to work on the same report
- **Graph Embedding**: Embed graphs directly in the PDF rather than referencing them
- **Version History**: Track changes to reports over time
- **Approval Workflow**: Add an approval process for reports
- **Template Customization**: Allow customization of the report template
