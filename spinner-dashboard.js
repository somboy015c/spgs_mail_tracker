// Authcheck
// Check if the user is not logged in
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('authToken'); // Replace with sessionStorage if applicable
  if (!token) {
    window.location.href = 'index.html';
  }
});


// tokenExpiry.js

// Function to check token expiry
function startTokenExpiryCheck() {
  setInterval(() => {
    const expiryTime = localStorage.getItem('tokenExpiry');
    const currentTime = Date.now();

    if (expiryTime && currentTime >= parseInt(expiryTime, 10)) {
      // Token expired, clear localStorage and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('tokenExpiry');
      Swal.fire({
        title: '<span style="font-family: Arial, sans-serif; font-size: 18px;">Session expired. Please log in again.</span>',
        icon: 'warning',
        showCancelButton: false,
        confirmButtonText: '<span style="color: white;">Log in</span>',
        cancelButtonText: 'Cancel',
        customClass: {
            confirmButton: 'custom-confirm-button',
            cancelButton: 'custom-cancel-button'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = 'index.html';
        }
    });
    }
  }, 60000); // Check every 60 seconds
}

// Automatically start token expiry check when the file is loaded
startTokenExpiryCheck();



// Function to fetch and return the current user
async function fetchCurrentUser() {
  const endpoint = 'https://tracking-system-backend.vercel.app/auth/office';
  const token = localStorage.getItem('authToken');
  try {
    // Fetch data from the endpoint with the Authorization header
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`, // Add the Bearer token
        'Content-Type': 'application/json'
      }
    });

    // Check if the response is OK
    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }
    // Parse the JSON response
    const user = await response.json();
    console.log('Current User:', user);
    return user;

  } catch (error) {
    console.error('Error fetching current user:', error);
    return null; // Return null in case of an error
  }
}


// Function to fetch and return office by id
async function getOfficeById(user_id) {
  const endpoint = `https://tracking-system-backend.vercel.app/office/${user_id}`;
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}` // Include token if required
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json(); // Parse response as JSON
    console.log("Office data fetched successfully:", data); // For debugging
    return data; // Return the office data
  } catch (error) {
    console.error("Error fetching office data:", error);
    return null; // Return null in case of an error
  }
}


// Example usage of the function
async function populateDashboard() {
  const user = await fetchCurrentUser();
  if (user && user.office) {
    document.getElementById('office').textContent = user.office.office_name;
    document.getElementById('owner').textContent = user.office.admin_name+"'s Office";
  } else {
    console.error('Failed to populate dashboard: User or office data is unavailable.');
  }
}

// get office name
async function getOfficeName(user_id) {
  const officeData = await getOfficeById(user_id);
  if (officeData && officeData.office && officeData.office.admin_name) {
    return officeData.office.admin_name; // Access admin_name here
  } else {
    console.error("Admin name not found in the office data.");
    return null; // Return null if admin_name is not found
  }
}

// Call the populateDashboard function on page load or as needed
populateDashboard();




// Function to fetch all mails
async function fetchAllMails() {
    try {
        const response = await fetch('https://tracking-system-backend.vercel.app/documents');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json(); // Ensure response is parsed as JSON
        const data = result.documents; // Extract the documents array

        console.log('Documents Data:', data); // Debugging line

        if (!Array.isArray(data)) {
            throw new TypeError('Expected documents to be an array');
        }

        return data; // Return the array of mails
    } catch (error) {
        console.error('Error fetching mails:', error);
        throw error; // Re-throw error for the caller to handle
    }
}


// Function to calculate mail stats
function calculateMailStats(mails) {
    if (!Array.isArray(mails)) {
        throw new TypeError('Expected an array of mails');
    }

    // Calculate stats
    const totalItems = mails.length;
    const processingCount = mails.filter(item => item.status !== 'approved' && item.status !== 'rejected').length;
    const approvedCount = mails.filter(item => item.status === 'approved').length;
    const rejectedCount = mails.filter(item => item.status === 'rejected').length;

    return {
        totalItems,
        processingCount,
        approvedCount,
        rejectedCount,
    };
}

// Example usage
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const allMails = await fetchAllMails(); // Get all mails
        const mailStats = calculateMailStats(allMails); // Get stats

        // Display stats on the page
        document.getElementById('all_mails').textContent = mailStats.totalItems;
        document.getElementById('processing_mails').textContent = mailStats.processingCount;
        document.getElementById('approved_mails').textContent = mailStats.approvedCount;
        document.getElementById('rejected_mails').textContent = mailStats.rejectedCount;
    } catch (error) {
        console.error('Error loading mail stats:', error);
    }
});


function formatDate(dateString) {
    const date = new Date(dateString);

    const options = { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
    };

    // Format the day with ordinal suffix
    const day = date.getDate();
    const dayWithSuffix = `${day}${getOrdinalSuffix(day)}`;

    // Combine the formatted parts
    const formattedDate = `${date.toLocaleString('default', { month: 'long' })}, ${dayWithSuffix} ${date.getFullYear()}`;

    return formattedDate;
}

function getOrdinalSuffix(day) {
    if (day > 3 && day < 21) return 'th'; // covers 4th-20th
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}









// Function to populate the table
async function populateTable() {
    try {
        const mails = await fetchAllMails(); // Fetch mails data
        const tableBody = document.getElementById('mails-table-body');
        tableBody.innerHTML = ''; // Clear existing rows

        for (const mail of mails) { // Use for...of loop for async operations
            const office_id = mail.submitted_to; // Fetch office ID
            let office = '';
            let location = '';
            let created_by = '';
            if (office_id !== undefined) {
                try {
                    office = await getOfficeName(office_id); // Wait for async function
                    location = await getOfficeName(mail.current_location);
                    created_by = await getOfficeName(mail.created_by);
                } catch (error) {
                    console.error(`Error fetching office name for ID ${office_id}:`, error);
                    office = 'Unknown Office'; // Fallback value
                    location = 'Unknown Office'; // Fallback value
                    created_by = 'Unknown Office'; // Fallback value
                }
            } else {
                office = 'None';
                location = 'None';
            }

            const row = document.createElement('tr');
            row.setAttribute('onclick', 'showDetails(this)'); // Add click handler
            // Extract data from the row

            // Populate row cells
            row.innerHTML = `
                <td>${mail.doc_id}</td>
                <td>${mail.title}</td>
                <td>${mail.reference_number}</td>
                <td>${office}</td>
                <td>${mail.submitted_by}</td>
                <td>${mail.status}</td>
                <td>${formatDate(mail.last_modified)}</td>
                <!-- Hidden data for full details -->
                <td style="display: none;">${formatDate(mail.creation_date)}</td>
                <td style="display: none;">At the ${location}'s office</td>
                <td style="display: none;">The ${created_by}</td>
                <td style="display: none;">${JSON.stringify(mail.progress)}</td>
                <td style="display: none;">${mail.last_modified}</td>
                <td style="display: none;">${mail._id}</td>
                <td style="display: none;">${mail.submitted_to}</td>
                <td style="display: none;">${mail.created_by}</td>
            `;
            tableBody.appendChild(row); // Append row to table body
        }
    } catch (error) {
        console.error('Error populating table:', error);
    }
}



// Function to fetch all offices
async function fetchAllOffices() {
    try {
        const response = await fetch('https://tracking-system-backend.vercel.app/offices');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json(); // Parse response as JSON
        const data = result.offices; // Extract the offices array

        console.log('Offices Data:', data); // Debugging line

        if (!Array.isArray(data)) {
            throw new TypeError('Expected offices to be an array');
        }

        return data; // Return the array of offices
    } catch (error) {
        console.error('Error fetching offices:', error);
        throw error; // Re-throw error for the caller to handle
    }
}


// Function to populate the destination select dropdown with fetched offices
async function populateDetailsDestinationSelect() {
    const selectElement = document.getElementById('destination-select');

    try {
        const offices = await fetchAllOffices(); // Fetch all offices

        // Clear existing options except the first one
        selectElement.innerHTML = '<option value="">Select Destination</option>';

        // Add each office to the select dropdown
        offices.forEach(office => {
            const option = document.createElement('option');
            option.value = office._id; // Use office ID as the value
            option.textContent = office.admin_name+"'s office"; // Use office name as the display text
            selectElement.appendChild(option);
        });

        // Optionally, display the select if hidden
        selectElement.style.display = 'block';
        console.log('Destination select populated successfully');
    } catch (error) {
        console.error('Error populating destination select:', error);
    }
}




function convertDateToFormat(inputDate) {
    // Remove any commas, "st", "nd", "rd", "th" from the input
    const sanitizedDate = inputDate.replace(/,|st|nd|rd|th/g, "");

    // Parse the sanitized date string into a Date object
    const dateObject = new Date(sanitizedDate);

    // Check if the date is valid
    if (isNaN(dateObject)) {
        throw new Error("Invalid date format");
    }

    // Format the date in the desired format
    const formattedDate = dateObject.toDateString(); // Example: "Thu Dec 19 2024"
    return formattedDate;
}




// Convert CSVs to array with default values for missing fields
async function parseInput(progress, submittedTo, created_by, lastModified, status) {
    // Parse the CSV into an array of objects
    const parsedProgress = progress.split(',').map(item => {
        let [office, date = "pending", status = "pending"] = item.split(':'); // Default values for missing fields
        return {
            office: office,
            date: date.trim(),
            status: status.trim()
        };
    });

    if (status === 'pending') {
      date = 'Not Acknowledged';
      stat = 'waiting';
    } else if (status === 'rejected') {
      date = 'discarded';
      stat = 'rejected';
    } else {
      date = 'processing';
      stat = 'current';
    } 
    // Sample first and last elements
    const sampleFirstElement = { office: created_by, date: "processing", status: "current" };
    const sampleLastElement = { office: submittedTo, date: "Pending", status: "pending" };

    // Check and handle the first element
    if (parsedProgress.length === 1) {
        parsedProgress[0] = sampleFirstElement;
        parsedProgress.push(sampleLastElement);
    }else{
        // // Check and handle the last element
        let lastElement = parsedProgress[parsedProgress.length - 1];
        if (lastElement?.office === sampleLastElement.office && status === "approved") {
            lastModified = convertDateToFormat(lastModified);
            parsedProgress[parsedProgress.length - 1] = { office: submittedTo, date: lastModified, status: "completed" };
        }else if (lastElement?.office === sampleLastElement.office && status !== "approved") {
            parsedProgress[parsedProgress.length - 1] = { office: submittedTo, date: date, status: stat };
        }

        if (lastElement?.office !== sampleLastElement.office) {
            parsedProgress[parsedProgress.length - 1].status = stat;
            parsedProgress[parsedProgress.length - 1].date = date;
            parsedProgress.push(sampleLastElement);
        }
    }

    return parsedProgress;
}



function updateProgressEndPercentage(endPercentage) {
    if (endPercentage < 0 || endPercentage > 100) {
        console.error("Percentage must be between 0 and 100.");
        return;
    }

    // Select the existing <style> block or create a new one
    let styleSheet = document.getElementById("progress-animation-style");
    if (!styleSheet) {
        styleSheet = document.createElement("style");
        styleSheet.id = "progress-animation-style";
        document.head.appendChild(styleSheet);
    }

    // Update the keyframes with the new percentage
    styleSheet.textContent = `
        @keyframes progressAnimation {
            from {
                width: 0%;
            }
            to {
                width: ${endPercentage}%;
            }
        }
    `;
}



// Function to show details in a modal
async function showDetails(row) {
    const modalDiv = document.getElementById('details-modal');
    modalDiv.removeAttribute('onclick');
    const cancelx = document.getElementById('closex');
    cancelx.disabled = true;
    cancelx.style.backgroundColor = '#ccc';
    // Extract data from the row
    const mailId = row.cells[0].textContent;
    const title = row.cells[1].textContent;
    const referenceNumber = row.cells[2].textContent;
    const submittedTo = row.cells[3].textContent;
    const submittedBy = row.cells[4].textContent;
    const status = row.cells[5].textContent;
    const lastModified = row.cells[6].textContent;
    const creation_date = row.cells[7].textContent;
    const current_location = row.cells[8].textContent;
    const created_by = row.cells[9].textContent;
    const progress = JSON.parse(row.cells[10].textContent);
    const id = row.cells[12].textContent;
    const submittedToID = row.cells[13].textContent;
    const created_byID = row.cells[14].textContent;

    // Populate the modal
    document.getElementById('modal-mail-id').textContent = mailId;
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-reference-number').textContent = referenceNumber;
    document.getElementById('modal-submitted-to').textContent = submittedTo;
    document.getElementById('modal-submitted-by').textContent = submittedBy;
    document.getElementById('modal-status').textContent = status;
    document.getElementById('modal-last-modified').textContent = lastModified;
    document.getElementById('modal-creation-date').textContent = creation_date;
    document.getElementById('modal-location').textContent = current_location;
    document.getElementById('modal-created-by').textContent = created_by;
    document.getElementById('doc').value = id;
    document.getElementById('modal-prog').value = progress;

    const fileProgress = await parseInput(progress, submittedToID, created_byID, lastModified, status);

    // Function to render the file progress dynamically
    async function renderFileProgress(progressData, status) {
        const progressSection = document.querySelector('.progress-section');
        const progressStepsContainer = progressSection.querySelector('.progress-steps');
        const progressBar = progressSection.querySelector('.progress');
        let progressWidth = 0;

        // Clear existing steps
        progressStepsContainer.innerHTML = "";

        // Calculate progress bar width
        const completedSteps = progressData.filter(step => 
            step.status === "completed" || step.status === "current" || step.status === "rejected"
        ).length;
        const totalSteps = progressData.length;

        if (totalSteps === 0) {
            progressWidth = 0; // No steps, no progress
        } else if (totalSteps === 2) {
            progressWidth = 8;
        } else {
            if (status === 'pending') {
                progressWidth = ((84/(totalSteps-1)) * completedSteps)+4;
            } else if (status === 'approved' || status === 'rejected') {
                progressWidth = 8+((84/(totalSteps-1)) * (completedSteps-1))+8;
            } else {
                progressWidth = 8+((84/(totalSteps-1)) * (completedSteps-1));
            }
        }

        // Clamp progressWidth to be between 0 and 100
        progressWidth = Math.min(100, Math.max(0, progressWidth));

        // Update progress bar width
        progressBar.style.width = `${progressWidth}%`;

        updateProgressEndPercentage(progressWidth); // Updates the animation to end at the correct percentage

        // Add steps dynamically
        async function addProgressSteps(progressData, progressBar, status) {
            for (const step of progressData) {
                const stepElement = document.createElement('div');
                stepElement.classList.add('step', step.status);

                const circleElement = document.createElement('div');
                circleElement.classList.add('circle');
                if (step.status === "completed") {
                    circleElement.innerHTML = '<i class="fa fa-check"></i>';
                } else if (step.status === "current") {
                    circleElement.innerHTML = '<i class="fa fa-spinner fa-spin"></i>';
                } else if (step.status === "rejected") {
                    circleElement.innerHTML = '<i class="fa fa-times"></i>';
                } else if (step.status === "waiting") {
                    circleElement.innerHTML = '<i class="fa fa-question"></i>';
                }

                // Update progress bar background color based on status
                if (status === "approved") {
                    progressBar.style.backgroundColor = "#03892f";
                } else if (status === "rejected") {
                    progressBar.style.backgroundColor = "#ff4d4f";
                } else {
                    progressBar.style.backgroundColor = "#ffa500";
                }

                const officeElement = document.createElement('span');
                const namedOffice = await getOfficeName(step.office); // Await the async function
                officeElement.textContent = namedOffice;

                const dateElement = document.createElement('span');
                dateElement.classList.add('date');
                dateElement.textContent = step.date;

                stepElement.appendChild(circleElement);
                stepElement.appendChild(officeElement);
                stepElement.appendChild(dateElement);

                progressStepsContainer.appendChild(stepElement);
            }
        }

        // Function to handle the progress steps and re-enable the button
        async function handleProgress() {
            await addProgressSteps(progressData, progressBar, status);
            
            // Re-enable the button after the function completes
            cancelx.disabled = false;
            cancelx.style.backgroundColor = '#00571d';
            modalDiv.setAttribute('onclick', 'closeModal(event)');
        }

        // Call the function
        handleProgress();
    }


    // Call the function to render progress
    renderFileProgress(fileProgress, status);


    // Show the modal
    document.getElementById('details-modal').style.display = 'block';
}
document.addEventListener('DOMContentLoaded', populateTable);




// Get form elements
const form = document.querySelector('form');
const actionSelect = document.getElementById('action-select');
const destinationSelect = document.getElementById('destination-select');
const loadingScreen = document.getElementById('unique-loading-screen');  // Loading spinner
const messageDisplay = document.getElementById('unique-detail-message');  // Error or Success message


// Dropdown Handling
// Show/hide destination dropdown based on action selection
actionSelect.addEventListener('change', function () {
  if (this.value === 'forward') {
    destinationSelect.style.display = 'inline-block';
    populateDetailsDestinationSelect();
  } else {
    destinationSelect.style.display = 'none';
  }
});

// --- Create Update Script Here ---

// Handle form submission
form.addEventListener('submit', function (event) {
  // Prevent the default form submission behavior
  const doc_id = document.getElementById('doc').value;  // get document id
  event.preventDefault();
  update_details(doc_id);
});



// Function to handle form submission
async function update_details(documentId) {
  // Show loading spinner
  loadingScreen.style.display = 'flex';

  // Get selected values
  const action = document.getElementById('action-select').value; // For status
  const destination = document.getElementById('destination-select').value; // For progress
  let progressMerge = document.getElementById('modal-prog').value;
  // const modalStatus = document.getElementById('modal-status').textContent;
  const today = new Date();

  // Validate selection
  if (action == 'forward' && !destination) {
    // Hide spinner if no values are selected
    loadingScreen.style.display = 'none';
    // Display error message
    messageDisplay.style.display = 'block';
    messageDisplay.textContent = 'Please select destination.';
    messageDisplay.style.color = 'red';
    return;
  }
  
  if (action == 'forward') {
    progressMerge = progressMerge+':'+today.toDateString()+':'+'completed'+','+destination;
  }
  // Determine field to update based on selected action
  const requestBody = action === 'forward'
    ? { progress: progressMerge, current_location: destination, status: 'pending' } 
    : { status: action };

  const endpoint = `https://tracking-system-backend.vercel.app/document/${documentId}`;

  try {
    // Send PATCH request
    const response = await fetch(endpoint, {
      method: 'PATCH', // Changed from POST to PATCH
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    // Check if the response is OK (status 200-299)
    if (!response.ok) {
      const errorMessage = `Failed to update details: ${response.status} ${response.statusText}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    // Parse the JSON response
    const result = await response.json();

    // Hide the loading spinner
    loadingScreen.style.display = 'none';

    // Show success message
    messageDisplay.style.display = 'block';
    messageDisplay.textContent = 'Details updated successfully!';
    messageDisplay.style.color = 'green';

    Swal.fire({
        title: '<span style="font-family: Arial, sans-serif; font-size: 18px; color: #005a1d; padding-bottom: 20px;">Success!</span>',
        icon: 'success',
        showConfirmButton: false, // Hides the button
        timer: 1500, // Automatically closes after 1.5 second
        timerProgressBar: true // Shows a progress bar for the timer
    });

    // Redirect after 1.5 second
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1500);

    console.log('Response Data:', result); // Log the response for debugging
  } catch (error) {
    // Hide the loading spinner
    loadingScreen.style.display = 'none';

    // Show error message
    messageDisplay.style.display = 'block';
    messageDisplay.textContent = 'An error occurred while updating the details.';
    messageDisplay.style.color = 'red';

    console.error('Error:', error); // Log the error for debugging
  }

}




// --- Create Mail Script ---
const createMailForm = document.getElementById('create-mail-form');
const createMailLoadingScreen = document.getElementById('create-mail-loading-screen');
const mailMessage = document.getElementById('mail-message');

// Function to toggle loading screen for Create Mail
function toggleCreateMailLoadingScreen(show) {
  createMailLoadingScreen.style.display = show ? 'flex' : 'none';
}

// Handle Create Mail Form Submission
createMailForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  // Show the loading screen
  toggleCreateMailLoadingScreen(true);

  // Get form data
  const title = document.getElementById('title').value;
  const referenceNumber = document.getElementById('reference-number').value;
  const submittedBy = document.getElementById('submitted-by').value;
  const submittedTo = document.getElementById('submitted-to').value;
  const user = await fetchCurrentUser();
  const current_user_id = user.office._id;

  const requestBody = {
    title: title,
    reference_number: referenceNumber,
    submitted_by: submittedBy,
    submitted_to: submittedTo,
    created_by: current_user_id,
    current_location: current_user_id,
    progress: current_user_id
  };

  try {
    // Send request to the backend
    const response = await fetch('https://tracking-system-backend.vercel.app/document/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    // Hide the loading screen
    toggleCreateMailLoadingScreen(false);

    // Show success or error message
    mailMessage.style.display = 'block';
    mailMessage.textContent = response.ok
      ? 'Mail created successfully!'
      : `Failed to create mail: ${result.message}`;
    mailMessage.style.color = response.ok ? 'green' : 'red';
    
    Swal.fire({
        title: '<span style="font-family: Arial, sans-serif; font-size: 18px; color: #005a1d; padding-bottom: 20px;">Mail created successfully!</span>',
        icon: 'success',
        showConfirmButton: false, // Hides the button
        timer: 1500, // Automatically closes after 1.5 second
        timerProgressBar: true // Shows a progress bar for the timer
    });

    // Redirect after 1.5 second
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1500);
  } catch (error) {
    // Hide the loading screen
    toggleCreateMailLoadingScreen(false);

    // Handle network or unexpected errors
    mailMessage.style.display = 'block';
    mailMessage.textContent = 'An error occurred while creating the mail.';
    mailMessage.style.color = 'red';
  }
});

// --- Change Password Script ---
const changePasswordForm = document.getElementById('change-password-form');
const changePasswordLoadingScreen = document.getElementById('change-password-loading-screen');
const passwordMessage = document.getElementById('password-message');

// Function to toggle loading screen for Change Password
function toggleChangePasswordLoadingScreen(show) {
  changePasswordLoadingScreen.style.display = show ? 'flex' : 'none';
}

// Handle Change Password Form Submission
changePasswordForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  // Show the loading screen
  toggleChangePasswordLoadingScreen(true);

  // Get form data
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmNewPassword = document.getElementById('confirm-new-password').value;
  const user = await fetchCurrentUser();
  let userId = 0;
  if (user && user.office) {
    userId = user.office._id;
  }

  // Validate password confirmation
  if (newPassword !== confirmNewPassword) {
    toggleChangePasswordLoadingScreen(false);
    passwordMessage.style.display = 'block';
    passwordMessage.textContent = 'Passwords do not match.';
    passwordMessage.style.color = 'red';
    return;
  }

  const requestBody = {
    oldPassword: currentPassword,
    newPassword: newPassword,
  };

  try {
    // Send request to the backend
    const response = await fetch(`https://tracking-system-backend.vercel.app/auth/changepassword/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    // Hide the loading screen
    toggleChangePasswordLoadingScreen(false);

    // Show success or error message
    if (response.ok) {
      // Show SweetAlert success popup
      Swal.fire({
          title: '<span style="font-family: Arial, sans-serif; font-size: 18px; color: #005a1d; padding-bottom: 20px;">Password changed successfully!</span>',
          icon: 'success',
          showConfirmButton: false, // Hides the button
          timer: 1500, // Automatically closes after 1.5 second
          timerProgressBar: true // Shows a progress bar for the timer
      });

      // Redirect after 1.5 second
      setTimeout(() => {
          window.location.href = 'dashboard.html';
      }, 1500);
    } else {
      passwordMessage.style.display = 'block';
      passwordMessage.textContent = `Failed to change password: ${result.message}`;
      passwordMessage.style.color = 'red';
    }
  } catch (error) {
    // Hide the loading screen
    toggleChangePasswordLoadingScreen(false);

    // Handle network or unexpected errors
    passwordMessage.style.display = 'block';
    passwordMessage.textContent = 'An error occurred while changing the password.';
    passwordMessage.style.color = 'red';
  }
});
