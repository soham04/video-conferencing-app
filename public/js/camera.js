// *******************************************************************
// TODO: Pre Conference
// *******************************************************************

// Video and audio selectors
const video = document.querySelector("video");
const audio = document.querySelector("audio");

// Video and Mic Toggle btns
const mediaToggle = document.querySelectorAll(".stream__media-control");

mediaToggle.forEach((media) => {
  // Video and Mic toggle labels and spans inside the tag
  let mediaLabel = media.querySelector("label");
  let mediaLabelSpan = media.querySelector("span");

  // Video and Mic toggle click event
  mediaLabel.addEventListener("click", function () {
    mediaLabelSpan.classList.toggle("active");
    if (mediaLabel.getAttribute("for") == "video-toggle") {
      stream.getTracks().forEach(function (track) {
        if (track.kind === "video") {
          if (!mediaLabelSpan.classList.contains("active")) {
            track.enabled = false;
            console.log("video stopped", track);
          } else {
            track.enabled = true;
            console.log("video started", track);
          }
        }
      });
    } else if (mediaLabel.getAttribute("for") == "audio-toggle") {
      stream.getTracks().forEach(function (track) {
        if (track.kind === "audio") {
          micTrack = track;
          if (!mediaLabelSpan.classList.contains("active")) {
            track.enabled = false;
            console.log("audio stopped", track);
          } else {
            track.enabled = true;
            console.log("audio started", track);
          }
        }
      });
    }
  });
});

// Getting Audio and Video permissions
navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    window.localStream = stream;
    video.srcObject = stream;
    audio.srcObject = stream;
  })
  .catch((err) => {
    console.log(err);
  });

// *******************************************************************
// TODO: Main Conference Begins
// *******************************************************************

// ! Selectors

// Media Devices Setting Toggle
const cameraPageBody = document.querySelector(".camera-page-body");
const mediaSettingToggleBtns = document.querySelectorAll(
  ".mediaSettingsToggle"
);
const mediaSettingCloseBtn = document.querySelector(".settings__close");
const mediaSettingOverlay = document.querySelector(".settingsOverlay");
const mediaSetting = document.querySelector(".settings");

// SideNav Btns
const sideNav = document.querySelector(".conference__navigation--nav");
const sideNavLinks = sideNav.querySelectorAll(
  ".conference__navigation--nav-link"
);
const sideNavInfoBtn = document.querySelector(".conferenceInfoBtn");
const sideNavChatBtn = document.querySelector(".conferenceChatBtn");
const sideNavParticipantBtn = document.querySelector(
  ".conferenceParticipantBtn"
);

// Conference Focus Toggle
const conferenceFocusBtn = document.querySelector("#conferenceFocusBtn");
const conferenceHeader = document.querySelector(".conference__heading");
const col_2 = document.querySelector(".conference-col-2");
const col_1 = document.querySelector(".conference-col-1");

// Conference Control Btns
const conferenceFullScreenBtn = document.querySelector(
  "#conferenceFullScreenBtn"
);

// Conference Rside comps
const col1 = document.querySelector(".conference-col-1");
const rsideHeaderTitle = document.querySelector(".conference-rside-name");
const conferenceChatBtnRSd = document.querySelector(".chatBtnRsd");
const conferenceParticipantBtnRSd =
  document.querySelector(".participantBtnRsd");
const conferenceChat = document.querySelector(".conference__chat");
const conferenceInfo = document.querySelector(".conference__info");
const conferenceParticipant = document.querySelector(
  ".conference__participants"
);

// Info Meet Code
const meetCode = document.querySelector("#codeMeetJoin");
const meetCodeUrl = document.querySelector("#codeMeetJoin");
const meetCodeCopyBtn = document.querySelector("#meetInfoCopyBtn");

// Chat Btns for chat window toggle
const conferenceChatBtns = document.querySelectorAll(".conferenceChatBtn");

// Participants Btns for chat window toggle
const conferenceParticipantBtns = document.querySelectorAll(
  ".conferenceParticipantBtn"
);

// Info Btns for info window toggle
const conferenceInfoBtns = document.querySelectorAll(".conferenceInfoBtn");

//  Toast Initialize
var toastElList = [].slice.call(document.querySelectorAll(".toast"));
var toastList = toastElList.map(function (toastEl) {
  return new bootstrap.Toast(toastEl);
});

// ! Functions

// * 1.Function To Changename of header on right col 1
const conferenceRtSdName = (name) => {
  rsideHeaderTitle.textContent = name;
};

// * 2.Function To remove Active classes from all col-1 childrens
const rmActiveFromColsChildren = () => {
  Array.from(col1.children).forEach(
    (el) => el.classList.contains("active") && el.classList.remove("active")
  );
};

// * 3.Function To remove Active classes from all SideNav Links
const rmActiveFromSideNavLinks = () => {
  sideNavLinks.forEach((node) => node.classList.remove("active"));
};

// * 4.Function to remove one class and add other class
const rmAndAddClass = (elem, add, remove) => {
  elem.classList.add(add);
  elem.classList.remove(remove);
};

// * 5.Function to add focus on Cam Layout
const addFocusOnCamLayuot = () => {
  // Adding and removing focusIn & focusOut class to identify the action of focus or focusOut
  if (conferenceFocusBtn.classList.contains("focusIn")) {
    conferenceFocusBtn.classList.add("active");
    conferenceFocusBtn.classList.add("focusOut");
    conferenceFocusBtn.classList.remove("focusIn");
    // Expand & Collapse of Conferernce Header
    conferenceHeader.classList.remove("expand");
    // Expand and Collapse of Cols
    col_2.classList.add("expand");
    col_1.classList.remove("expand");
  } else if (conferenceFocusBtn.classList.contains("focusOut")) {
    conferenceFocusBtn.classList.remove("active");
    conferenceFocusBtn.classList.remove("focusOut");
    conferenceFocusBtn.classList.add("focusIn");
    // Expand & Collapse of Conferernce Header
    conferenceHeader.classList.add("expand");
    // Expand and Collapse of Cols
    col_2.classList.remove("expand");
    col_1.classList.add("expand");
  }
};

// * 6.Function to make Web App on Full Screen
function openFullscreen() {
  const elem = document.documentElement;
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) {
    /* Safari */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    /* IE11 */
    elem.msRequestFullscreen();
  }
}

// * 7.Function to close Web App on Full Screen
function closeFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    /* Safari */
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    /* IE11 */
    document.msExitFullscreen();
  }
}

// ! Event Listners

// * 1.Media Device Settings
mediaSettingToggleBtns.forEach((btn) =>
  btn.addEventListener("click", () => {
    mediaSetting.classList.add("active");
    mediaSettingOverlay.classList.add("active");
    cameraPageBody.classList.add("no-scroll");
  })
);

mediaSettingCloseBtn.addEventListener("click", () => {
  mediaSetting.classList.remove("active");
  mediaSettingOverlay.classList.remove("active");
  cameraPageBody.classList.remove("no-scroll");
});

// * 2.Chat Window Rside
conferenceChatBtns.forEach((btn) =>
  btn.addEventListener("click", (_) => {
    rmActiveFromSideNavLinks();
    sideNavChatBtn.classList.add("active");
    rmAndAddClass(conferenceChatBtnRSd, "custom-btn-primary", "btn-light");
    rmAndAddClass(
      conferenceParticipantBtnRSd,
      "btn-light",
      "custom-btn-primary"
    );
    conferenceRtSdName("Group Chat");
    rmActiveFromColsChildren();
    conferenceChat.classList.add("active");
  })
);

// * 3.Participants Window Rside
conferenceParticipantBtns.forEach((btn) =>
  btn.addEventListener("click", (_) => {
    rmActiveFromSideNavLinks();
    sideNavParticipantBtn.classList.add("active");
    rmAndAddClass(
      conferenceParticipantBtnRSd,
      "custom-btn-primary",
      "btn-light"
    );
    rmAndAddClass(conferenceChatBtnRSd, "btn-light", "custom-btn-primary");
    conferenceRtSdName("People");
    rmActiveFromColsChildren();
    conferenceParticipant.classList.add("active");
  })
);

// * 4.Info Window Rside
conferenceInfoBtns.forEach((btn) =>
  btn.addEventListener("click", (_) => {
    rmActiveFromSideNavLinks();
    sideNavInfoBtn.classList.add("active");
    conferenceChatBtnRSd.classList.remove("custom-btn-primary");
    conferenceRtSdName("Info");
    rmAndAddClass(conferenceChatBtnRSd, "btn-light", "custom-btn-primary");
    rmActiveFromColsChildren();
    conferenceInfo.classList.add("active");
  })
);

// * 5.Copy Meet Code
meetCodeCopyBtn.addEventListener("click", () => {
  /* Copy the text inside the text field */
  navigator.clipboard.writeText(meetCodeUrl.textContent);

  /* Toast Initialize */
  var toastElList = [].slice.call(document.querySelectorAll(".toast"));
  var toastList = toastElList.map(function (toastEl) {
    return new bootstrap.Toast(toastEl);
  });
  toastList.forEach((toast) => toast.show()); // This show them
});

// * 6.Focus on Cam Layout
conferenceFocusBtn.addEventListener("click", () => {
  rmActiveFromSideNavLinks();
  addFocusOnCamLayuot();
});

// * 7.Focus on Cam Layout to be removed on side Nav links click
Array.from(sideNavLinks)
  .filter((el) => el != conferenceFocusBtn)
  .forEach((el) => {
    el.addEventListener("click", (_) => {
      if (conferenceFocusBtn.classList.contains("focusOut")) {
        addFocusOnCamLayuot();
      }
    });
  });

// * 6.Full Screen on Focus Control btn
let fullScreen = false;
conferenceFullScreenBtn.addEventListener("click", () => {
  if (fullScreen) {
    closeFullscreen();
  } else {
    openFullscreen();
  }
  fullScreen = !fullScreen;
});
