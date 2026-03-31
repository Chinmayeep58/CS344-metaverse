using UnityEngine;
using UnityEngine.SceneManagement;

public class LoadSceneOnSelect : MonoBehaviour
{
    public string nextSceneName = "EQ_Scene3";
    public float delay = 180f; // 3 minutes

    void Start()
    {
        Debug.Log("Scene will change in " + delay + " seconds");
        Invoke(nameof(LoadNextScene), delay);
    }

    void LoadNextScene()
    {
        Debug.Log("Loading next scene...");
        SceneManager.LoadScene(nextSceneName);
    }
}