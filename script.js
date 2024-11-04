document.addEventListener("DOMContentLoaded", async function() {
  const wisdomPointsElement = document.getElementById('wisdom');
  const rankElement = document.getElementById('rank-title');
  const questionNumberElement = document.getElementById('question-number');
  const questionDescriptionElement = document.getElementById('question-description');
  const optionsElement = document.getElementById('options');
  const themeElement = document.getElementById('theme');
  const restartButton = document.getElementById('restart-btn');
  const forwardButton = document.getElementById('next-btn');
  const backButton = document.getElementById('prev-btn');

  forwardButton.textContent = '▶';
  backButton.textContent = '◀';
  forwardButton.classList.add('nav-btn');
  backButton.classList.add('nav-btn');

  let questions = [];
  let currentQuestionIndex = 0;
  let wisdomPoints = 0;
  let currentTheme = '';
  let themes = {}; // Объект для хранения вопросов, сгруппированных по темам

  // Добавление визуальной отладки
  function displayMessage(message) {
      const debugElement = document.getElementById('debug');
      if (debugElement) {
          debugElement.textContent = message;
      } else {
          console.log(message);
      }
  }

  // Загрузка данных из Excel
  async function loadQuestions() {
      try {
          const response = await fetch('database.xlsx');
          if (!response.ok) {
              throw new Error('Ошибка при загрузке файла.');
          }
          const data = await response.arrayBuffer();
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

          // Группировка вопросов по темам
          jsonData.slice(1).forEach(row => {
              const themeName = row[1];
              if (themeName) {
                  const question = {
                      questionNumber: row[2],
                      description: row[3],
                      correctAnswer: row[4],
                      wrongAnswers: row[5] ? row[5].split(',').map(ans => ans.trim().replace(/^\*|\*$/g, '')) : []
                  };

                  if (!themes[themeName]) {
                      themes[themeName] = [];
                  }
                  themes[themeName].push(question);
              }
          });

          if (Object.keys(themes).length === 0) {
              throw new Error('Темы не загружены или файл пустой.');
          }

          // Восстановление последней темы из localStorage или установка темы по умолчанию
          currentTheme = localStorage.getItem('currentTheme') || Object.keys(themes)[0];
          if (!currentTheme || !themes[currentTheme]) {
              currentTheme = Object.keys(themes)[0]; // Устанавливаем первую тему по умолчанию
          }
          questions = themes[currentTheme];
          themeElement.textContent = `Тема: ${currentTheme}`;
          loadProgress();
          showQuestion();
      } catch (error) {
          displayMessage(`Ошибка при загрузке данных: ${error.message}`);
      }
  }

  function showQuestion() {
      if (!questions || questions.length === 0) {
          displayMessage('Вопросы не загружены или пусты');
          return;
      }

      const question = questions[currentQuestionIndex];
      if (!question) {
          displayMessage(`Неверный индекс вопроса: ${currentQuestionIndex}`);
          return;
      }

      questionNumberElement.textContent = `Вопрос ${question.questionNumber}`;
      questionDescriptionElement.textContent = question.description;
      optionsElement.innerHTML = '';

      const allOptions = [...question.wrongAnswers, question.correctAnswer];
      shuffleArray(allOptions);

      allOptions.forEach(option => {
          const button = document.createElement('button');
          button.textContent = option;
          button.addEventListener('click', () => checkAnswer(option === question.correctAnswer));
          optionsElement.appendChild(button);
      });
  }

  function checkAnswer(isCorrect) {
      if (isCorrect) {
          wisdomPoints++;
      } else {
          wisdomPoints = Math.max(0, wisdomPoints - 1);
      }

      if (currentQuestionIndex < questions.length - 1) {
          currentQuestionIndex++;
          showQuestion();
      } else {
          document.getElementById('main').innerHTML = '<div id="result">Тест завершен!</div>';
          setTimeout(() => {
              location.reload(); // Перезагружает страницу через 8 секунд
              resetProgress(); // Сбрасывает прогресс и очки
          }, 8000);
      }

      updateRank();
      saveProgress();
  }

  function updateRank() {
      wisdomPointsElement.textContent = wisdomPoints;
      let rank;
      if (wisdomPoints <= 0) {
          rank = 'В ожидании ...';
      } else if (wisdomPoints >= 1 && wisdomPoints <= 2) {
          rank = 'Поверхностно';
      } else if (wisdomPoints >= 3 && wisdomPoints <= 4) {
          rank = 'Глубоко';
      } else if (wisdomPoints >= 5) {
          rank = 'Полностью';
      }
      rankElement.textContent = rank;
  }

  function saveProgress() {
      const progress = {
          currentQuestionIndex,
          wisdomPoints,
          currentTheme
      };
      localStorage.setItem(`quizProgress_${currentTheme}`, JSON.stringify(progress));
      localStorage.setItem('currentTheme', currentTheme);
  }

  function loadProgress() {
      const savedProgress = localStorage.getItem(`quizProgress_${currentTheme}`);
      if (savedProgress) {
          const progress = JSON.parse(savedProgress);
          currentQuestionIndex = progress.currentQuestionIndex || 0;
          wisdomPoints = progress.wisdomPoints || 0;
          updateRank();
      }
  }

  function resetProgress() {
      currentQuestionIndex = 0;
      wisdomPoints = 0;
      updateRank();
      showQuestion();
      saveProgress();
  }

  forwardButton.addEventListener('click', () => navigateTheme(1));
  backButton.addEventListener('click', () => navigateTheme(-1));
  restartButton.addEventListener('click', () => {
      resetProgress();
      showQuestion();
  });

  function navigateTheme(direction) {
      const themeNames = Object.keys(themes);
      let currentIndex = themeNames.indexOf(currentTheme);
      currentIndex = (currentIndex + direction + themeNames.length) % themeNames.length;
      currentTheme = themeNames[currentIndex];
      questions = themes[currentTheme];
      themeElement.textContent = `Тема: ${currentTheme}`;
      saveProgress(); // Сохраняем текущую тему при переключении
      resetProgress();
  }

  function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
      }
  }

  loadQuestions();
});

const helpButton = document.getElementById('helpButton');
        const popup = document.getElementById('popup');

        // Переключение видимости попапа при нажатии на кнопку
        helpButton.addEventListener('click', () => {
            popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
        });

        // Скрытие попапа при нажатии вне кнопки или попапа
        document.addEventListener('click', (event) => {
            if (!helpButton.contains(event.target) && !popup.contains(event.target)) {
                popup.style.display = 'none';
            }
        });