# Journaling with GTasks

## Introduction

This tool uses Google Tasks and Google Spreadsheet to facilitate reflective journaling and metacognition. It allows users to easily create journal entries using any Google Tasks app, including the native Google Tasks panel in Google Workspace. The entries are then imported into a Google Spreadsheet, where they are automatically labeled and summarized using OpenAI’s GPT-3.5 Turbo.
## Purpose

The main purpose of this tool is to help users grow and learn through reflective writing. By making it easy to create journal entries and providing insights into their content, the tool encourages users to engage in regular self-reflection and metacognition.

## Intended Audience

The intended audience for this tool is anyone who is interested in using reflective writing as a tool for personal growth and learning. 

## Requirements

### Functional Requirements

- **Frictionless and Intuitive Journal Entries:** The tool should provide an easy and intuitive way for users to create journal entries using any Google Tasks app, including the native Google Tasks panel in Google Workspace. This will encourage users to engage in regular journaling about anything that comes to mind.
- **Automatic Labeling and Summarizing of Entries:** The tool should automatically label and summarize journal entries as they are imported into a Google Spreadsheet. This will make it easier for users to review and analyze their entries at a later time.
  
### Non-Functional Requirements

- **Usability of Data for Insights:** The data collected by the tool should be easily usable for generating insights into the user’s journaling habits and the content of their entries. This will help users make the most of the tool and achieve their personal growth goals.

## Design

### Data Structures

The tool uses a Google Spreadsheet to store the imported tasks and their associated labels and summaries. Each row in the spreadsheet represents a single task, with columns for the task ID, creation date, modified date, parent task name, parent task description, title, and description. Additional columns are used to store the labels and summaries generated by OpenAI’s GPT-3.5 Turbo.

### Algorithms

The tool uses several algorithms to fetch tasks from a specified Google Tasks list, import them into a Google Spreadsheet, send them to OpenAI’s GPT-3.5 Turbo for analysis, and add the resulting labels and summaries to the spreadsheet. These algorithms are implemented using App Script and make use of the Tasks API and Sheet API to interact with Google Tasks and Google Spreadsheet.

### Interfaces

The tool provides a user interface in the form of a Google Spreadsheet, where users can view the imported tasks and their associated labels and summaries.

## Implementation

The tool is implemented using App Script, along with several APIs provided by Google (Tasks API, Sheet API) and OpenAI (GPT-3.5 Turbo).

## Getting Started

To get started with using this tool, you can make a copy of this [Google Spreadsheet](https://docs.google.com/spreadsheets/d/17E_Q152dVUw7MTGq_MCB-hyDpCzgmYTjjvaaBOIuG0c/edit?usp=sharing) for your own use.
