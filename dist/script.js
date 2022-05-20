// as soon as page is loaded (html, css) login gets executed (and scroll function (only working when there is a to-the-top-button implemented))
window.onload = function () {
  login();
  scrollFunction();
};

document.addEventListener("scroll", function (e) {
  scrollFunction();
});

// GLOBAL
// AUTHENTICATION / LOGIN
// copied from sumsi documentation
function login() {
  const loginUrl = "https://sumsi.dev.webundsoehne.com/api/v1/login";

  let loginHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  let loginBody = {
    email: "admin@csaw.at",
    password: "pw4sumsiadmin",
  };

  // first check if there is a token in the session storage?
  // if not - make a fetch request to api with loginHeaders and loginBody
  if (!sessionStorage.getItem("token")) {
    return (
      fetch(loginUrl, {
        method: "POST",
        headers: loginHeaders,
        body: JSON.stringify(loginBody),
      })
        // when fetch is executed then a promise in json is returned:
        .then((response) => response.json())
        // then do sth with that data (set it in session storage)
        .then((data) => {
          sessionStorage.setItem("token", data.token);
          console.log("token loaded");
        })
    );
  }
  // if token is in session storage already:
  return true;
}

// SCROLL TO THE TOP BUTTON (W3 schools)
function scrollFunction() {
  const toTopButton = document.getElementById("toTopButton");
  // if user scrolls 30px down -> show button
  if (document.body.scrollTop > 30 || document.documentElement.scrollTop > 30) {
    toTopButton.style.display = "block";
  } else {
    toTopButton.style.display = "none";
  }
}

// if button is clicked -> scroll to the top
function topFunction() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

// SETTINGS (not used)
function getSettings() {
  console.log("getSettings()");
}

// CONTACT FORM for competition
// copied from sumsi documentation
function sendContactForm() {
  const subUrl = "https://sumsi.dev.webundsoehne.com/api/v1/submissions";

  let subHeaders = {
    Authorization: "Bearer " + sessionStorage.getItem("token"),
    Accept: "application/json",
  };

  // get all the values from the input fields
  const subBody = new FormData();
  subBody.append(
    "legalguardian_firstname",
    document.getElementById("inputFirstName").value
  );
  subBody.append(
    "legalguardian_lastname",
    document.getElementById("inputLastName").value
  );
  subBody.append("email", document.getElementById("emailAddress").value);
  subBody.append(
    "child_firstname",
    document.getElementById("inputChildName").value
  );
  subBody.append("child_age", document.getElementById("inputChildAge").value);
  subBody.append(
    "approval_privacypolicy",
    document.getElementById("approvalPrivacyPolicy").checked ? "1" : "0"
  );
  subBody.append(
    "approval_participation",
    document.getElementById("approvalParticipation").checked ? "1" : "0"
  );
  subBody.append(
    "approval_mailnotification",
    document.getElementById("approvalMailNotification").checked ? "1" : "0"
  );
  subBody.append(
    "image",
    document.querySelector('input[name="fileInput"]').files[0]
  );

  fetch(subUrl, {
    method: "POST",
    headers: subHeaders,
    body: subBody,
  })
    .then((r) => r.json().then((data) => ({ status: r.status, body: data })))
    .then((res) => {
      // if posting data is successful (checking status code 200) then open modal that tells user that it was successful
      if (res.status === 200) {
        let successModal = new bootstrap.Modal(
          document.getElementById("successModal"),
          {}
        );
        successModal.show();
      }
    });
}

// GALLERY
// first do this (authorization)
async function getGallery() {
  if (!sessionStorage.getItem("token")) {
    await login();
  }

  console.log("getGallery");
  const galleryUrl = "https://sumsi.dev.webundsoehne.com/api/v1/submissions";

  let subHeaders = {
    Authorization: "Bearer " + sessionStorage.getItem("token"),
    Accept: "application/json",
  };
  // then execute the get request for the gallery
  await fetch(galleryUrl, {
    method: "GET",
    headers: subHeaders,
  })
    .then((response) => response.json())
    .then((res) => {
      // loop to get all the pictures (clones) and not just one
      res.data.forEach(function (image) {
        // to display the pictures (show only submissions with pictures) do this:
        if (image.image !== null) {
          // get number of VOTES
          voteUrl =
            "https://sumsi.dev.webundsoehne.com/api/v1/submissions/:id/votes/count";

          fetch(voteUrl.replace(":id", image.id), {
            method: "GET",
            headers: subHeaders,
          })
            .then((response) =>
              response
                .json()
                .then((data) => ({ status: response.status, body: data }))
            )
            .then((res) => {
              // get the element by id "template" then clone the node:
              let div = document.getElementById("template"),
                // (true) means deep=true, that means the children get cloned as well:
                clone = div.cloneNode(true);
              // change the id of the clone from "template" to "submission" + globalId (submission1,..):
              clone.id = image.id;
              // remove the d-none class from the clone (display none from bootstrap):
              clone.classList.remove("d-none");
              // get the card-title element from the clone and then set the innerHTML
              clone.getElementsByClassName("card-title")[0].innerHTML =
                "" + image.child_firstname + ", " + image.child_age;
              // get the card-votes element from the clone and then set the innerHTML to the actual votes
              clone.getElementsByClassName("card-votes")[0].innerHTML =
                "" + res.body.data.votes + " Votes";
              // get the picture:
              clone.getElementsByClassName("card-img-top")[0].src =
                "https://sumsi.dev.webundsoehne.com" +
                image.image.public_location;

              // get voteBtn
              clone.getElementsByClassName("votingBtn")[0].id = image.id;
              clone.getElementsByClassName("votingBtn")[0].onclick =
                function () {
                  openModal(image.id);
                };

              // append the clone to the body:
              document.getElementById("submissions-wrapper").appendChild(clone);
            });
        }
      });
    });
}

function openModal(uuid) {
  console.log(uuid);
  // get the voting modal
  votingModalRef = document.getElementById("votingModal");
  // get sendVote button
  sendVoteRef = document.getElementById("sendVote");
  // create a modal with a single line of js (copied from bootstrap doc):
  let votingModal = new bootstrap.Modal(votingModalRef, {});
  votingModal.show();

  sendVoteRef.onclick = function (event) {
    // get the value from the email input
    voteEmailRef = document.getElementById("voteEmail").value;
    sendVote(event, uuid, voteEmailRef);
    votingModal.hide();
  };
}

function sendVote(event, uuid, email) {
  const voteUrl =
    "https://sumsi.dev.webundsoehne.com/api/v1/submissions/:id/votings";
  // another option would be:
  // https://sumsi.dev.webundsoehne.com/api/v1/submissions/ + uuid + /votings

  let voteHeaders = {
    Authorization: "Bearer " + sessionStorage.getItem("token"),
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  voteBody = {
    email: email,
  };

  // :id (: indicates it is dynamic) is going to be replaced by uuid
  fetch(voteUrl.replace(":id", uuid), {
    method: "POST",
    headers: voteHeaders,
    body: JSON.stringify(voteBody),
  })
    .then((response) => response.json())
    .then(() => {
      // reload the page when the vote is posted (to see the new amount of votes)
      window.location.reload();
    });
}
