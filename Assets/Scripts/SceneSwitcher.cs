using UnityEngine;
using UnityEngine.SceneManagement;

public class AutoSceneSwitcher : MonoBehaviour
{
    [Header("Scene Settings")]
    public string nextSceneName;   // Name of next scene
    public float sceneDuration = 5f; // Time before switching

    void Start()
    {
        Invoke("LoadNextScene", sceneDuration);
    }

    void LoadNextScene()
    {
        SceneManager.LoadScene(nextSceneName);
    }
}