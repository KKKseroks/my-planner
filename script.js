/* =========================================================
   ОБЩИЕ ЭЛЕМЕНТЫ
   ========================================================= */

const calendarPage =
    document.getElementById("calendarPage");

const plannerPage =
    document.getElementById("plannerPage");

const calendarMenuButton =
    document.getElementById("calendarMenuButton");

const plannerMenuButton =
    document.getElementById("plannerMenuButton");

const habitsPage = document.getElementById("habitsPage");
const habitsMenuButton = document.getElementById("habitsMenuButton");


/* =========================================================
   ПЕРЕКЛЮЧЕНИЕ СТРАНИЦ
   ========================================================= */

function showCalendarPage() {

    calendarPage.classList.add("active-page");
    plannerPage.classList.remove("active-page");
    habitsPage.classList.remove("active-page");

    calendarMenuButton.classList.add("active");
    plannerMenuButton.classList.remove("active");
    habitsMenuButton.classList.remove("active");

    localStorage.setItem(
        "activePlannerPage",
        "calendar"
    );
}


function showPlannerPage() {

    plannerPage.classList.add("active-page");
    calendarPage.classList.remove("active-page");
    habitsPage.classList.remove("active-page");

    plannerMenuButton.classList.add("active");
    calendarMenuButton.classList.remove("active");
    habitsMenuButton.classList.remove("active");

    localStorage.setItem(
        "activePlannerPage",
        "planner"
    );

    renderDayPlanner();
}

function showHabitsPage() {
    habitsPage.classList.add("active-page");
    calendarPage.classList.remove("active-page");
    plannerPage.classList.remove("active-page");

    habitsMenuButton.classList.add("active");
    calendarMenuButton.classList.remove("active");
    plannerMenuButton.classList.remove("active");

    localStorage.setItem("activePlannerPage", "habits");
    renderHabits();
}


calendarMenuButton.addEventListener(
    "click",
    showCalendarPage
);


plannerMenuButton.addEventListener(
    "click",
    showPlannerPage
);

habitsMenuButton.addEventListener("click", showHabitsPage);


/* =========================================================
   ДАТЫ
   ========================================================= */

const monthNames = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь"
];


const monthNamesGenitive = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря"
];


const weekdayNames = [
    "Воскресенье",
    "Понедельник",
    "Вторник",
    "Среда",
    "Четверг",
    "Пятница",
    "Суббота"
];


function padNumber(number) {

    return String(number)
        .padStart(2, "0");
}


function createDateKeyFromParts(
    year,
    month,
    day
) {

    return (
        year
        + "-"
        + padNumber(month + 1)
        + "-"
        + padNumber(day)
    );
}


function dateToKey(date) {

    return createDateKeyFromParts(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );
}


function formatDateKey(dateKey) {

    const [
        year,
        month,
        day
    ] = dateKey.split("-");

    return (
        day
        + "."
        + month
        + "."
        + year
    );
}


/* =========================================================
   НЕДЕЛЯ
   ========================================================= */

function getMonday(date) {

    const result =
        new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );

    const day =
        result.getDay();

    const difference =
        day === 0
            ? -6
            : 1 - day;

    result.setDate(
        result.getDate()
        + difference
    );

    return result;
}


function getSunday(date) {

    const monday =
        getMonday(date);

    return new Date(
        monday.getFullYear(),
        monday.getMonth(),
        monday.getDate() + 6
    );
}


function getWeekKey(date) {

    return dateToKey(
        getMonday(date)
    );
}


/* =========================================================
   КАЛЕНДАРЬ
   ========================================================= */

const calendar =
    document.getElementById("calendar");

const monthYear =
    document.getElementById("monthYear");

const prevMonth =
    document.getElementById("prevMonth");

const nextMonth =
    document.getElementById("nextMonth");


const today =
    new Date();


let currentYear =
    today.getFullYear();

let currentMonth =
    today.getMonth();

let selectedDateKey =
    null;


/* =========================================================
   ДАННЫЕ КАЛЕНДАРЯ
   ========================================================= */

let calendarTasks = {};


try {

    const saved =
        localStorage.getItem(
            "calendarTasks"
        );

    if (saved) {

        calendarTasks =
            JSON.parse(saved) || {};

    }

}
catch (error) {

    calendarTasks = {};

}


function saveCalendarTasks() {

    localStorage.setItem(
        "calendarTasks",
        JSON.stringify(calendarTasks)
    );
}


function normalizeCalendarTask(task) {

    if (
        typeof task === "string"
    ) {

        return {
            title: task,
            time: "",
            category: "Задание",
            priority: "medium",
            completed: false
        };

    }


    return {

        title:
            task?.title
            || task?.text
            || "",

        time:
            task?.time
            || "",

        category:
            task?.category
            || "Задание",

        priority: ["high", "medium", "low"].includes(task?.priority)
            ? task.priority : "medium",

        completed:
            task?.completed === true

    };
}


function getCategoryIcon(category) {

    if (category === "Задание") {
        return "📝";
    }

    if (category === "Событие") {
        return "★";
    }

    if (category === "Праздник") {
        return "🎁";
    }

    if (category === "Встреча") {
        return "👥";
    }

    return "📌";
}


function getPriorityLabel(priority) {
    return ({ high: "🔴 Высокий", medium: "🟡 Средний", low: "🟢 Низкий" })[priority] || "🟡 Средний";
}

function getPriorityRank(priority) {
    return ({ high: 0, medium: 1, low: 2 })[priority] ?? 1;
}


/* =========================================================
   ОТРИСОВКА КАЛЕНДАРЯ
   ========================================================= */

function renderCalendar() {

    calendar.innerHTML = "";


    monthYear.textContent =
        monthNames[currentMonth]
        + " "
        + currentYear;


    const firstDay =
        new Date(
            currentYear,
            currentMonth,
            1
        ).getDay();


    const offset =
        firstDay === 0
            ? 6
            : firstDay - 1;


    const daysInMonth =
        new Date(
            currentYear,
            currentMonth + 1,
            0
        ).getDate();


    for (
        let i = 0;
        i < offset;
        i++
    ) {

        const empty =
            document.createElement("div");

        empty.className =
            "empty-day";

        calendar.appendChild(empty);

    }


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const dateKey =
            createDateKeyFromParts(
                currentYear,
                currentMonth,
                day
            );


        const button =
            document.createElement("button");


        button.type = "button";
        button.className = "day";


        if (
            day === today.getDate()
            &&
            currentMonth === today.getMonth()
            &&
            currentYear === today.getFullYear()
        ) {

            button.classList.add(
                "today"
            );

        }


        const number =
            document.createElement("span");


        number.className =
            "day-number";

        number.textContent =
            day;


        button.appendChild(number);


        const tasks =
            calendarTasks[dateKey] || [];

        tasks.sort((a, b) =>
            getPriorityRank(normalizeCalendarTask(a).priority)
            - getPriorityRank(normalizeCalendarTask(b).priority)
        );

        tasks.forEach(rawTask => {

            const task =
                normalizeCalendarTask(
                    rawTask
                );


            const record =
                document.createElement(
                    "div"
                );


            record.className =
                "calendar-record";


            if (task.completed) {

                record.classList.add(
                    "completed"
                );

            }


            record.textContent =
                getCategoryIcon(
                    task.category
                )
                + " "
                + (
                    task.time
                        ? task.time + " "
                        : ""
                )
                + task.title
                + " " + (task.priority === "high" ? "🔴" : task.priority === "low" ? "🟢" : "🟡");


            button.appendChild(
                record
            );

        });


        button.addEventListener(
            "click",
            () => {

                openCalendarModal(
                    dateKey
                );

            }
        );


        calendar.appendChild(
            button
        );

    }

}


/* =========================================================
   МЕСЯЦЫ
   ========================================================= */

prevMonth.addEventListener(
    "click",
    () => {

        currentMonth--;

        if (currentMonth < 0) {

            currentMonth = 11;
            currentYear--;

        }

        renderCalendar();

    }
);


nextMonth.addEventListener(
    "click",
    () => {

        currentMonth++;

        if (currentMonth > 11) {

            currentMonth = 0;
            currentYear++;

        }

        renderCalendar();

    }
);


/* =========================================================
   ОКНО КАЛЕНДАРЯ
   ========================================================= */

const taskModal =
    document.getElementById("taskModal");

const closeModal =
    document.getElementById("closeModal");

const selectedDate =
    document.getElementById("selectedDate");

const taskInput =
    document.getElementById("taskInput");

const taskTime =
    document.getElementById("taskTime");

const taskCategory =
    document.getElementById("taskCategory");
const taskPriority = document.getElementById("taskPriority");

const customCategoryInput =
    document.getElementById(
        "customCategoryInput"
    );

const addTask =
    document.getElementById("addTask");

const taskList =
    document.getElementById("taskList");


function openCalendarModal(dateKey) {

    selectedDateKey =
        dateKey;


    selectedDate.textContent =
        "Записи на "
        + formatDateKey(dateKey);


    taskInput.value = "";
    taskTime.value = "";

    taskCategory.value =
        "Задание";
    taskPriority.value = "medium";

    customCategoryInput.value =
        "";

    customCategoryInput
        .classList
        .add("hidden");


    renderCalendarTaskList();


    taskModal
        .classList
        .add("active");

}


function closeCalendarModal() {

    taskModal
        .classList
        .remove("active");

}


/* =========================================================
   СПИСОК КАЛЕНДАРЯ
   ========================================================= */

function renderCalendarTaskList() {

    taskList.innerHTML = "";


    const tasks =
        calendarTasks[
            selectedDateKey
        ] || [];

    tasks.sort((a, b) =>
        getPriorityRank(normalizeCalendarTask(a).priority)
        - getPriorityRank(normalizeCalendarTask(b).priority)
    );

    if (!tasks.length) {

        const empty =
            document.createElement("li");

        empty.textContent =
            "Записей пока нет.";

        taskList.appendChild(empty);

        return;

    }


    tasks.forEach(
        (
            rawTask,
            index
        ) => {

            const task =
                normalizeCalendarTask(
                    rawTask
                );


            const li =
                document.createElement("li");

            li.className =
                "task-item";


            if (task.completed) {

                li.classList.add(
                    "completed"
                );

            }


            const checkbox =
                document.createElement(
                    "input"
                );

            checkbox.type =
                "checkbox";

            checkbox.className =
                "planner-checkbox";

            checkbox.checked =
                task.completed;


            checkbox.addEventListener(
                "change",
                () => {

                    task.completed =
                        checkbox.checked;

                    calendarTasks[
                        selectedDateKey
                    ][index] = task;

                    saveCalendarTasks();

                    renderCalendarTaskList();
                    renderCalendar();

                }
            );


            const info =
                document.createElement("div");

            info.className =
                "task-item-info";


            const title =
                document.createElement("div");

            title.className =
                "task-item-title";

            title.textContent =
                task.title;


            const details =
                document.createElement("div");

            details.className =
                "task-item-details";

            details.textContent =
                getCategoryIcon(
                    task.category
                )
                + " "
                + task.category
                + " • " + getPriorityLabel(task.priority)
                + (
                    task.time
                        ? " • " + task.time
                        : ""
                );


            info.appendChild(title);
            info.appendChild(details);


            const remove =
                document.createElement(
                    "button"
                );

            remove.type =
                "button";

            remove.className =
                "delete-small";

            remove.textContent =
                "Удалить";


            remove.addEventListener(
                "click",
                () => {

                    calendarTasks[
                        selectedDateKey
                    ].splice(
                        index,
                        1
                    );


                    if (
                        calendarTasks[
                            selectedDateKey
                        ].length === 0
                    ) {

                        delete calendarTasks[
                            selectedDateKey
                        ];

                    }


                    saveCalendarTasks();

                    renderCalendarTaskList();
                    renderCalendar();

                }
            );


            li.appendChild(checkbox);
            li.appendChild(info);
            li.appendChild(remove);

            taskList.appendChild(li);

        }
    );

}


/* =========================================================
   ДОБАВЛЕНИЕ ЗАПИСИ КАЛЕНДАРЯ
   ========================================================= */

addTask.addEventListener(
    "click",
    () => {

        const title =
            taskInput.value.trim();


        if (!title) {

            alert(
                "Введите название записи."
            );

            return;

        }


        let category =
            taskCategory.value;


        if (category === "Другое") {

            category =
                customCategoryInput
                    .value
                    .trim()
                || "Другое";

        }


        if (
            !calendarTasks[
                selectedDateKey
            ]
        ) {

            calendarTasks[
                selectedDateKey
            ] = [];

        }


        calendarTasks[
            selectedDateKey
        ].push({

            title,
            time: taskTime.value,
            category,
            priority: taskPriority.value,
            completed: false

        });


        saveCalendarTasks();

        taskInput.value = "";
        taskTime.value = "";

        renderCalendarTaskList();
        renderCalendar();

    }
);


taskCategory.addEventListener(
    "change",
    () => {

        customCategoryInput
            .classList
            .toggle(
                "hidden",
                taskCategory.value !==
                    "Другое"
            );

    }
);


closeModal.addEventListener(
    "click",
    closeCalendarModal
);


taskModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            taskModal
        ) {

            closeCalendarModal();

        }

    }
);


/* =========================================================
   ПОИСК
   ========================================================= */

const searchInput =
    document.getElementById(
        "searchInput"
    );

const searchResults =
    document.getElementById(
        "searchResults"
    );

const clearSearch =
    document.getElementById(
        "clearSearch"
    );


function searchCalendarTasks() {

    const query =
        searchInput
            .value
            .trim()
            .toLowerCase();


    searchResults.innerHTML = "";


    if (!query) {

        searchResults
            .classList
            .remove("active");

        return;

    }


    const results = [];


    Object.entries(
        calendarTasks
    ).forEach(
        ([dateKey, tasks]) => {

            tasks.forEach(
                rawTask => {

                    const task =
                        normalizeCalendarTask(
                            rawTask
                        );


                    const text =
                        (
                            task.title
                            + " "
                            + task.category
                            + " "
                            + task.time
                        )
                        .toLowerCase();


                    if (
                        text.includes(query)
                    ) {

                        results.push({
                            dateKey,
                            task
                        });

                    }

                }
            );

        }
    );


    searchResults
        .classList
        .add("active");


    if (!results.length) {

        const div =
            document.createElement("div");

        div.style.padding =
            "15px";

        div.textContent =
            "Ничего не найдено.";

        searchResults.appendChild(div);

        return;

    }


    results.forEach(
        result => {

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.className =
                "search-result";

            button.textContent =
                formatDateKey(
                    result.dateKey
                )
                + " — "
                + result.task.title;


            button.addEventListener(
                "click",
                () => {

                    const [
                        year,
                        month
                    ] =
                        result
                            .dateKey
                            .split("-");


                    currentYear =
                        Number(year);

                    currentMonth =
                        Number(month) - 1;


                    renderCalendar();


                    searchResults
                        .classList
                        .remove("active");


                    openCalendarModal(
                        result.dateKey
                    );

                }
            );


            searchResults.appendChild(
                button
            );

        }
    );

}


searchInput.addEventListener(
    "input",
    searchCalendarTasks
);


clearSearch.addEventListener(
    "click",
    () => {

        searchInput.value = "";

        searchResults.innerHTML = "";

        searchResults
            .classList
            .remove("active");

    }
);


/* =========================================================
   ПЛАНЕР — ЭЛЕМЕНТЫ
   ========================================================= */

const plannerPrevDay =
    document.getElementById(
        "plannerPrevDay"
    );

const plannerNextDay =
    document.getElementById(
        "plannerNextDay"
    );

const plannerToday =
    document.getElementById(
        "plannerToday"
    );

const plannerWeekday =
    document.getElementById(
        "plannerWeekday"
    );

const plannerDate =
    document.getElementById(
        "plannerDate"
    );

const dayPlanner =
    document.getElementById(
        "dayPlanner"
    );

const plannerStartHour =
    document.getElementById(
        "plannerStartHour"
    );

const plannerEndHour =
    document.getElementById(
        "plannerEndHour"
    );

const progressText =
    document.getElementById(
        "progressText"
    );

const progressBar =
    document.getElementById(
        "progressBar"
    );

const saveWeekImage =
    document.getElementById(
        "saveWeekImage"
    );


/* =========================================================
   НЕДЕЛЬНЫЕ ЗАДАЧИ
   ========================================================= */

const weeklyTaskInput =
    document.getElementById(
        "weeklyTaskInput"
    );

const addWeeklyTask =
    document.getElementById(
        "addWeeklyTask"
    );

const weeklyTaskList =
    document.getElementById(
        "weeklyTaskList"
    );

const weeklyTasksDates =
    document.getElementById(
        "weeklyTasksDates"
    );

const weeklyTasksProgress =
    document.getElementById(
        "weeklyTasksProgress"
    );


let plannerCurrentDate =
    new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    );


/* =========================================================
   НАСТРОЙКИ ВРЕМЕНИ
   ========================================================= */

let plannerStart =
    Number(
        localStorage.getItem(
            "plannerStartHour"
        )
    );


let plannerEnd =
    Number(
        localStorage.getItem(
            "plannerEndHour"
        )
    );


if (
    Number.isNaN(plannerStart)
    ||
    plannerStart < 0
    ||
    plannerStart > 23
) {

    plannerStart = 8;

}


if (
    Number.isNaN(plannerEnd)
    ||
    plannerEnd < 1
    ||
    plannerEnd > 24
) {

    plannerEnd = 24;

}


/* =========================================================
   СПИСКИ ЧАСОВ
   ========================================================= */

function createHourOptions() {

    plannerStartHour.innerHTML = "";
    plannerEndHour.innerHTML = "";


    for (
        let hour = 0;
        hour <= 23;
        hour++
    ) {

        const option =
            document.createElement(
                "option"
            );

        option.value = hour;

        option.textContent =
            padNumber(hour)
            + ":00";

        plannerStartHour.appendChild(
            option
        );

    }


    for (
        let hour = 1;
        hour <= 24;
        hour++
    ) {

        const option =
            document.createElement(
                "option"
            );

        option.value = hour;

        option.textContent =
            padNumber(hour)
            + ":00";

        plannerEndHour.appendChild(
            option
        );

    }


    plannerStartHour.value =
        plannerStart;

    plannerEndHour.value =
        plannerEnd;

}


createHourOptions();


plannerStartHour.addEventListener(
    "change",
    () => {

        const newValue =
            Number(
                plannerStartHour.value
            );


        if (
            newValue >= plannerEnd
        ) {

            alert(
                "Начало дня должно быть раньше окончания."
            );

            plannerStartHour.value =
                plannerStart;

            return;

        }


        plannerStart =
            newValue;


        localStorage.setItem(
            "plannerStartHour",
            plannerStart
        );


        renderDayPlanner();

    }
);


plannerEndHour.addEventListener(
    "change",
    () => {

        const newValue =
            Number(
                plannerEndHour.value
            );


        if (
            newValue <= plannerStart
        ) {

            alert(
                "Окончание дня должно быть позже начала."
            );

            plannerEndHour.value =
                plannerEnd;

            return;

        }


        plannerEnd =
            newValue;


        localStorage.setItem(
            "plannerEndHour",
            plannerEnd
        );


        renderDayPlanner();

    }
);


/* =========================================================
   ДАННЫЕ ПЛАНЕРА
   ========================================================= */

let plannerTasks = {};


try {

    const saved =
        localStorage.getItem(
            "dailyPlannerTasks"
        );


    if (saved) {

        plannerTasks =
            JSON.parse(saved) || {};

    }

}
catch (error) {

    plannerTasks = {};

}


function savePlannerTasks() {

    localStorage.setItem(
        "dailyPlannerTasks",
        JSON.stringify(
            plannerTasks
        )
    );

}


/* =========================================================
   НЕДЕЛЬНЫЕ ДАННЫЕ
   ========================================================= */

let weeklyTasks = {};


try {

    const saved =
        localStorage.getItem(
            "weeklyPlannerTasks"
        );


    if (saved) {

        weeklyTasks =
            JSON.parse(saved) || {};

    }

}
catch (error) {

    weeklyTasks = {};

}


function saveWeeklyTasks() {

    localStorage.setItem(
        "weeklyPlannerTasks",
        JSON.stringify(
            weeklyTasks
        )
    );

}


/* =========================================================
   ВРЕМЯ
   ========================================================= */

function timeToMinutes(time) {

    if (!time) {
        return 0;
    }


    const [
        hours,
        minutes
    ] =
        time
            .split(":")
            .map(Number);


    return (
        hours * 60
        + minutes
    );

}


function sortPlannerTasks(tasks) {
    return [...tasks].sort((a, b) =>
        getPriorityRank(a.priority || "medium") - getPriorityRank(b.priority || "medium")
        || timeToMinutes(a.start) - timeToMinutes(b.start)
    );
}


/* =========================================================
   ЗАГОЛОВОК ДНЯ
   ========================================================= */

function renderPlannerDateHeader() {

    plannerWeekday.textContent =
        weekdayNames[
            plannerCurrentDate
                .getDay()
        ];


    plannerDate.textContent =
        plannerCurrentDate.getDate()
        + " "
        + monthNamesGenitive[
            plannerCurrentDate
                .getMonth()
        ]
        + " "
        + plannerCurrentDate
            .getFullYear();

}


/* =========================================================
   ПРОГРЕСС
   ========================================================= */

function renderProgress() {

    const dateKey =
        dateToKey(
            plannerCurrentDate
        );


    const tasks =
        plannerTasks[dateKey]
        || [];


    const completed =
        tasks.filter(
            task =>
                task.completed === true
        ).length;


    progressText.textContent =
        completed
        + " из "
        + tasks.length;


    const percent =
        tasks.length
            ? (
                completed
                / tasks.length
            ) * 100
            : 0;


    progressBar.style.width =
        percent + "%";

}


/* =========================================================
   НЕДЕЛЬНЫЕ ЗАДАЧИ
   ========================================================= */

function renderWeeklyTasks() {

    const monday =
        getMonday(
            plannerCurrentDate
        );


    const sunday =
        getSunday(
            plannerCurrentDate
        );


    const weekKey =
        dateToKey(monday);


    const tasks =
        weeklyTasks[weekKey]
        || [];


    weeklyTasksDates.textContent =
        monday.getDate()
        + " "
        + monthNamesGenitive[
            monday.getMonth()
        ]
        + " — "
        + sunday.getDate()
        + " "
        + monthNamesGenitive[
            sunday.getMonth()
        ]
        + " "
        + sunday.getFullYear();


    const completed =
        tasks.filter(
            task =>
                task.completed === true
        ).length;


    weeklyTasksProgress.textContent =
        completed
        + " из "
        + tasks.length;


    weeklyTaskList.innerHTML = "";


    if (!tasks.length) {

        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "weekly-task-empty";

        empty.textContent =
            "На эту неделю задач пока нет.";

        weeklyTaskList.appendChild(
            empty
        );

        return;

    }


    tasks.forEach(task => {

        const item =
            document.createElement(
                "div"
            );

        item.className =
            "weekly-task-item";


        if (task.completed) {

            item.classList.add(
                "completed"
            );

        }


        const checkbox =
            document.createElement(
                "input"
            );

        checkbox.type =
            "checkbox";

        checkbox.className =
            "planner-checkbox";

        checkbox.checked =
            task.completed === true;


        checkbox.addEventListener(
            "change",
            () => {

                task.completed =
                    checkbox.checked;

                saveWeeklyTasks();
                renderWeeklyTasks();

            }
        );


        const title =
            document.createElement(
                "div"
            );

        title.className =
            "weekly-task-title";

        title.textContent =
            task.title;


        const remove =
            document.createElement(
                "button"
            );

        remove.type =
            "button";

        remove.className =
            "weekly-task-delete";

        remove.textContent =
            "Удалить";


        remove.addEventListener(
            "click",
            () => {

                weeklyTasks[
                    weekKey
                ] =
                    (
                        weeklyTasks[
                            weekKey
                        ] || []
                    ).filter(
                        item =>
                            item.id !==
                            task.id
                    );


                if (
                    weeklyTasks[
                        weekKey
                    ].length === 0
                ) {

                    delete weeklyTasks[
                        weekKey
                    ];

                }


                saveWeeklyTasks();
                renderWeeklyTasks();

            }
        );


        item.appendChild(
            checkbox
        );

        item.appendChild(
            title
        );

        item.appendChild(
            remove
        );

        weeklyTaskList.appendChild(
            item
        );

    });

}


/* =========================================================
   ДОБАВЛЕНИЕ НЕДЕЛЬНОЙ ЗАДАЧИ
   ========================================================= */

function createWeeklyTask() {

    const title =
        weeklyTaskInput
            .value
            .trim();


    if (!title) {

        weeklyTaskInput.focus();

        return;

    }


    const weekKey =
        getWeekKey(
            plannerCurrentDate
        );


    if (
        !weeklyTasks[
            weekKey
        ]
    ) {

        weeklyTasks[
            weekKey
        ] = [];

    }


    weeklyTasks[
        weekKey
    ].push({

        id:
            Date.now()
            + "-"
            + Math.random()
                .toString(16)
                .slice(2),

        title,
        completed: false

    });


    saveWeeklyTasks();

    weeklyTaskInput.value = "";

    renderWeeklyTasks();

    weeklyTaskInput.focus();

}


addWeeklyTask.addEventListener(
    "click",
    createWeeklyTask
);


weeklyTaskInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
        ) {

            event.preventDefault();

            createWeeklyTask();

        }

    }
);


/* =========================================================
   РАСПИСАНИЕ ДНЯ
   ========================================================= */

function renderDayPlanner() {

    renderPlannerDateHeader();
    renderProgress();
    renderWeeklyTasks();


    dayPlanner.innerHTML = "";


    const dateKey =
        dateToKey(
            plannerCurrentDate
        );


    const tasks =
        sortPlannerTasks(
            plannerTasks[
                dateKey
            ] || []
        );


    for (
        let hour = plannerStart;
        hour < plannerEnd;
        hour++
    ) {

        const hourRow =
            document.createElement(
                "div"
            );

        hourRow.className =
            "planner-hour";


        const time =
            document.createElement(
                "div"
            );

        time.className =
            "planner-hour-time";

        time.textContent =
            padNumber(hour)
            + ":00";


        const content =
            document.createElement(
                "div"
            );

        content.className =
            "planner-hour-content";


        const hourTasks =
            tasks.filter(task => {

                if (!task.start) {
                    return false;
                }

                return (
                    Number(
                        task.start
                            .split(":")[0]
                    )
                    === hour
                );

            });


        if (!hourTasks.length) {

            const empty =
                document.createElement(
                    "div"
                );

            empty.className =
                "empty-hour";

            empty.textContent =
                "+ Добавить дело";

            content.appendChild(
                empty
            );

        }
        else {

            hourTasks.forEach(task => {

                content.appendChild(
                    createPlannerTaskElement(
                        task,
                        dateKey
                    )
                );

            });

        }


        content.addEventListener(
            "click",
            event => {

                if (
                    event.target.closest(
                        ".planner-task"
                    )
                ) {

                    return;

                }

                openNewPlannerTask(
                    hour
                );

            }
        );


        hourRow.appendChild(time);
        hourRow.appendChild(content);

        dayPlanner.appendChild(
            hourRow
        );

    }

}


/* =========================================================
   КАРТОЧКА ДЕЛА
   ========================================================= */

function createPlannerTaskElement(
    task,
    dateKey
) {

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        "planner-task";


    if (task.completed) {

        wrapper.classList.add(
            "completed"
        );

    }


    const checkbox =
        document.createElement(
            "input"
        );

    checkbox.type =
        "checkbox";

    checkbox.className =
        "planner-checkbox";

    checkbox.checked =
        task.completed === true;


    checkbox.addEventListener(
        "click",
        event => {

            event.stopPropagation();

        }
    );


    checkbox.addEventListener(
        "change",
        event => {

            event.stopPropagation();


            const tasks =
                plannerTasks[
                    dateKey
                ] || [];


            const target =
                tasks.find(
                    item =>
                        item.id ===
                        task.id
                );


            if (target) {

                target.completed =
                    checkbox.checked;

                savePlannerTasks();

                renderDayPlanner();

            }

        }
    );


    const info =
        document.createElement(
            "div"
        );

    info.className =
        "planner-task-info";


    const title =
        document.createElement(
            "div"
        );

    title.className =
        "planner-task-title";

    title.textContent =
        task.title;


    const priority = document.createElement("span");
    priority.className = "task-priority-badge priority-" + (task.priority || "medium");
    priority.textContent = getPriorityLabel(task.priority || "medium");

    const time =
        document.createElement(
            "div"
        );

    time.className =
        "planner-task-time";

    time.textContent =
        task.start
        + " — "
        + task.end;


    info.appendChild(title);
    info.appendChild(priority);
    info.appendChild(time);


    if (task.note) {

        const note =
            document.createElement(
                "div"
            );

        note.className =
            "planner-task-note";

        note.textContent =
            task.note;

        info.appendChild(note);

    }


    wrapper.appendChild(
        checkbox
    );

    wrapper.appendChild(
        info
    );


    wrapper.addEventListener(
        "click",
        () => {

            openEditPlannerTask(
                task.id
            );

        }
    );


    return wrapper;

}


/* =========================================================
   ПЕРЕКЛЮЧЕНИЕ ДНЕЙ
   ========================================================= */

function changePlannerDay(amount) {

    plannerCurrentDate =
        new Date(
            plannerCurrentDate.getFullYear(),
            plannerCurrentDate.getMonth(),
            plannerCurrentDate.getDate()
            + amount
        );

    renderDayPlanner();

}


plannerPrevDay.addEventListener(
    "click",
    () => {

        changePlannerDay(-1);

    }
);


plannerNextDay.addEventListener(
    "click",
    () => {

        changePlannerDay(1);

    }
);


plannerToday.addEventListener(
    "click",
    () => {

        plannerCurrentDate =
            new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate()
            );

        renderDayPlanner();

    }
);


/* =========================================================
   ОКНО ПЛАНЕРА
   ========================================================= */

const plannerModal =
    document.getElementById(
        "plannerModal"
    );

const closePlannerModal =
    document.getElementById(
        "closePlannerModal"
    );

const plannerModalTitle =
    document.getElementById(
        "plannerModalTitle"
    );

const plannerModalDate =
    document.getElementById(
        "plannerModalDate"
    );

const plannerTaskName =
    document.getElementById(
        "plannerTaskName"
    );

const plannerTaskStart =
    document.getElementById(
        "plannerTaskStart"
    );

const plannerTaskEnd =
    document.getElementById(
        "plannerTaskEnd"
    );

const plannerTaskNote =
    document.getElementById(
        "plannerTaskNote"
    );
const plannerTaskPriority = document.getElementById("plannerTaskPriority");

const savePlannerTask =
    document.getElementById(
        "savePlannerTask"
    );

const deletePlannerTask =
    document.getElementById(
        "deletePlannerTask"
    );


let editingPlannerTaskId =
    null;


/* =========================================================
   НОВОЕ ДЕЛО
   ========================================================= */

function openNewPlannerTask(hour) {

    editingPlannerTaskId =
        null;


    plannerModalTitle.textContent =
        "Новое дело";


    plannerModalDate.textContent =
        weekdayNames[
            plannerCurrentDate
                .getDay()
        ]
        + ", "
        + plannerCurrentDate
            .getDate()
        + " "
        + monthNamesGenitive[
            plannerCurrentDate
                .getMonth()
        ];


    plannerTaskName.value =
        "";


    plannerTaskStart.value =
        padNumber(hour)
        + ":00";


    if (hour === 23) {

        plannerTaskEnd.value =
            "23:59";

    }
    else {

        plannerTaskEnd.value =
            padNumber(hour + 1)
            + ":00";

    }


    plannerTaskNote.value =
        "";
    plannerTaskPriority.value = "medium";


    deletePlannerTask
        .classList
        .add("hidden");


    plannerModal
        .classList
        .add("active");


    setTimeout(
        () => {

            plannerTaskName.focus();

        },
        100
    );

}


/* =========================================================
   РЕДАКТИРОВАНИЕ
   ========================================================= */

function openEditPlannerTask(taskId) {

    const dateKey =
        dateToKey(
            plannerCurrentDate
        );


    const task =
        (
            plannerTasks[
                dateKey
            ] || []
        ).find(
            item =>
                item.id === taskId
        );


    if (!task) {
        return;
    }


    editingPlannerTaskId =
        task.id;


    plannerModalTitle.textContent =
        "Редактировать дело";


    plannerModalDate.textContent =
        weekdayNames[
            plannerCurrentDate
                .getDay()
        ]
        + ", "
        + plannerCurrentDate
            .getDate()
        + " "
        + monthNamesGenitive[
            plannerCurrentDate
                .getMonth()
        ];


    plannerTaskName.value =
        task.title;

    plannerTaskStart.value =
        task.start;

    plannerTaskEnd.value =
        task.end;

    plannerTaskNote.value =
        task.note || "";
    plannerTaskPriority.value = task.priority || "medium";


    deletePlannerTask
        .classList
        .remove("hidden");


    plannerModal
        .classList
        .add("active");

}


/* =========================================================
   ЗАКРЫТИЕ
   ========================================================= */

function closePlannerTaskModal() {

    plannerModal
        .classList
        .remove("active");

    editingPlannerTaskId =
        null;

}


closePlannerModal.addEventListener(
    "click",
    closePlannerTaskModal
);


plannerModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            plannerModal
        ) {

            closePlannerTaskModal();

        }

    }
);


/* =========================================================
   СОХРАНЕНИЕ ДЕЛА
   ========================================================= */

savePlannerTask.addEventListener(
    "click",
    () => {

        const title =
            plannerTaskName
                .value
                .trim();

        const start =
            plannerTaskStart.value;

        const end =
            plannerTaskEnd.value;

        const note =
            plannerTaskNote
                .value
                .trim();
        const priority = plannerTaskPriority.value;


        if (!title) {

            alert(
                "Введите название дела."
            );

            return;

        }


        if (!start || !end) {

            alert(
                "Укажите время."
            );

            return;

        }


        if (
            timeToMinutes(end)
            <=
            timeToMinutes(start)
        ) {

            alert(
                "Время окончания должно быть позже времени начала."
            );

            return;

        }


        const dateKey =
            dateToKey(
                plannerCurrentDate
            );


        if (
            !plannerTasks[
                dateKey
            ]
        ) {

            plannerTasks[
                dateKey
            ] = [];

        }


        if (
            editingPlannerTaskId
        ) {

            const task =
                plannerTasks[
                    dateKey
                ].find(
                    item =>
                        item.id ===
                        editingPlannerTaskId
                );


            if (task) {

                task.title =
                    title;

                task.start =
                    start;

                task.end =
                    end;

                task.note =
                    note;
                task.priority = priority;

            }

        }
        else {

            plannerTasks[
                dateKey
            ].push({

                id:
                    Date.now()
                    + "-"
                    + Math.random()
                        .toString(16)
                        .slice(2),

                title,
                start,
                end,
                note,
                priority,

                completed:
                    false

            });

        }


        savePlannerTasks();

        closePlannerTaskModal();

        renderDayPlanner();

    }
);


/* =========================================================
   УДАЛЕНИЕ ДЕЛА
   ========================================================= */

deletePlannerTask.addEventListener(
    "click",
    () => {

        if (
            !editingPlannerTaskId
        ) {

            return;

        }


        const dateKey =
            dateToKey(
                plannerCurrentDate
            );


        plannerTasks[
            dateKey
        ] =
            (
                plannerTasks[
                    dateKey
                ] || []
            ).filter(
                task =>
                    task.id !==
                    editingPlannerTaskId
            );


        if (
            plannerTasks[
                dateKey
            ].length === 0
        ) {

            delete plannerTasks[
                dateKey
            ];

        }


        savePlannerTasks();

        closePlannerTaskModal();

        renderDayPlanner();

    }
);


/* =========================================================
   PNG — ПЕРЕНОС ТЕКСТА
   ========================================================= */

function wrapCanvasText(
    context,
    text,
    maxWidth
) {

    const words =
        String(text)
            .trim()
            .split(/\s+/);


    const lines = [];

    let currentLine = "";


    words.forEach(word => {

        const testLine =
            currentLine
                ? currentLine
                    + " "
                    + word
                : word;


        if (
            context
                .measureText(
                    testLine
                )
                .width
            >
            maxWidth
            &&
            currentLine
        ) {

            lines.push(
                currentLine
            );

            currentLine =
                word;

        }
        else {

            currentLine =
                testLine;

        }

    });


    if (currentLine) {

        lines.push(
            currentLine
        );

    }


    return lines;

}


/* =========================================================
   ОБРЕЗАНИЕ СТРОКИ
   ========================================================= */

function fitCanvasText(
    context,
    text,
    maxWidth
) {

    let result =
        String(text);


    if (
        context.measureText(
            result
        ).width
        <=
        maxWidth
    ) {

        return result;

    }


    while (
        result.length > 1
        &&
        context.measureText(
            result + "…"
        ).width
        >
        maxWidth
    ) {

        result =
            result.slice(
                0,
                -1
            );

    }


    return result + "…";

}


/* =========================================================
   ПРЯМОУГОЛЬНИК
   ========================================================= */

function drawRoundedRectangle(
    context,
    x,
    y,
    width,
    height,
    radius
) {

    context.beginPath();

    context.roundRect(
        x,
        y,
        width,
        height,
        radius
    );

    context.fill();

}


/* =========================================================
   CHECKBOX PNG
   ========================================================= */

function drawImageCheckbox(
    context,
    x,
    y,
    completed,
    colors
) {

    context.lineWidth =
        2;

    context.strokeStyle =
        colors.dark;


    context.strokeRect(
        x,
        y,
        22,
        22
    );


    if (!completed) {
        return;
    }


    context.fillStyle =
        colors.dark;


    context.fillRect(
        x,
        y,
        22,
        22
    );


    context.strokeStyle =
        colors.gold;

    context.lineWidth =
        3;

    context.lineCap =
        "round";


    context.beginPath();

    context.moveTo(
        x + 5,
        y + 11
    );

    context.lineTo(
        x + 9,
        y + 16
    );

    context.lineTo(
        x + 18,
        y + 6
    );

    context.stroke();

}


/* =========================================================
   КАРТОЧКА ДНЯ В PNG
   ========================================================= */

function drawDayCard(
    context,
    date,
    weekday,
    x,
    y,
    cardWidth,
    cardHeight,
    tasks,
    colors
) {

    const {
        dark,
        gold,
        white,
        gray,
        light,
        border
    } = colors;


    /* ФОН */

    context.fillStyle =
        light;


    drawRoundedRectangle(
        context,
        x,
        y,
        cardWidth,
        cardHeight,
        25
    );


    /* ШАПКА */

    context.fillStyle =
        dark;


    context.beginPath();

    context.roundRect(
        x,
        y,
        cardWidth,
        100,
        [
            25,
            25,
            0,
            0
        ]
    );

    context.fill();


    /* ДЕНЬ */

    context.fillStyle =
        gold;

    context.font =
        "700 22px Arial";


    context.fillText(
        weekday,
        x + 25,
        y + 40
    );


    /* ДАТА */

    context.fillStyle =
        white;

    context.font =
        "18px Arial";


    context.fillText(
        date.getDate()
        + " "
        + monthNamesGenitive[
            date.getMonth()
        ],
        x + 25,
        y + 72
    );


    /* НЕТ ДЕЛ */

    if (!tasks.length) {

        context.fillStyle =
            "#9aa5aa";

        context.font =
            "16px Arial";


        context.fillText(
            "Нет запланированных дел",
            x + 25,
            y + 150
        );

        return;

    }


    /* =====================================================
       РАСПОЛОЖЕНИЕ ЗАДАЧИ

       время | checkbox | название
                     | время начала — конца
       ===================================================== */

    const leftPadding =
        25;

    const timeColumnWidth =
        70;

    const checkboxGap =
        15;

    const checkboxSize =
        22;

    const titleGap =
        16;


    const timeX =
        x + leftPadding;


    const checkboxX =
        timeX
        + timeColumnWidth;


    const titleX =
        checkboxX
        + checkboxSize
        + titleGap;


    const rightPadding =
        25;


    const titleWidth =
        x
        + cardWidth
        - rightPadding
        - titleX;


    let taskY =
        y + 145;


    const maxVisibleTasks =
        5;


    tasks
        .slice(
            0,
            maxVisibleTasks
        )
        .forEach(
            task => {

                /* ВРЕМЯ */

                context.fillStyle =
                    gold;

                context.font =
                    "700 16px Arial";


                context.fillText(
                    task.start,
                    timeX,
                    taskY + 17
                );


                /* CHECKBOX */

                drawImageCheckbox(
                    context,
                    checkboxX,
                    taskY,
                    task.completed,
                    colors
                );


                /* НАЗВАНИЕ */

                context.fillStyle =
                    task.completed
                        ? "#879398"
                        : dark;


                context.font =
                    task.completed
                        ? "15px Arial"
                        : "700 15px Arial";


                let lines =
                    wrapCanvasText(
                        context,
                        task.title,
                        titleWidth
                    );


                if (
                    lines.length > 2
                ) {

                    lines =
                        lines.slice(
                            0,
                            2
                        );


                    lines[1] =
                        fitCanvasText(
                            context,
                            lines[1],
                            titleWidth - 10
                        );

                }


                lines.forEach(
                    (
                        line,
                        index
                    ) => {

                        context.fillText(
                            line,
                            titleX,
                            taskY
                            + 16
                            + index * 19
                        );

                    }
                );


                /* ИНТЕРВАЛ ВРЕМЕНИ */

                context.fillStyle =
                    gray;

                context.font =
                    "12px Arial";


                context.fillText(
                    task.start
                    + " — "
                    + task.end,
                    titleX,
                    taskY + 55
                );


                /* ЛИНИЯ */

                context.strokeStyle =
                    border;

                context.lineWidth =
                    1;

                context.beginPath();

                context.moveTo(
                    timeX,
                    taskY + 72
                );

                context.lineTo(
                    x
                    + cardWidth
                    - rightPadding,
                    taskY + 72
                );

                context.stroke();


                taskY +=
                    80;

            }
        );


    if (
        tasks.length >
        maxVisibleTasks
    ) {

        context.fillStyle =
            gray;

        context.font =
            "700 14px Arial";


        context.fillText(
            "+ ещё "
            + (
                tasks.length
                -
                maxVisibleTasks
            )
            + " дел",
            x + 25,
            y
            + cardHeight
            - 20
        );

    }

}


/* =========================================================
   КАРТОЧКА НЕДЕЛЬНЫХ ЗАДАЧ

   ОНА ИМЕЕТ ТОЧНО ТАКОЙ ЖЕ РАЗМЕР,
   КАК КАРТОЧКА СРЕДЫ, ПЯТНИЦЫ И Т.Д.
   ========================================================= */

function drawWeeklyTasksCard(
    context,
    x,
    y,
    cardWidth,
    cardHeight,
    tasks,
    colors
) {

    const {
        dark,
        gold,
        white,
        gray,
        light,
        border
    } = colors;


    /* ФОН */

    context.fillStyle =
        light;


    drawRoundedRectangle(
        context,
        x,
        y,
        cardWidth,
        cardHeight,
        25
    );


    /* ШАПКА */

    context.fillStyle =
        dark;


    context.beginPath();

    context.roundRect(
        x,
        y,
        cardWidth,
        100,
        [
            25,
            25,
            0,
            0
        ]
    );

    context.fill();


    /* ЗАГОЛОВОК */

    context.fillStyle =
        gold;

    context.font =
        "700 21px Arial";


    context.fillText(
        "ЗАДАЧИ НА НЕДЕЛЮ",
        x + 25,
        y + 40
    );


    /* ПРОГРЕСС */

    const completed =
        tasks.filter(
            task =>
                task.completed === true
        ).length;


    context.fillStyle =
        white;

    context.font =
        "17px Arial";


    context.fillText(
        completed
        + " из "
        + tasks.length
        + " выполнено",
        x + 25,
        y + 72
    );


    /* ПУСТО */

    if (!tasks.length) {

        context.fillStyle =
            "#9aa5aa";

        context.font =
            "16px Arial";


        context.fillText(
            "Нет задач на неделю",
            x + 25,
            y + 150
        );

        return;

    }


    /* ЗАДАЧИ */

    const contentX =
        x + 25;

    const checkboxSize =
        22;

    const titleX =
        contentX
        + checkboxSize
        + 16;

    const titleWidth =
        cardWidth
        - 25
        - 25
        - checkboxSize
        - 16;


    let taskY =
        y + 145;


    const maxVisibleTasks =
        6;


    tasks
        .slice(
            0,
            maxVisibleTasks
        )
        .forEach(
            task => {

                /* CHECKBOX */

                drawImageCheckbox(
                    context,
                    contentX,
                    taskY,
                    task.completed,
                    colors
                );


                /* НАЗВАНИЕ */

                context.fillStyle =
                    task.completed
                        ? "#879398"
                        : dark;


                context.font =
                    task.completed
                        ? "15px Arial"
                        : "700 15px Arial";


                let lines =
                    wrapCanvasText(
                        context,
                        task.title,
                        titleWidth
                    );


                if (
                    lines.length > 2
                ) {

                    lines =
                        lines.slice(
                            0,
                            2
                        );


                    lines[1] =
                        fitCanvasText(
                            context,
                            lines[1],
                            titleWidth - 10
                        );

                }


                lines.forEach(
                    (
                        line,
                        index
                    ) => {

                        context.fillText(
                            line,
                            titleX,
                            taskY
                            + 16
                            + index * 19
                        );

                    }
                );


                /* ЛИНИЯ */

                context.strokeStyle =
                    border;

                context.lineWidth =
                    1;

                context.beginPath();

                context.moveTo(
                    contentX,
                    taskY + 55
                );

                context.lineTo(
                    x
                    + cardWidth
                    - 25,
                    taskY + 55
                );

                context.stroke();


                taskY +=
                    65;

            }
        );


    if (
        tasks.length >
        maxVisibleTasks
    ) {

        context.fillStyle =
            gray;

        context.font =
            "700 14px Arial";


        context.fillText(
            "+ ещё "
            + (
                tasks.length
                -
                maxVisibleTasks
            )
            + " задач",
            x + 25,
            y
            + cardHeight
            - 20
        );

    }

}


/* =========================================================
   СОЗДАНИЕ КАРТИНКИ НЕДЕЛИ
   ========================================================= */

function createWeekImage(mode = "png") {
    // На iPhone вкладку предпросмотра открываем сразу по нажатию,
    // иначе Safari может заблокировать её как всплывающее окно.
    const pdfWindow = mode === "pdf" ? window.open("", "_blank") : null;
    if (pdfWindow) {
        pdfWindow.document.write("<title>Подготовка PDF</title><p style='font:18px Arial;padding:30px'>Подготавливаем план недели…</p>");
    }

    const monday =
        getMonday(
            plannerCurrentDate
        );


    const weekDates = [];


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        weekDates.push(
            new Date(
                monday.getFullYear(),
                monday.getMonth(),
                monday.getDate() + i
            )
        );

    }


    const sunday =
        weekDates[6];


    const weekKey =
        dateToKey(monday);


    const weekTasksForImage =
        weeklyTasks[
            weekKey
        ] || [];


    /* CANVAS */

    const canvas =
        document.createElement(
            "canvas"
        );


    const ctx =
        canvas.getContext("2d");


    canvas.width =
        2000;

    canvas.height =
        1500;


    /* ЦВЕТА */

    const colors = {

        dark:
            "#013c4c",

        gold:
            "#fbbf65",

        goldLight:
            "#ffd080",

        background:
            "#f3f5f7",

        white:
            "#ffffff",

        gray:
            "#66777d",

        light:
            "#f7f9fa",

        border:
            "#dce3e5"

    };


    /* ФОН */

    ctx.fillStyle =
        colors.background;

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    /* БЕЛЫЙ ЛИСТ */

    ctx.fillStyle =
        colors.white;


    drawRoundedRectangle(
        ctx,
        45,
        25,
        1910,
        1450,
        35
    );


    /* ВЕРХНЯЯ ШАПКА */

    ctx.fillStyle =
        colors.dark;


    ctx.beginPath();

    ctx.roundRect(
        45,
        25,
        1910,
        200,
        [
            35,
            35,
            0,
            0
        ]
    );

    ctx.fill();


    /* МОЯ НЕДЕЛЯ */

    ctx.fillStyle =
        colors.gold;

    ctx.font =
        "700 62px Arial";


    ctx.fillText(
        "МОЯ НЕДЕЛЯ",
        105,
        115
    );


    /* ДИАПАЗОН ДАТ */

    ctx.fillStyle =
        colors.white;

    ctx.font =
        "28px Arial";


    const dateRange =
        padNumber(
            monday.getDate()
        )
        + "."
        + padNumber(
            monday.getMonth() + 1
        )
        + " — "
        + padNumber(
            sunday.getDate()
        )
        + "."
        + padNumber(
            sunday.getMonth() + 1
        )
        + " "
        + sunday.getFullYear();


    ctx.fillText(
        dateRange,
        108,
        170
    );


    /* =====================================================
       СЕТКА

       ПН | ВТ | СР | ЧТ
       ПТ | СБ | ВС | ЗАДАЧИ
       ===================================================== */

    const leftMargin =
        85;

    const rightMargin =
        85;

    const columnGap =
        24;

    const rowGap =
        35;


    const cardsAreaWidth =
        canvas.width
        -
        leftMargin
        -
        rightMargin;


    const cardWidth =
        (
            cardsAreaWidth
            -
            columnGap * 3
        )
        / 4;


    const cardHeight =
        520;


    const firstRowY =
        270;


    const secondRowY =
        firstRowY
        + cardHeight
        + rowGap;


    const weekdays = [
        "ПОНЕДЕЛЬНИК",
        "ВТОРНИК",
        "СРЕДА",
        "ЧЕТВЕРГ",
        "ПЯТНИЦА",
        "СУББОТА",
        "ВОСКРЕСЕНЬЕ"
    ];


    /* 7 ДНЕЙ */

    weekDates.forEach(
        (
            date,
            index
        ) => {

            let row;
            let column;


            if (index < 4) {

                row = 0;
                column = index;

            }
            else {

                row = 1;
                column = index - 4;

            }


            const x =
                leftMargin
                +
                column
                *
                (
                    cardWidth
                    + columnGap
                );


            const y =
                row === 0
                    ? firstRowY
                    : secondRowY;


            const dateKey =
                dateToKey(date);


            const tasks =
                sortPlannerTasks(
                    plannerTasks[
                        dateKey
                    ] || []
                );


            drawDayCard(
                ctx,
                date,
                weekdays[index],
                x,
                y,
                cardWidth,
                cardHeight,
                tasks,
                colors
            );

        }
    );


    /* =====================================================
       ЗАДАЧИ НА НЕДЕЛЮ —
       ЧЕТВЁРТАЯ КАРТОЧКА ВНИЗУ
       ===================================================== */

    const weeklyCardX =
        leftMargin
        +
        3
        *
        (
            cardWidth
            + columnGap
        );


    drawWeeklyTasksCard(
        ctx,
        weeklyCardX,
        secondRowY,
        cardWidth,
        cardHeight,
        weekTasksForImage,
        colors
    );


    /* ПОДПИСЬ */

    ctx.fillStyle =
        "#879398";

    ctx.font =
        "17px Arial";

    ctx.textAlign =
        "center";


    ctx.fillText(
        "План на неделю",
        canvas.width / 2,
        1435
    );


    ctx.textAlign =
        "left";


    /* =====================================================
       СКАЧИВАНИЕ PNG
       ===================================================== */

    if (mode === "pdf") {
        try {
            const pdf = createWeekPdf(canvas);
            const url = URL.createObjectURL(pdf);
            if (pdfWindow) {
                pdfWindow.location.replace(url);
            } else {
                const link = document.createElement("a");
                link.href = url;
                link.download = "моя_неделя_" + dateToKey(monday) + ".pdf";
                link.click();
            }
            // Не освобождаем URL слишком рано: Safari должен успеть открыть PDF.
            setTimeout(() => URL.revokeObjectURL(url), 120000);
        } catch (error) {
            if (pdfWindow) pdfWindow.close();
            console.error(error);
            alert("Не удалось открыть PDF. Попробуйте ещё раз.");
        }
        return;
    }

    if (mode === "photo") {
        canvas.toBlob(async blob => {
            if (!blob) return alert("Не удалось подготовить изображение.");
            const filename = "моя_неделя_" + dateToKey(monday) + ".png";
            const file = new File([blob], filename, { type: "image/png" });
            try {
                if (navigator.canShare?.({ files: [file] })) {
                    await navigator.share({ files: [file], title: "Моя неделя" });
                } else {
                    const url = URL.createObjectURL(blob);
                    window.open(url, "_blank");
                    setTimeout(() => URL.revokeObjectURL(url), 120000);
                }
            } catch (error) {
                if (error.name !== "AbortError") alert("Не удалось открыть меню сохранения.");
            }
        }, "image/png");
        return;
    }

    canvas.toBlob(
        blob => {

            if (!blob) {

                alert(
                    "Не удалось создать изображение."
                );

                return;

            }


            const url =
                URL.createObjectURL(
                    blob
                );


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                url;


            link.download =
                "моя_неделя_"
                + dateToKey(monday)
                + "_"
                + dateToKey(sunday)
                + ".png";


            document.body.appendChild(
                link
            );


            link.click();

            link.remove();


            setTimeout(
                () => {

                    URL.revokeObjectURL(
                        url
                    );

                },
                1000
            );

        },
        "image/png"
    );

}


// Формируем настоящий одностраничный PDF с изображением недельного плана.
// Не требуются внешние библиотеки или подключение к сторонним сайтам.
function createWeekPdf(canvas) {
    const encoded = canvas.toDataURL("image/jpeg", 0.92).split(",")[1];
    const binary = atob(encoded);
    const jpeg = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) jpeg[i] = binary.charCodeAt(i);
    const encoder = new TextEncoder();
    const parts = [];
    const offsets = [0];
    let length = 0;
    function append(value) {
        const bytes = typeof value === "string" ? encoder.encode(value) : value;
        parts.push(bytes);
        length += bytes.length;
    }
    function object(number, value) {
        offsets[number] = length;
        append(`${number} 0 obj\n${value}\nendobj\n`);
    }
    append("%PDF-1.4\n");
    object(1, "<< /Type /Catalog /Pages 2 0 R >>");
    object(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
    object(3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 1000 750] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>");
    offsets[4] = length;
    append(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
    append(jpeg);
    append("\nendstream\nendobj\n");
    const drawing = "q\n1000 0 0 750 0 0 cm\n/Im0 Do\nQ\n";
    object(5, `<< /Length ${encoder.encode(drawing).length} >>\nstream\n${drawing}endstream`);
    const xref = length;
    append("xref\n0 6\n0000000000 65535 f \n");
    for (let i = 1; i <= 5; i++) append(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
    append(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
    return new Blob(parts, { type: "application/pdf" });
}

const isPhonePlanner = () => window.matchMedia("(max-width: 750px)").matches;
saveWeekImage.addEventListener("click", () => createWeekImage(isPhonePlanner() ? "pdf" : "png"));

// Отдельная возможность сохранить недельный план в галерею iPhone.
const saveWeekPhoto = document.getElementById("saveWeekPhoto");
if (saveWeekPhoto) {
    saveWeekPhoto.addEventListener("click", () => createWeekImage("photo"));
}



/* =========================================================
   ESC
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !== "Escape"
        ) {

            return;

        }


        if (
            plannerModal
                .classList
                .contains("active")
        ) {

            closePlannerTaskModal();

            return;

        }


        if (
            taskModal
                .classList
                .contains("active")
        ) {

            closeCalendarModal();

            return;

        }


        searchResults
            .classList
            .remove("active");

    }
);




/* =========================================================
   ТРЕКЕР ПРИВЫЧЕК
   ========================================================= */

const habitNameInput = document.getElementById("habitNameInput");
const addHabitButton = document.getElementById("addHabitButton");
const habitsList = document.getElementById("habitsList");
const habitSelectedDate = document.getElementById("habitSelectedDate");
const habitSelectedWeekday = document.getElementById("habitSelectedWeekday");
const habitDayProgress = document.getElementById("habitDayProgress");
const habitWeekProgress = document.getElementById("habitWeekProgress");
const habitMonthProgress = document.getElementById("habitMonthProgress");
const habitPrevDay = document.getElementById("habitPrevDay");
const habitNextDay = document.getElementById("habitNextDay");
const habitToday = document.getElementById("habitToday");

let habitDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
let habits = [];
let habitLogs = {};

try {
    habits = JSON.parse(localStorage.getItem("plannerHabits") || "[]");
    habitLogs = JSON.parse(localStorage.getItem("plannerHabitLogs") || "{}");
    if (!Array.isArray(habits)) habits = [];
    if (!habitLogs || typeof habitLogs !== "object") habitLogs = {};
} catch (error) {
    habits = [];
    habitLogs = {};
}

function saveHabits() {
    localStorage.setItem("plannerHabits", JSON.stringify(habits));
    localStorage.setItem("plannerHabitLogs", JSON.stringify(habitLogs));
}

function getHabitWeekDates(date) {
    const monday = getMonday(date);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return dateToKey(d);
    });
}

function getHabitMonthDates(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const count = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: count }, (_, i) => dateToKey(new Date(year, month, i + 1)));
}

function habitCompletionPercent(dateKeys) {
    if (!habits.length || !dateKeys.length) return 0;
    let completed = 0;
    const possible = habits.length * dateKeys.length;
    dateKeys.forEach(key => habits.forEach(habit => {
        if (habitLogs[habit.id]?.[key] === true) completed++;
    }));
    return Math.round((completed / possible) * 100);
}

function renderHabits() {
    const key = dateToKey(habitDate);
    habitSelectedDate.textContent = formatDateKey(key);
    habitSelectedWeekday.textContent = weekdayNames[habitDate.getDay()];

    const doneToday = habits.filter(h => habitLogs[h.id]?.[key] === true).length;
    habitDayProgress.textContent = `${doneToday} из ${habits.length}`;
    const selectedKey = dateToKey(habitDate);
    const weekToDate = getHabitWeekDates(habitDate).filter(d => d <= selectedKey);
    const monthToDate = getHabitMonthDates(habitDate).filter(d => d <= selectedKey);
    habitWeekProgress.textContent = `${habitCompletionPercent(weekToDate)}%`;
    habitMonthProgress.textContent = `${habitCompletionPercent(monthToDate)}%`;

    habitsList.innerHTML = "";
    if (!habits.length) {
        const empty = document.createElement("div");
        empty.className = "habits-empty";
        empty.textContent = "Пока нет привычек. Добавьте первую привычку выше.";
        habitsList.appendChild(empty);
        return;
    }

    habits.forEach(habit => {
        const card = document.createElement("article");
        card.className = "habit-card";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "habit-checkbox";
        checkbox.checked = habitLogs[habit.id]?.[key] === true;
        checkbox.setAttribute("aria-label", `Отметить привычку: ${habit.title}`);
        checkbox.addEventListener("change", () => {
            if (!habitLogs[habit.id]) habitLogs[habit.id] = {};
            if (checkbox.checked) habitLogs[habit.id][key] = true;
            else delete habitLogs[habit.id][key];
            saveHabits();
            renderHabits();
        });

        const title = document.createElement("div");
        title.className = "habit-card-title";
        title.textContent = habit.title;

        const meta = document.createElement("div");
        meta.className = "habit-card-meta";
        const monthDates = getHabitMonthDates(habitDate);
        const monthDone = monthDates.filter(d => habitLogs[habit.id]?.[d] === true).length;
        meta.textContent = `В этом месяце: ${monthDone} дн. из ${monthDates.length}`;

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "habit-delete";
        remove.textContent = "Удалить";
        remove.addEventListener("click", () => {
            if (!confirm(`Удалить привычку «${habit.title}» и её историю?`)) return;
            habits = habits.filter(item => item.id !== habit.id);
            delete habitLogs[habit.id];
            saveHabits();
            renderHabits();
        });

        const info = document.createElement("div");
        info.className = "habit-card-info";
        info.append(title, meta);
        card.append(checkbox, info, remove);
        if (checkbox.checked) card.classList.add("is-completed");
        habitsList.appendChild(card);
    });
}

function addHabit() {
    const title = habitNameInput.value.trim();
    if (!title) {
        habitNameInput.focus();
        return;
    }
    if (habits.some(h => h.title.toLocaleLowerCase() === title.toLocaleLowerCase())) {
        alert("Такая привычка уже существует.");
        return;
    }
    habits.push({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, title });
    habitNameInput.value = "";
    saveHabits();
    renderHabits();
    habitNameInput.focus();
}

addHabitButton.addEventListener("click", addHabit);
habitNameInput.addEventListener("keydown", event => {
    if (event.key === "Enter") addHabit();
});
habitPrevDay.addEventListener("click", () => {
    habitDate.setDate(habitDate.getDate() - 1);
    renderHabits();
});
habitNextDay.addEventListener("click", () => {
    habitDate.setDate(habitDate.getDate() + 1);
    renderHabits();
});
habitToday.addEventListener("click", () => {
    habitDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    renderHabits();
});


/* =========================================================
   ЗАПУСК
   ========================================================= */

renderCalendar();

renderDayPlanner();


const savedPage =
    localStorage.getItem(
        "activePlannerPage"
    );


if (savedPage === "planner") {
    showPlannerPage();
} else if (savedPage === "habits") {
    showHabitsPage();
} else {
    showCalendarPage();
}