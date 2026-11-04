document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const activityCards = new Map();

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activityCards.clear();

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const title = document.createElement("h4");
        title.textContent = name;

        const description = document.createElement("p");
        description.textContent = details.description;

        const schedule = document.createElement("p");
        const scheduleLabel = document.createElement("strong");
        scheduleLabel.textContent = "Schedule: ";
        schedule.append(scheduleLabel, document.createTextNode(details.schedule));

        const availability = document.createElement("p");
        const availabilityLabel = document.createElement("strong");
        availabilityLabel.textContent = "Availability: ";
        const availabilityValue = document.createTextNode(`${spotsLeft} spots left`);
        availability.append(availabilityLabel, availabilityValue);

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = `Participants (${details.participants.length})`;

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";

        function renderParticipants() {
          participantsHeading.textContent = `Participants (${details.participants.length})`;
          participantsList.replaceChildren();

          if (details.participants.length === 0) {
            const emptyItem = document.createElement("li");
            emptyItem.className = "no-participants";
            emptyItem.textContent = "No participants yet";
            participantsList.appendChild(emptyItem);
            return;
          }

          details.participants.forEach((email) => {
            const participant = document.createElement("li");
            const participantEmail = document.createElement("span");
            participantEmail.className = "participant-email";
            participantEmail.textContent = email;

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "participant-remove";
            removeButton.textContent = "×";
            removeButton.title = "Remove participant";
            removeButton.setAttribute("aria-label", `Remove ${email} from ${name}`);
            removeButton.addEventListener("click", async () => {
              removeButton.disabled = true;

              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`,
                  { method: "DELETE" }
                );
                const result = await response.json();

                if (!response.ok) {
                  throw new Error(result.detail || "Failed to remove participant");
                }

                details.participants = details.participants.filter(
                  (participantEmail) => participantEmail !== email
                );
                availabilityValue.textContent = `${details.max_participants - details.participants.length} spots left`;
                renderParticipants();
              } catch (error) {
                removeButton.disabled = false;
                messageDiv.textContent = error.message || "Failed to remove participant";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
              }
            });

            participant.append(participantEmail, removeButton);
            participantsList.appendChild(participant);
          });
        }

        activityCards.set(name, { details, availabilityValue, renderParticipants });
        renderParticipants();
        participantsSection.append(participantsHeading, participantsList);
        activityCard.append(title, description, schedule, availability, participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        const card = activityCards.get(activity);
        if (card) {
          card.details.participants.push(email);
          card.availabilityValue.textContent = `${card.details.max_participants - card.details.participants.length} spots left`;
          card.renderParticipants();
        }
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
