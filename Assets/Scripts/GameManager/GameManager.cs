using UnityEngine;
using UnityEngine.UI;
using System.Collections;

public class GameManager : MonoBehaviour
{
    [Header("Game Settings")]
    public float gameTime = 300f; // 5 menit
    public int totalQuestions = 10;
    
    [Header("UI References")]
    public GameObject mainMenuUI;
    public GameObject gameUI;
    public GameObject pauseUI;
    public GameObject quizUI;
    public Text scoreText;
    public Text timeText;
    public Text questionText;
    public Button[] answerButtons;
    
    [Header("Game State")]
    public bool isGameActive = false;
    public bool isPaused = false;
    public int currentScore = 0;
    public int currentQuestion = 0;
    public float timeRemaining;
    
    [Header("Player Reference")]
    public GameObject player;
    
    private QuizManager quizManager;
    private PlayerController playerController;
    
    public static GameManager Instance { get; private set; }
    
    void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }
    
    void Start()
    {
        timeRemaining = gameTime;
        quizManager = GetComponent<QuizManager>();
        playerController = player.GetComponent<PlayerController>();
        
        ShowMainMenu();
    }
    
    void Update()
    {
        if (isGameActive && !isPaused)
        {
            UpdateTimer();
            HandleInput();
        }
    }
    
    void UpdateTimer()
    {
        timeRemaining -= Time.deltaTime;
        timeText.text = "Waktu: " + Mathf.Ceil(timeRemaining).ToString();
        
        if (timeRemaining <= 0)
        {
            EndGame();
        }
    }
    
    void HandleInput()
    {
        if (Input.GetKeyDown(KeyCode.Escape))
        {
            TogglePause();
        }
    }
    
    public void StartGame()
    {
        isGameActive = true;
        isPaused = false;
        currentScore = 0;
        currentQuestion = 0;
        timeRemaining = gameTime;
        
        mainMenuUI.SetActive(false);
        gameUI.SetActive(true);
        pauseUI.SetActive(false);
        
        playerController.enabled = true;
        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;
        
        UpdateUI();
    }
    
    public void PauseGame()
    {
        isPaused = true;
        Time.timeScale = 0f;
        pauseUI.SetActive(true);
        Cursor.lockState = CursorLockMode.None;
        Cursor.visible = true;
    }
    
    public void ResumeGame()
    {
        isPaused = false;
        Time.timeScale = 1f;
        pauseUI.SetActive(false);
        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;
    }
    
    public void TogglePause()
    {
        if (isPaused)
            ResumeGame();
        else
            PauseGame();
    }
    
    public void ShowMainMenu()
    {
        isGameActive = false;
        isPaused = false;
        Time.timeScale = 1f;
        
        mainMenuUI.SetActive(true);
        gameUI.SetActive(false);
        pauseUI.SetActive(false);
        quizUI.SetActive(false);
        
        playerController.enabled = false;
        Cursor.lockState = CursorLockMode.None;
        Cursor.visible = true;
    }
    
    public void AddScore(int points)
    {
        currentScore += points;
        UpdateUI();
    }
    
    public void StartQuiz()
    {
        quizUI.SetActive(true);
        quizManager.StartQuiz();
    }
    
    public void EndQuiz()
    {
        quizUI.SetActive(false);
    }
    
    public void EndGame()
    {
        isGameActive = false;
        Time.timeScale = 1f;
        
        // Show final score
        Debug.Log("Game Over! Final Score: " + currentScore);
        
        ShowMainMenu();
    }
    
    void UpdateUI()
    {
        scoreText.text = "Skor: " + currentScore.ToString();
    }
    
    public void QuitGame()
    {
        Application.Quit();
    }
}
