let slideIndex = 0;
showSlides();


function showSlides() {
    let slides = document.querySelectorAll('.slide');
    let dots = document.querySelectorAll('.dot');
    
    slides.forEach((slide, index) => {
        slide.style.display = 'none';
    });

    slideIndex++;
    if (slideIndex > slides.length) {
        slideIndex = 1;
    }

    slides[slideIndex - 1].style.display = 'block';

    dots.forEach(dot => dot.classList.remove('active'));
    dots[slideIndex - 1].classList.add('active');
    
    setTimeout(showSlides, 3000); // Change slide every 3 seconds
}

function currentSlide(n) {
    slideIndex = n - 1;
    showSlides();
}













function filterMails() {
  const searchInput = document.querySelector('.search-bar').value.toLowerCase();
  const rows = document.querySelectorAll('#mails-table-body tr');
  let noDataFound = true; // Track if any rows match the filter

  // If there are no rows in the table, directly display "No data found"
  if (rows.length === 0) {
    showNoDataMessage();
    return;
  }

  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    const rowText = Array.from(cells).slice(0, 6).map(cell => cell.textContent.toLowerCase()).join(' ');

    // Show or hide rows based on search input match
    if (rowText.includes(searchInput)) {
      row.style.display = ''; // Show the row if it matches
      noDataFound = false; // Match found, so set to false
    } else {
      row.style.display = 'none'; // Hide the row if no match
    }
  });

  // If no data is found, show the message
  if (noDataFound) {
    showNoDataMessage();
  } else {
    // Hide "No data found" message if rows are visible
    hideNoDataMessage();
  }
}

function showNoDataMessage() {
  const noDataMessage = document.getElementById('no-data-message');
  // If the "No data found" message doesn't exist, create and display it
  if (!noDataMessage) {
    const messageRow = document.createElement('tr');
    messageRow.id = 'no-data-message';
    messageRow.innerHTML = `<td colspan="6" style="text-align: center;">No data found</td>`;
    document.querySelector('#mails-table-body').appendChild(messageRow);
  } else {
    noDataMessage.style.display = ''; // Show the existing message
  }
}

function hideNoDataMessage() {
  const noDataMessage = document.getElementById('no-data-message');
  if (noDataMessage) {
    noDataMessage.style.display = 'none'; // Hide the "No data found" message
  }
}


function sortMails() {
  const sortOption = document.getElementById('sort-options').value;
  const tableBody = document.getElementById('mails-table-body');
  const rows = Array.from(tableBody.querySelectorAll('tr'));
  const columnIndex = { mail_id: 0, title: 1, reference_number: 2, submitted_by: 3, status: 4, last_modified: 5 }[sortOption];

  // Adjust to sort the next column if the selected sort option is 'last_modified'
  const nextColumnIndex = sortOption === 'last_modified' ? columnIndex + 6 : columnIndex;

  rows.sort((a, b) => {
    const aText = a.cells[nextColumnIndex].textContent.trim().toLowerCase();
    const bText = b.cells[nextColumnIndex].textContent.trim().toLowerCase();
    return aText.localeCompare(bText);
  });

  tableBody.innerHTML = '';
  rows.forEach(row => tableBody.appendChild(row));
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
async function populateDestinationSelect() {
    const selectElement = document.getElementById('submitted-to');

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


// Open and close modals
function openNewMailModal() {
  populateDestinationSelect();
  document.getElementById('new-mail-modal').style.display = 'block';
}

function openChangePasswordModal() {
  document.getElementById('change-password-modal').style.display = 'block';
}

// Logout
function logout() {
    Swal.fire({
        title: '<span style="font-family: Arial, sans-serif; font-size: 18px;">Are you sure you want to log out?</span>',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '<span style="color: white;">Continue</span>',
        cancelButtonText: 'Cancel',
        customClass: {
            confirmButton: 'custom-confirm-button',
            cancelButton: 'custom-cancel-button'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('authToken');
            window.location.href = 'index.html';
        }
    });

}

function closeModal(event) {
  if (event) event.preventDefault();
  document.querySelectorAll('.modal').forEach(modal => {
    modal.style.display = 'none';
  });
}



// Form submission logic
document.getElementById('new-mail-form').addEventListener('submit', function(e) {
  e.preventDefault();
  alert('New mail created successfully');
  closeModal();
});

document.getElementById('change-password-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-new-password').value;

  if (newPassword === confirmPassword) {
    alert('Password changed successfully');
    closeModal();
  } else {
    alert('Passwords do not match');
  }
});









    // Get modal element
var modal = document.getElementById("healthTipModal");

// Get the <span> element that closes the modal
var closeBtn = document.getElementsByClassName("close-btn")[0];

// Get all health tips and add click event listeners
var tips = document.querySelectorAll(".health-tip");
tips.forEach(function(tip) {
    tip.addEventListener("click", function() {
        // Display the modal
        modal.style.display = "block";
        // Set the text inside the modal
        document.getElementById("modal-text").textContent = tip.getAttribute("data-tip");
    });
});

// When the user clicks on <span> (x), close the modal
closeBtn.onclick = function() {
    modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}




