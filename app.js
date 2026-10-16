/* =====================================================
   FITQUEST
   COMPLETE FRONTEND JAVASCRIPT
   AUTH + DASHBOARD + PROFILE + GPS + QUEST
===================================================== */


/* =====================================================
   API CONFIGURATION
===================================================== */

/*
   IMPORTANT:

   Leave API_URL empty.

   Because Flask serves the frontend, the browser will
   automatically use the same server for API requests.

   PC:
   http://127.0.0.1:5000
   -> /api/login

   ngrok:
   https://your-ngrok-url.ngrok-free.dev
   -> /api/login
*/

const API_URL = "";


/* =====================================================
   PAGE SYSTEM
===================================================== */

const pages = document.querySelectorAll(".page");

function showPage(pageId) {

    pages.forEach(page => {
        page.classList.remove("active");
    });

    const page = document.getElementById(pageId);

    if (page) {
        page.classList.add("active");

        window.scrollTo({
            top: 0,
            behavior: "instant"
        });
    }
}


/* =====================================================
   AUTH ELEMENTS
===================================================== */

const authScreen =
    document.getElementById("authScreen");

const loginForm =
    document.getElementById("loginForm");

const registerForm =
    document.getElementById("registerForm");

const switchAuth =
    document.getElementById("switchAuth");

const authTitle =
    document.getElementById("authTitle");

const authSubtitle =
    document.getElementById("authSubtitle");

const authMessage =
    document.getElementById("authMessage");


/* =====================================================
   MAIN BUTTONS
===================================================== */

const startBtn =
    document.getElementById("startBtn");

const chooseActivityBtn =
    document.getElementById("chooseActivityBtn");

const quickStartBtn =
    document.getElementById("quickStartBtn");

const continueBtn =
    document.getElementById("continueBtn");

const startQuestBtn =
    document.getElementById("startQuestBtn");

const stopQuestBtn =
    document.getElementById("stopQuestBtn");

const dashboardBtn =
    document.getElementById("dashboardBtn");

const profileBtn =
    document.getElementById("profileBtn");

const profileLogoutBtn =
    document.getElementById("profileLogoutBtn");


/* =====================================================
   USER STATE
===================================================== */

let currentUser = null;


/* =====================================================
   QUEST STATE
===================================================== */

let selectedActivity = null;
let selectedIcon = null;
let questTarget = 0;

let watchId = null;
let lastPosition = null;

let questDistance = 0;
let questStartTime = null;
let timerInterval = null;

let questCompleted = false;
let questSaving = false;


/* =====================================================
   ACTIVITY DATA
===================================================== */

const activityData = {

    Walking: {
        icon: "🚶",
        title: "STEP INTO THE JOURNEY",
        description:
            "Walk through the real world and generate energy with every step.",
        target: 2
    },

    Running: {
        icon: "🏃",
        title: "CHASE THE ENERGY",
        description:
            "Pick up your pace and charge your FITQUEST world with real movement.",
        target: 3
    },

    Cycling: {
        icon: "🚴",
        title: "RIDE THE HORIZON",
        description:
            "Explore new paths and power your world as you ride.",
        target: 5
    },

    Sports: {
        icon: "🏸",
        title: "PLAY TO POWER UP",
        description:
            "Move actively and complete your fitness mission.",
        target: 1
    },

    Exercise: {
        icon: "🤸",
        title: "BUILD YOUR POWER",
        description:
            "Move through your workout and complete your mission.",
        target: 1
    }

};


/* =====================================================
   START JOURNEY
===================================================== */

if (startBtn) {

    startBtn.addEventListener("click", () => {

        if (!currentUser) {

            if (authScreen) {
                authScreen.style.display = "flex";
            }

            return;
        }

        showPage("dashboardPage");

    });

}


/* =====================================================
   DASHBOARD → ACTIVITY
===================================================== */

if (chooseActivityBtn) {

    chooseActivityBtn.addEventListener("click", () => {

        showPage("activityPage");

    });

}


if (quickStartBtn) {

    quickStartBtn.addEventListener("click", () => {

        showPage("activityPage");

    });

}


/* =====================================================
   PROFILE
===================================================== */

if (profileBtn) {

    profileBtn.addEventListener("click", async () => {

        if (!currentUser) {

            if (authScreen) {
                authScreen.style.display = "flex";
            }

            return;
        }

        await loadProfileData();

        showPage("profilePage");

    });

}


/* =====================================================
   BACK BUTTONS
===================================================== */

document
    .querySelectorAll(".back-btn")
    .forEach(button => {

        button.addEventListener("click", () => {

            const destination =
                button.dataset.back;

            if (destination) {

                showPage(destination);

            }

        });

    });


/* =====================================================
   ACTIVITY SELECTION
===================================================== */

const activityCards =
    document.querySelectorAll(".activity-card");

const selectionText =
    document.getElementById("selectionText");


activityCards.forEach(card => {

    card.addEventListener("click", () => {

        activityCards.forEach(item => {
            item.classList.remove("selected");
        });

        card.classList.add("selected");

        selectedActivity =
            card.dataset.activity;

        selectedIcon =
            card.dataset.icon ||
            activityData[selectedActivity]?.icon ||
            "";

        questTarget =
            Number(
                card.dataset.target ||
                activityData[selectedActivity]?.target ||
                0
            );

        if (selectionText) {

            selectionText.textContent =
                `${selectedIcon} ${selectedActivity} selected — target: ${questTarget} KM`;

        }

    });

});


/* =====================================================
   ACTIVITY → QUEST
===================================================== */

if (continueBtn) {

    continueBtn.addEventListener("click", () => {

        if (!selectedActivity) {

            if (selectionText) {

                selectionText.textContent =
                    "⚠ Please choose an activity first.";

            }

            return;

        }

        const activity =
            activityData[selectedActivity];

        if (!activity) {

            if (selectionText) {

                selectionText.textContent =
                    "⚠ Invalid activity selected.";

            }

            return;

        }

        setText(
            "questIcon",
            activity.icon
        );

        setText(
            "questActivity",
            selectedActivity.toUpperCase()
        );

        setText(
            "questTitle",
            activity.title
        );

        setText(
            "questDescription",
            activity.description
        );

        setText(
            "targetValue",
            `${activity.target} KM`
        );

        showPage("questPage");

    });

}


/* =====================================================
   START QUEST
===================================================== */

if (startQuestBtn) {

    startQuestBtn.addEventListener("click", () => {

        if (!currentUser) {

            if (authScreen) {
                authScreen.style.display = "flex";
            }

            return;

        }

        if (!selectedActivity) {

            showPage("activityPage");

            return;

        }

        const activity =
            activityData[selectedActivity];

        if (!activity) {
            return;
        }


        /* ---------------------------------------------
           RESET QUEST
        --------------------------------------------- */

        stopTracking();

        questDistance = 0;
        lastPosition = null;

        questStartTime = Date.now();

        questCompleted = false;
        questSaving = false;


        /* ---------------------------------------------
           UPDATE LIVE SCREEN
        --------------------------------------------- */

        setText(
            "liveIcon",
            activity.icon
        );

        setText(
            "liveActivity",
            selectedActivity.toUpperCase()
        );

        setText(
            "liveDistance",
            "0.00"
        );

        setText(
            "liveTarget",
            activity.target.toFixed(2)
        );

        setText(
            "liveTime",
            "00:00"
        );

        setText(
            "liveSpeed",
            "0.0"
        );

        setText(
            "progressPercent",
            "0%"
        );


        const progressFill =
            document.getElementById("progressFill");

        if (progressFill) {

            progressFill.style.width = "0%";

        }


        setText(
            "progressText",
            "Waiting for your first GPS location..."
        );

        setText(
            "trackingStatus",
            "📍 Requesting GPS permission..."
        );


        showPage("livePage");

        startTimer();

        startGPS();

    });

}


/* =====================================================
   TIMER
===================================================== */

function startTimer() {

    clearInterval(timerInterval);

    timerInterval = setInterval(() => {

        if (!questStartTime) {
            return;
        }

        const seconds =
            Math.floor(
                (Date.now() - questStartTime) / 1000
            );

        const minutes =
            Math.floor(seconds / 60);

        const remainingSeconds =
            seconds % 60;

        setText(
            "liveTime",
            `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`
        );

    }, 1000);

}


/* =====================================================
   GPS START
===================================================== */

function startGPS() {

    const trackingStatus =
        document.getElementById("trackingStatus");


    if (!navigator.geolocation) {

        if (trackingStatus) {

            trackingStatus.textContent =
                "❌ GPS is not supported by this browser.";

        }

        return;

    }


    if (watchId !== null) {

        navigator.geolocation.clearWatch(
            watchId
        );

        watchId = null;

    }


    if (trackingStatus) {

        trackingStatus.textContent =
            "📍 Requesting GPS permission...";

    }


    try {

        watchId =
            navigator.geolocation.watchPosition(
                handleGPSPosition,
                handleGPSError,
                {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 15000
                }
            );

    }

    catch (error) {

        console.error(
            "GPS start error:",
            error
        );

        if (trackingStatus) {

            trackingStatus.textContent =
                "❌ Could not start GPS tracking.";

        }

    }

}


/* =====================================================
   GPS POSITION
===================================================== */

function handleGPSPosition(position) {

    if (
        questCompleted ||
        questSaving
    ) {

        return;

    }


    const {
        latitude,
        longitude,
        speed,
        accuracy
    } = position.coords;


    const trackingStatus =
        document.getElementById(
            "trackingStatus"
        );


    /* ---------------------------------------------
       Ignore inaccurate readings
    --------------------------------------------- */

    if (
        accuracy &&
        accuracy > 100
    ) {

        if (trackingStatus) {

            trackingStatus.textContent =
                `🟡 GPS accuracy is low (${Math.round(accuracy)}m). Waiting for a better signal...`;

        }

        return;

    }


    if (trackingStatus) {

        trackingStatus.textContent =
            `🟢 GPS tracking active • Accuracy ${Math.round(accuracy || 0)}m`;

    }


    const currentPosition = {
        latitude,
        longitude
    };


    /* ---------------------------------------------
       First GPS point
    --------------------------------------------- */

    if (!lastPosition) {

        lastPosition =
            currentPosition;

        updateTrackingUI(speed);

        return;

    }


    /* ---------------------------------------------
       Calculate movement distance
    --------------------------------------------- */

    const distance =
        calculateDistance(
            lastPosition.latitude,
            lastPosition.longitude,
            currentPosition.latitude,
            currentPosition.longitude
        );


    /*
       Ignore GPS jumps larger than 100 meters
       between two readings.
    */

    if (
        distance > 0 &&
        distance <= 0.1
    ) {

        questDistance += distance;

    }


    lastPosition =
        currentPosition;


    updateTrackingUI(speed);

}


/* =====================================================
   GPS ERROR
===================================================== */

function handleGPSError(error) {

    const trackingStatus =
        document.getElementById(
            "trackingStatus"
        );


    if (!trackingStatus) {
        return;
    }


    switch (error.code) {

        case error.PERMISSION_DENIED:

            trackingStatus.textContent =
                "❌ GPS permission denied. Please allow location access.";

            break;


        case error.POSITION_UNAVAILABLE:

            trackingStatus.textContent =
                "⚠ GPS position unavailable. Searching for a better signal...";

            break;


        case error.TIMEOUT:

            trackingStatus.textContent =
                "⏳ GPS request timed out. Searching again...";

            break;


        default:

            trackingStatus.textContent =
                "❌ Unable to access GPS.";

    }

}


/* =====================================================
   DISTANCE CALCULATION
===================================================== */

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const earthRadius = 6371;


    const dLat =
        degreesToRadians(
            lat2 - lat1
        );


    const dLon =
        degreesToRadians(
            lon2 - lon1
        );


    const a =

        Math.sin(dLat / 2) *
        Math.sin(dLat / 2)

        +

        Math.cos(
            degreesToRadians(lat1)
        )

        *

        Math.cos(
            degreesToRadians(lat2)
        )

        *

        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return earthRadius * c;

}


function degreesToRadians(degrees) {

    return degrees *
        (Math.PI / 180);

}


/* =====================================================
   UPDATE LIVE TRACKING UI
===================================================== */

function updateTrackingUI(speed) {

    if (!selectedActivity) {
        return;
    }


    const activity =
        activityData[selectedActivity];


    if (!activity) {
        return;
    }


    /* ---------------------------------------------
       Distance
    --------------------------------------------- */

    setText(
        "liveDistance",
        questDistance.toFixed(2)
    );


    /* ---------------------------------------------
       Speed
    --------------------------------------------- */

    let speedKmh = 0;


    if (
        speed !== null &&
        speed !== undefined &&
        speed >= 0
    ) {

        speedKmh =
            speed * 3.6;

    }


    setText(
        "liveSpeed",
        speedKmh.toFixed(1)
    );


    /* ---------------------------------------------
       Progress
    --------------------------------------------- */

    let progress =
        (
            questDistance /
            activity.target
        ) * 100;


    progress =
        Math.max(
            0,
            Math.min(
                100,
                progress
            )
        );


    setText(
        "progressPercent",
        `${Math.round(progress)}%`
    );


    const progressFill =
        document.getElementById(
            "progressFill"
        );


    if (progressFill) {

        progressFill.style.width =
            `${progress}%`;

    }


    setText(
        "progressText",
        `You have completed ${questDistance.toFixed(2)} KM of your ${activity.target} KM quest.`
    );


    /* ---------------------------------------------
       Complete quest automatically
    --------------------------------------------- */

    if (
        questDistance >= activity.target &&
        !questCompleted &&
        !questSaving
    ) {

        completeQuest();

    }

}


/* =====================================================
   COMPLETE QUEST
===================================================== */

async function completeQuest() {

    if (
        questCompleted ||
        questSaving
    ) {

        return;

    }


    if (!currentUser) {
        return;
    }


    if (!selectedActivity) {
        return;
    }


    questSaving = true;


    stopTracking();


    setText(
        "trackingStatus",
        "🏆 Quest completed! Saving your progress..."
    );


    try {

        const response =
            await fetch(
                `${API_URL}/api/quest/complete`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            user_id:
                                currentUser.id,

                            activity:
                                selectedActivity,

                            distance:
                                Number(
                                    questDistance.toFixed(2)
                                ),

                            target:
                                Number(
                                    activityData[
                                        selectedActivity
                                    ].target
                                )

                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Could not save quest."
            );

        }


        questCompleted = true;
        questSaving = false;


        updateCompletionRewards(data);


        showPage("completePage");

    }

    catch (error) {

        console.error(
            "Quest completion error:",
            error
        );


        questSaving = false;


        setText(
            "trackingStatus",
            `⚠ ${error.message || "Quest could not be saved."}`
        );

    }

}


/* =====================================================
   COMPLETION REWARDS
===================================================== */

function updateCompletionRewards(data) {

    if (!data) {
        return;
    }


    const rewardElements =
        document.querySelectorAll(
            ".complete-rewards strong"
        );


    if (
        rewardElements &&
        rewardElements.length >= 3
    ) {

        if (
            data.energy_added !== undefined
        ) {

            rewardElements[0].textContent =
                `+${data.energy_added} ⚡`;

        }


        if (
            data.xp_added !== undefined
        ) {

            rewardElements[1].textContent =
                `+${data.xp_added} 🏆`;

        }


        if (
            data.streak_added !== undefined
        ) {

            rewardElements[2].textContent =
                `+${data.streak_added} 🔥`;

        }

    }

}


/* =====================================================
   STOP QUEST
===================================================== */

if (stopQuestBtn) {

    stopQuestBtn.addEventListener(
        "click",
        () => {

            stopTracking();

            questDistance = 0;

            lastPosition = null;

            questStartTime = null;

            questCompleted = false;

            questSaving = false;

            showPage("dashboardPage");

        }
    );

}


/* =====================================================
   STOP GPS + TIMER
===================================================== */

function stopTracking() {

    if (watchId !== null) {

        if (
            navigator.geolocation &&
            navigator.geolocation.clearWatch
        ) {

            navigator.geolocation.clearWatch(
                watchId
            );

        }

        watchId = null;

    }


    clearInterval(
        timerInterval
    );


    timerInterval = null;

    questStartTime = null;

}


/* =====================================================
   COMPLETED → DASHBOARD
===================================================== */

if (dashboardBtn) {

    dashboardBtn.addEventListener(
        "click",
        async () => {

            if (currentUser) {

                await loadDashboard(
                    currentUser.id
                );

            }

            else {

                showPage(
                    "welcomePage"
                );

            }

        }
    );

}


/* =====================================================
   AUTH MODE
===================================================== */

let loginMode = true;


if (switchAuth) {

    switchAuth.addEventListener(
        "click",
        () => {

            loginMode =
                !loginMode;


            if (authMessage) {

                authMessage.textContent =
                    "";

            }


            if (loginMode) {

                if (loginForm) {

                    loginForm.style.display =
                        "flex";

                }

                if (registerForm) {

                    registerForm.style.display =
                        "none";

                }


                if (authTitle) {

                    authTitle.textContent =
                        "Welcome Back";

                }


                if (authSubtitle) {

                    authSubtitle.textContent =
                        "Sign in and continue your journey.";

                }


                switchAuth.textContent =
                    "Don't have an account? Create one";

            }

            else {

                if (loginForm) {

                    loginForm.style.display =
                        "none";

                }

                if (registerForm) {

                    registerForm.style.display =
                        "flex";

                }


                if (authTitle) {

                    authTitle.textContent =
                        "Create Your Account";

                }


                if (authSubtitle) {

                    authSubtitle.textContent =
                        "Start your FITQUEST journey today.";

                }


                switchAuth.textContent =
                    "Already have an account? Login";

            }

        }
    );

}


/* =====================================================
   REGISTER
===================================================== */

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const username =
                document.getElementById(
                    "registerUsername"
                )?.value.trim() || "";


            const email =
                document.getElementById(
                    "registerEmail"
                )?.value.trim() || "";


            const password =
                document.getElementById(
                    "registerPassword"
                )?.value || "";


            if (authMessage) {

                authMessage.textContent =
                    "Creating your account...";

            }


            try {

                const response =
                    await fetch(
                        `${API_URL}/api/register`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    username,
                                    email,
                                    password

                                })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    if (authMessage) {

                        authMessage.textContent =
                            "⚠ " +
                            (
                                data.message ||
                                "Registration failed."
                            );

                    }

                    return;

                }


                if (authMessage) {

                    authMessage.textContent =
                        "✅ Account created successfully!";

                }


                registerForm.reset();


                setTimeout(
                    () => {

                        if (switchAuth) {
                            switchAuth.click();
                        }

                    },
                    1000
                );

            }

            catch (error) {

                console.error(
                    "Registration error:",
                    error
                );


                if (authMessage) {

                    authMessage.textContent =
                        "⚠ Cannot connect to FITQUEST server.";

                }

            }

        }
    );

}


/* =====================================================
   LOGIN
===================================================== */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const email =
                document.getElementById(
                    "loginEmail"
                )?.value.trim() || "";


            const password =
                document.getElementById(
                    "loginPassword"
                )?.value || "";


            if (authMessage) {

                authMessage.textContent =
                    "Logging in...";

            }


            try {

                const response =
                    await fetch(
                        `${API_URL}/api/login`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    email,
                                    password

                                })
                        }
                    );


                const data =
                    await response.json();


                /*
                   Important:

                   A 401/400 response means the server
                   WAS reached. It is not a connection
                   error.
                */

                if (!response.ok) {

                    if (authMessage) {

                        authMessage.textContent =
                            "⚠ " +
                            (
                                data.message ||
                                "Login failed."
                            );

                    }

                    return;

                }


                if (!data.user) {

                    throw new Error(
                        "Login response did not contain user data."
                    );

                }


                currentUser =
                    data.user;


                localStorage.setItem(
                    "fitquestUser",
                    JSON.stringify(
                        data.user
                    )
                );


                loginForm.reset();


                if (authMessage) {

                    authMessage.textContent =
                        "";

                }


                await loadDashboard(
                    currentUser.id
                );

            }

            catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                if (authMessage) {

                    authMessage.textContent =
                        "⚠ Cannot connect to FITQUEST server.";

                }

            }

        }
    );

}


/* =====================================================
   LOAD DASHBOARD
===================================================== */

async function loadDashboard(userId) {

    if (!userId) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/api/dashboard/${userId}`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Dashboard loading failed."
            );

        }


        if (!data.user) {

            throw new Error(
                "Dashboard response did not contain user data."
            );

        }


        const user =
            data.user;


        currentUser = {

            id: user.id,

            username: user.username,

            email: user.email

        };


        localStorage.setItem(
            "fitquestUser",
            JSON.stringify(
                currentUser
            )
        );


        /* ---------------------------------------------
           Dashboard username
        --------------------------------------------- */

        setText(
            "dashboardUsername",
            user.username
        );


        /* ---------------------------------------------
           Statistics
        --------------------------------------------- */

        setText(
            "energyValue",
            user.total_energy || 0
        );


        setText(
            "xpValue",
            user.total_xp || 0
        );


        setText(
            "streakValue",
            user.current_streak || 0
        );


        setText(
            "distanceValue",
            Number(
                user.total_distance || 0
            ).toFixed(2)
        );


        setText(
            "questsValue",
            user.quests_completed || 0
        );


        /* ---------------------------------------------
           Hide authentication
        --------------------------------------------- */

        if (authScreen) {

            authScreen.style.display =
                "none";

        }


        showPage(
            "dashboardPage"
        );

    }

    catch (error) {

        console.error(
            "Dashboard error:",
            error
        );


        currentUser = null;


        localStorage.removeItem(
            "fitquestUser"
        );


        if (authScreen) {

            authScreen.style.display =
                "flex";

        }


        if (authMessage) {

            authMessage.textContent =
                "⚠ Could not load your dashboard.";

        }

    }

}


/* =====================================================
   PROFILE DATA
===================================================== */

async function loadProfileData() {

    if (!currentUser) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/api/dashboard/${currentUser.id}`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Profile loading failed."
            );

        }


        if (!data.user) {

            throw new Error(
                "Profile response did not contain user data."
            );

        }


        const user =
            data.user;


        setText(
            "profileUsername",
            user.username
        );


        setText(
            "profileEmail",
            user.email
        );


        setText(
            "profileDistance",
            Number(
                user.total_distance || 0
            ).toFixed(2)
        );


        setText(
            "profileXP",
            user.total_xp || 0
        );


        setText(
            "profileStreak",
            user.current_streak || 0
        );

    }

    catch (error) {

        console.error(
            "Profile error:",
            error
        );

    }

}


/* =====================================================
   HELPER
===================================================== */

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.textContent =
            value;

    }

}


/* =====================================================
   LOGOUT
===================================================== */

function logout() {

    stopTracking();


    currentUser = null;


    localStorage.removeItem(
        "fitquestUser"
    );


    /* ---------------------------------------------
       Reset quest
    --------------------------------------------- */

    selectedActivity = null;

    selectedIcon = null;

    questTarget = 0;

    questDistance = 0;

    lastPosition = null;

    questCompleted = false;

    questSaving = false;


    /* ---------------------------------------------
       Remove activity selection
    --------------------------------------------- */

    activityCards.forEach(card => {

        card.classList.remove(
            "selected"
        );

    });


    if (selectionText) {

        selectionText.textContent =
            "Choose an activity to continue";

    }


    /* ---------------------------------------------
       Reset authentication
    --------------------------------------------- */

    loginMode = true;


    if (loginForm) {

        loginForm.style.display =
            "flex";

    }


    if (registerForm) {

        registerForm.style.display =
            "none";

    }


    if (authTitle) {

        authTitle.textContent =
            "Welcome Back";

    }


    if (authSubtitle) {

        authSubtitle.textContent =
            "Sign in and continue your journey.";

    }


    if (authMessage) {

        authMessage.textContent =
            "";

    }


    /* ---------------------------------------------
       Show login
    --------------------------------------------- */

    if (authScreen) {

        authScreen.style.display =
            "flex";

    }


    showPage(
        "welcomePage"
    );

}


/* =====================================================
   LOGOUT BUTTON
===================================================== */

if (profileLogoutBtn) {

    profileLogoutBtn.addEventListener(
        "click",
        logout
    );

}


/* =====================================================
   AUTO LOGIN
===================================================== */

const savedUser =
    localStorage.getItem(
        "fitquestUser"
    );


if (savedUser) {

    try {

        const user =
            JSON.parse(
                savedUser
            );


        if (!user.id) {

            throw new Error(
                "Invalid saved user."
            );

        }


        currentUser =
            user;


        loadDashboard(
            user.id
        );

    }

    catch (error) {

        console.error(
            "Auto login error:",
            error
        );


        localStorage.removeItem(
            "fitquestUser"
        );


        currentUser = null;


        if (authScreen) {

            authScreen.style.display =
                "flex";

        }


        showPage(
            "welcomePage"
        );

    }

}

else {

    if (authScreen) {

        authScreen.style.display =
            "flex";

    }


    showPage(
        "welcomePage"
    );

}