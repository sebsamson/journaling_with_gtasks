/**
 * Journaling with GTasks
 * 
 * This Google Apps Script project facilitates reflective journaling and metacognition using Google Tasks and Google Spreadsheet.
 * It allows users to easily create journal entries using any Google Tasks app, including the native Google Tasks panel in Google Workspace.
 * The entries are then imported into a Google Spreadsheet, where they are automatically labeled and summarized using OpenAI’s GPT-3.5 Turbo.
 * 
 * To use this tool, you will need to create a new Google Apps Script project in your own Google Spreadsheet "App Sript" editor available under "Extensions" and copy the code from this file into the script editor.
 * The script uses the Tasks API and the Sheet API which need to be added manually to the Services in the App Script Editor
 * You will also need to set up a Google Spreadsheet with the appropriate named ranges and columns to store the imported tasks and their associated labels and summaries.
 * See the README file in this repository for more detailed instructions on how to set up and use this tool.
 */


// This function imports tasks from a specified Google Tasks list into the spreadsheet
function importTasksToSpreadsheet() {
  // Get the active spreadsheet and the "Tasks Import" sheet
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Tasks Import');
  
  // Find the last row with content
  var lastRow = sheet.getLastRow();
  
  // Get an array of task IDs that are already in the table
  var taskIdColumn = getColumnFromNamedRange('TaskIdColumn');
  var taskIds = sheet.getRange(2, taskIdColumn, lastRow - 1).getValues().flat();
  
  // Get the task list name from the named range
  var listNameRange = ss.getRangeByName('var_listName');
  var listName = listNameRange.getValue();
  
  // Get the task list ID by name
  var taskListId = getTaskListIdByName(listName);
  
  // Get all tasks from the specified task list, including hidden tasks
  var tasks = Tasks.Tasks.list(taskListId, {showHidden: true}).getItems();
  
  // Sort the tasks by their updated date
  tasks.sort(function(a, b) {
    return new Date(a.getUpdated()) - new Date(b.getUpdated());
  });
  
  // Create an array of task IDs that are in the task list
  var taskListIds = tasks.map(function(task) {
    return task.getId();
  });
  
  // Delete rows from the sheet if their task ID is not found in the task list
  for (var i = lastRow; i >= 2; i--) {
    var taskId = sheet.getRange(i, taskIdColumn).getValue();
    if (taskListIds.indexOf(taskId) === -1) {
      sheet.deleteRow(i);
    }
  }
  
  // Loop through all tasks in the task list
  for (var i = 0; i < tasks.length; i++) {
    var task = tasks[i];
    var taskId = task.getId();
    
    // Check if the task is already in the table
    if (taskIds.indexOf(taskId) === -1) {
      // If it is not, add a new row to the table with the task data
      var creationDate = new Date(task.getUpdated());
      var title = task.getTitle();
      var description = task.getNotes();
      var parentTaskId = task.getParent();
      var parentTaskName = '';
      var parentTaskDescription = '';
      if (parentTaskId) {
        // If the task has a parent, get its name and description
        var parentTask = Tasks.Tasks.get(taskListId, parentTaskId);
        parentTaskName = parentTask.getTitle();
        parentTaskDescription = parentTask.getNotes();
      }
      var modifiedDate = task.getUpdated();
      sheet.appendRow([taskId, creationDate, modifiedDate, parentTaskName, parentTaskDescription, title, description]);
    } else {
      // If the task is already in the table, check if its modified date is newer than the current one
      var rowIndex = taskIds.indexOf(taskId) + 2;
      var modifiedDateColumn = getColumnFromNamedRange('ModifiedDateColumn');
      var currentModifiedDate = new Date(sheet.getRange(rowIndex, modifiedDateColumn).getValue());
      var newModifiedDate = new Date(task.getUpdated());
      if (newModifiedDate > currentModifiedDate) {
        // If it is newer, update the row with the new data
        var titleColumn = getColumnFromNamedRange('TitleColumn');
        sheet.getRange(rowIndex, titleColumn).setValue(task.getTitle());
        var descriptionColumn = getColumnFromNamedRange('DescriptionColumn');
        sheet.getRange(rowIndex, descriptionColumn).setValue(task.getNotes());
        sheet.getRange(rowIndex, modifiedDateColumn).setValue(newModifiedDate);
        updateJournalEntry(rowIndex);
      }
    }
  }
}

// This function returns the ID of a Google Tasks list with a specified name
function getTaskListIdByName(name) {
  // Get all Google Tasks lists for the user
  var taskLists = Tasks.Tasklists.list().getItems();
  
  // Loop through all lists and find one with a matching name
  for (var i = 0; i < taskLists.length; i++) {
    var taskList = taskLists[i];
    if (taskList.getTitle() == name) {
      return taskList.getId();
    }
  }
  
  // Return null if no matching list was found
  return null;
}

// This function returns the column number of a named range in a spreadsheet
function getColumnFromNamedRange(namedRange) {
  // Get the active spreadsheet and named range
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var range = ss.getRangeByName(namedRange);
  
  // Return the column number of the named range
  return range.getColumn();
}

// This function processes all journal entries in the spreadsheet
function processJournalEntries() {
  // Get the active spreadsheet and sheet
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  
  // Get the named ranges for the data, subject, labels, and summary columns
  var dataRange = ss.getRangeByName('myDataRange');
  var subjectRange = ss.getRangeByName('mySubjectRange');
  var labelsRange = ss.getRangeByName('myLabelsRange');
  var summaryRange = ss.getRangeByName('mySummaryRange');
  
  // Check if all named ranges were found
  if (dataRange != null && subjectRange != null && labelsRange != null && summaryRange != null) {
    // Get the data from the data range
    var range = dataRange.getA1Notation();
    var lastRow = sheet.getLastRow();
    var data = sheet.getRange(range).getValues();
    
    // Loop through all rows in the data range
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      // Concatenate all the columns of the data range for the current row
      var text = row.join('');
      if (text !== '') {
        // Check if the subject column is empty
        if (sheet.getRange(subjectRange.getRow() + i, subjectRange.getColumn()).getValue() === '') {
          // Call the prompt_Journaling function to get a result for the current row
          var result = prompt_Journaling(text);
          Logger.log('process - Result from prompt_Journaling: ' + result);
          if (result.length > 0) {
            // Parse the result using the provided formatting
            var parts = result[0].split('|');
            var subject = parts[0];
            var labels = parts[1];
            var summary = parts[2];
            // Add the parsed result to the subject, labels, and summary columns
            sheet.getRange(subjectRange.getRow() + i, subjectRange.getColumn()).setValue(subject);
            sheet.getRange(labelsRange.getRow() + i, labelsRange.getColumn()).setValue(labels);
            sheet.getRange(summaryRange.getRow() + i, summaryRange.getColumn()).setValue(summary);
          }
        }
      }
    }
  } else {
    // Handle case where one or more named ranges were not found
    Logger.log('One or more named ranges not found');
  }
}

// This function updates a single journal entry in the spreadsheet
function updateJournalEntry(rowIndex) {
  // Get the active spreadsheet and sheet
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  
  // Get the named ranges for the data, subject, labels, and summary columns
  var dataRange = ss.getRangeByName('myDataRange');
  var subjectRange = ss.getRangeByName('mySubjectRange');
  var labelsRange = ss.getRangeByName('myLabelsRange');
  var summaryRange = ss.getRangeByName('mySummaryRange');
  
  // Check if all named ranges were found
  if (dataRange != null && subjectRange != null && labelsRange != null && summaryRange != null) {
    // Get the data for the specified row
    var row = sheet.getRange(rowIndex, dataRange.getColumn(), 1, dataRange.getNumColumns()).getValues()[0];
    // Concatenate all the columns of the data range for the current row
    var text = row.join('');
    if (text !== '') {
      // Erase the content of the subject, labels, and summary columns
      sheet.getRange(subjectRange.getRow() + rowIndex - 1, subjectRange.getColumn()).setValue('');
      sheet.getRange(labelsRange.getRow() + rowIndex - 1, labelsRange.getColumn()).setValue('');
      sheet.getRange(summaryRange.getRow() + rowIndex - 1, summaryRange.getColumn()).setValue('');
      // Update the cells with a new journaling prompt
      var result = prompt_Journaling(text);
      Logger.log('Update - Result from prompt_Journaling: ' + result);
      if (result.length > 0) {
        // Parse the result using the provided formatting
        var parts = result[0].split('|');
        var subject = parts[0];
        var labels = parts[1];
        var summary = parts[2];
        // Add the parsed result to the subject, labels, and summary columns
        sheet.getRange(subjectRange.getRow() + rowIndex - 1, subjectRange.getColumn()).setValue(subject);
        sheet.getRange(labelsRange.getRow() + rowIndex - 1, labelsRange.getColumn()).setValue(labels);
        sheet.getRange(summaryRange.getRow() + rowIndex - 1, summaryRange.getColumn()).setValue(summary);
      }
    }
  } else {
    // Handle case where one or more named ranges were not found
    Logger.log('One or more named ranges not found');
  }
}

// This function sends a journaling prompt to OpenAI's GPT-3.5 Turbo model and returns its response
function prompt_Journaling(prompt) {
  // Set the URL for the OpenAI API
  const url = 'https://api.openai.com/v1/chat/completions';

  // Create the request object
  const request = {
    messages: [
      { "role": "user", "content": "You are a 'reflective writing' log assistant. Never answer questions I ask myself. This is the next entry in my journal: " },
      { "role": "user", "content": prompt },
      { "role": "user", "content": ". Answer to this entry with a short tracking summary in a strict format like this respecting the separators '|'structure: 'SUBJECT (text maximum 6 words explaining the subject of the entry)|LABELS [labelA, labelB, ...]|REFLECTIVE WRITING SUBJECT (text. maximum 140 characters)'. Example: 'reflections on thinking|Reflection, Metacognition|Reflecting on strategies to reinforce self-awareness of one's own thinking process.'. respect this layout. do not add any additional sections. " },
    ],
    model: 'gpt-3.5-turbo',
    temperature: 0.1,
    top_p: 1,
    max_tokens: 50,
    frequency_penalty: 1,
    presence_penalty: 1
  };

  // Call the promptGPT function to send the request to OpenAI and get its response
  var contents = promptGPT(request, url);

  // Log the response
  Logger.log(contents);
  
  // Return the response
  return contents;
}


// This function sends a request to the OpenAI API and returns its response
function promptGPT(request, url) {
  // Set the maximum number of attempts to send the request
  const maxAttempts = 5;
  // Set whether to return usage information in the response
  const returnUsage = false;
  // Create an array to store the response contents
  var contents = [];
  // Set the exponential base for delay calculation
  const delayBase = 2;
  
  // Get the API key from the named range
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var apiKeyRange = ss.getRangeByName('var_apiKey');
  var apiKey = apiKeyRange.getValue();

  // Create the headers for the request
  const data = {
    contentType: "application/json",
    headers: { Authorization: "Bearer " + apiKey },
    payload: JSON.stringify(request),
  };

  // Initialize the attempt counter and success flag
  var attempt = 0;
  var success = false;
  var response;

  // Loop until the request is successful or the maximum number of attempts is reached
  while (!success && attempt < maxAttempts) {
    try {
      // Send the request to the OpenAI API and parse its response
      response = JSON.parse(UrlFetchApp.fetch(url, data).getContentText());

      // Add the response message to the return array
      contents.push(response.choices[0].message.content);
      
      if (returnUsage) {
        // If return usage is enabled, add the prompt_tokens and completion_tokens to the return array
        contents.push(response.usage.prompt_tokens);
        contents.push(response.usage.completion_tokens);
      }

      // If no error is thrown, then the operation is successful
      success = true;
    } catch (error) {
      // Handle the error and retry with exponential delay
      Logger.log('Attempt %s failed with error: %s. Retrying...', attempt + 1, error);
      
      Utilities.sleep(Math.pow(delayBase, attempt) * 1000); // Delay before retrying (in milliseconds)
      attempt++;
    }
  }

  if (!success) {
    // If all attempts failed, throw an error
    throw new Error('All attempts failed. Please check your request and try again.');
  }

  // Return the response contents
  return contents;
}


// This function runs when the spreadsheet is opened
function onOpen() {
  // Get the user interface for the spreadsheet
  var ui = SpreadsheetApp.getUi();
  
  // Create a new menu called "Journaling" in the menu bar
  ui.createMenu('Journaling')
    // Add an item to the menu called "Process Entries" that runs the "processJournalEntriesWrapper" function when clicked
    .addItem('Process Entries', 'processJournalEntriesWrapper')
    // Add the menu to the user interface
    .addToUi();
}

// This function is called when the user clicks on the "Process Entries" menu item
function processJournalEntriesWrapper() {
  // Import tasks from Google Tasks into the spreadsheet
  importTasksToSpreadsheet();
  // Process the imported journal entries
  processJournalEntries();
}
